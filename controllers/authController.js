import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import usersModel from '../models/userModel.js';
import * as jwt from '../utils/jwtUtil.js';
import LogService from '../services/actionLogService.js';
import sendEmail from '../utils/sendEmail.js';
import refundService from '../services/refundService.js';
const login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    const error = new AppError('Provide email and password for login', 400);
    return next(error);
  }

  const user = await usersModel
    .findOne({
      email,
    })
    .select('+password');
  if (!user) {
    const error = new AppError('User not found', 404);
    return next(error);
  }
  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  const token = jwt.generateToken(
    { email, role: user.role },
    process.env.LOGIN_EXP * 60 * 60 * 24 * 90
  );

  if (req.body.session) {
    res.cookie('authToken', token, {
      maxAge: process.env.LOGIN_EXP * 60 * 60 * 24 * 90,
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });
  } else {
    res.cookie('authToken', token, {
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });
  }

  // --- Action Log ---
  await LogService.createActionLog({
    user: user._id,
    action: 'Login',
    target: 'Authentication',
    description: `User ${user.name.firstName} ${user.name.lastName} (${user.email}) logged in successfully.`,
  });

  res.redirect('/dashboard');
  return;
});

export const refundLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const { token, user } = await refundService.refundLoginService(
      email,
      password
    );

    // Send token as httpOnly cookie
    res.cookie('refundAuthToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
      maxAge: process.env.REFUND_SESSION_EXP * 60 * 60 * 1000,
    });

    // --- Action Log ---
    await LogService.createActionLog({
      user: user._id,
      action: 'Login',
      target: 'Refund Authentication',
      description: `User ${user.name.firstName} ${user.name.lastName} (${user.email}) logged in for refund.`,
    });

    res
      .status(200)
      .json({ status: 'success', message: 'Logged in for refund', user });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
});

const logout = catchAsync(async (req, res, next) => {
  // Log the logout action if user info is available
  if (req.currentUser?.id) {
    await LogService.createActionLog({
      user: req.currentUser.id,
      action: 'Logout',
      target: 'Authentication',
      description: `User ${req.currentUser.name?.firstName || ''} ${
        req.currentUser.name?.lastName || ''
      } (${req.currentUser.email || ''}) logged out successfully.`,
    });
  }
  res.clearCookie('authToken');

  res.status(200).json({ msg: 'Logged out successfully' });
});

const personalDetails = catchAsync(async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    const error = new AppError('You are not authorized', 401);
    return next(error);
  }

  const decodedToken = jwt.verifyToken(token);

  if (!decodedToken) {
    const error = new AppError('Invalid token', 400);
    return next(error);
  }

  const user = await usersModel.findOne({ email: decodedToken.email }).lean();

  if (!user) {
    const error = new AppError('User not found', 404);
    return next(error);
  }

  res.status(200).json({
    message: 'User data retrieved',
    data: user,
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const updates = req.body;

  if (!updates) {
    const error = new AppError('Bad Request', 400);
    return next(error);
  }

  const user = await usersModel
    .findById(req.currentUser._id)
    .select('+password');

  if (updates.name) {
    user.name = updates.name;

    user.name.firstName =
      updates.name.firstName || req.currentUser.name.firstName;

    user.name.lastName = updates.name.lastName || req.currentUser.name.lastName;
  }

  if (updates.password) {
    if (!(await user.comparePassword(updates.currentPassword))) {
      const error = new AppError('Incorrect Current Password', 401);
      return next(error);
    }

    user.password = updates.password;
    user.passwordChangedAt = new Date();
  }

  await user.save();

  const token = jwt.generateToken(
    { email: user.email, role: user.role },
    process.env.LOGIN_EXP * 60 * 60 * 24 * 90
  );

  res.cookie('authToken', token, {
    maxAge: process.env.LOGIN_EXP * 60 * 60 * 24 * 90,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });

  // Create action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Update Profile',
    target: 'User',
    description: `User ${user.name.firstName} ${user.name.lastName} (${
      user.email
    }) updated their profile${updates.password ? ' and password' : ''}.`,
  });
  res.status(200).json({ msg: 'Update successful' });
});

