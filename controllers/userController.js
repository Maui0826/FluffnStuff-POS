import UserService from '../services/userService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/sendEmail.js';
import LogService from '../services/actionLogService.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
  // Apply defaults if queries are missing
  const {
    search = '', // no search by default
    sortBy = 'name', // default sort field
    sortOrder = 'asc', // default sort order
    limit = 10, // default limit
    page = 1, // default page
    ...filter // everything else becomes part of filter
  } = req.query;

  const data = { search, filter, sortBy, sortOrder, limit, page };
  const result = await UserService.getAllUsers(data);

  res.status(200).json({
    status: 'success',
    message:
      result.data.length > 0
        ? 'Users retrieved successfully'
        : 'No users found',
    ...result,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const { email, name, role } = req.body;

  if (!email || !name?.firstName || !name?.lastName) {
    return next(new AppError('Missing required fields', 400));
  }

  // Create user with hashed password but keep plain password for email
  const { newUser, plainPassword } =
    await UserService.createUserWithCredentials({
      email,
      name,
      role: role || 'user',
    });

  // Send email with credentials
  await sendEmail({
    email: newUser.email,
    subject: 'Your New Account Details',
    message:
      `Hello ${newUser.name.firstName},\n\n` +
      `Your account has been created.\n\n` +
      `Username: ${newUser.email}\n` +
      `Password: ${plainPassword}\n\n` +
      `Please log in and change your password immediately.`,
  });

  //  Create action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Create User',
    target: 'User',
    description: `Created user ${newUser.name.firstName} ${newUser.name.lastName} (${newUser.email}) with role "${newUser.role}"`,
  });

  res.status(201).json({
    status: 'success',
    message: 'User created and credentials sent to email',
    data: {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
  });
});

export const banUserController = catchAsync(async (req, res) => {
  const user = await UserService.banUser(req.params.id);
  if (!user)
    return next(new AppError('User not found or cannot be banned', 400));

  // Action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Ban User',
    target: 'User',
    description: `Banned user ${user.name.firstName} ${user.name.lastName} (${user.email})`,
  });

  res.status(200).json({ message: 'User banned successfully', data: user });
});

export const suspendUserController = catchAsync(async (req, res) => {
  // Ensure req.body exists
  const { durationDays } = req.body || {};

  // Default to 7 days if durationDays is missing or invalid
  const suspensionDays =
    !durationDays || isNaN(durationDays) || durationDays <= 0
      ? 7
      : durationDays;

  // Call the service to suspend the user
  const user = await UserService.suspendUser(req.params.id, suspensionDays);
  if (!user)
    return next(new AppError('User not found or cannot be suspended', 400));

  // Action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Suspend User',
    target: 'User',
    description: `Suspended user ${user.name.firstName} ${user.name.lastName} (${user.email}) for ${suspensionDays} day(s)`,
  });

  res.status(200).json({
    message: `User suspended successfully for ${suspensionDays} day(s)`,
    data: user,
  });
});

export const unbanUserController = catchAsync(async (req, res) => {
  const user = await UserService.unbanUser(req.params.id);
  if (!user)
    return next(new AppError('User not found or cannot be unbanned', 400));

  // Action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Unban User',
    target: 'User',
    description: `Unbanned user ${user.name.firstName} ${user.name.lastName} (${user.email})`,
  });

  res.status(200).json({ message: 'User unbanned successfully', data: user });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params; // assuming route: /users/:userId
  const updates = req.body;

  if (!userId) return next(new AppError('User ID required', 400));

  const { user, plainPassword } = await UserService.updateUser(userId, updates);

  // Send email if password updated
  if (plainPassword) {
    await sendEmail({
      email: user.email,
      subject: 'Your Account Password Was Updated',
      message:
        `Hello ${user.name.firstName},\n\n` +
        `Your account password has been updated.\n\n` +
        `New Password: ${plainPassword}\n\n` +
        `If you did not request this change, please contact support immediately.`,
    });
  }

  // Action log
  await LogService.createActionLog({
    user: req.currentUser?.id,
    action: 'Update User',
    target: 'User',
    description: `Updated user ${user.name.firstName} ${user.name.lastName} (${user.email})`,
  });

  res.status(200).json({
    status: 'success',
    message: `User updated${
      plainPassword ? ' and password sent to email' : ''
    }`,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});