const resetPasswordLink = catchAsync(async (req, res, next) => {
  const email = req.body.email;

  if (!email) {
    const error = new AppError('Bad request', 400);
    return next(error);
  }

  const user = await usersModel.findOne({
    email: email,
  });

  if (!user) {
    const error = new AppError('No account bound to this email', 404);
    return next(error);
  }

  const token = await jwt.generateToken({ email }, 300);
  let url = `${req.protocol}://${req.get('host')}/resetPassword?token=${token}`;

  await sendEmail({
    email: email,
    subject: 'Password Reset',
    message: `To reset your password, please follow the link below\n\n${url}`,
  });

  // Action log
  await LogService.createActionLog({
    user: user._id,
    action: 'Request Password Reset',
    target: 'User',
    description: `Password reset link requested for ${user.name.firstName} ${user.name.lastName} (${user.email})`,
  });

  res.status(200).json({
    msg: 'please check your email for the reset link',
  });
});

const passwordReset = catchAsync(async (req, res, next) => {
  const newPassword = req.body;

  if (!newPassword.newPassword) {
    const error = new AppError('Bad Request', 400);
    return next(error);
  }

  if (!newPassword.token) {
    const error = new AppError('Token not found', 400);
    return next(error);
  }

  const decodedToken = jwt.verifyToken(newPassword.token);

  const user = await usersModel.findOne({
    email: decodedToken.email,
  });

  user.password = newPassword.newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Action log
  await LogService.createActionLog({
    user: user._id,
    action: 'Reset Password',
    target: 'User',
    description: `Password reset for ${user.name.firstName} ${user.name.lastName} (${user.email})`,
  });

  // generate new token with same expiration logic
  const newToken = jwt.generateToken(
    { email: user.email, role: user.role },
    process.env.LOGIN_EXP * 60 * 60 * 24 * 90
  );

  res.cookie('authToken', newToken, {
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
  });

  res.status(200).json({ msg: 'Password has been reset' });
  return;
});

const updateEmailLink = catchAsync(async (req, res, next) => {
  const newEmail = req.body.email;

  if (!newEmail) {
    const error = new AppError('Bad Request', 400);
    return next(error);
  }

  const token = jwt.generateToken(
    { email: req.currentUser.email, newEmail },
    '3d'
  );

  let url = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/updateEmail?token=${token}`;

  await sendEmail({
    email: newEmail,
    subject: 'Update Email',
    message: `To update your email, please follow the link below\n\n${url}`,
  });

  // Action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Request Email Update',
    target: 'User',
    description: `Requested email update from ${req.currentUser.email} to ${newEmail}`,
  });

  res.status(200).json({
    msg: 'Verification email sent. please check your email to complete the update process',
  });
});

const updateEmail = catchAsync(async (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    const error = new AppError('Token not found', 404);
    return next(error);
  }

  const decodedToken = jwt.verifyToken(token);

  if (!decodedToken) {
    const error = new AppError('Invalid token', 400);
    return next(error);
  }

  const user = await usersModel.findOneAndUpdate(
    { email: decodedToken.email },
    {
      $set: { email: decodedToken.newEmail },
    },
    { new: true }
  );

  if (!user) {
    const error = new AppError('User not found', 404);
    return next(error);
  }

  // Action log
  await LogService.createActionLog({
    user: user._id,
    action: 'Update Email',
    target: 'User',
    description: `Email updated from ${decodedToken.email} to ${decodedToken.newEmail} for ${user.name.firstName} ${user.name.lastName}`,
  });

  const authToken = jwt.generateToken(
    { email: user.email, role: user.role },
    process.env.LOGIN_EXP * 60 * 60 * 24 * 90
  );

  res.cookie('authToken', authToken, {
    maxAge: process.env.LOGIN_EXP * 60 * 60 * 24 * 90,
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
  });

  res.redirect('/emailUpdate');
  return;
});

export {
  login,
  logout,
  personalDetails,
  updateUser,
  resetPasswordLink,
  passwordReset,
  updateEmail,
  updateEmailLink,
};
