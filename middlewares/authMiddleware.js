import * as jwt from '../utils/jwtUtil.js';
import usersModel from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';

const protect = catchAsync(async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    res.redirect('/');
    return;
  }

  const decodedToken = jwt.verifyToken(token);

  const user = await usersModel.findOne({
    email: decodedToken.email,
  });

  if (!user) {
    res.redirect('/');
    return;
  }

  if (await user.isPasswordChanged(decodedToken.iat)) {
    res.redirect('/');
    return;
  }

  if (user.status === 'suspended') {
    if (user.suspendUntil && new Date() > new Date(user.suspendUntil)) {
      // Auto-unsuspend
      user.status = 'active';
      user.suspendUntil = null;
      await user.save();
    } else {
      // Redirect to suspended page with optional date
      res.redirect(
        `/status?suspended=true&until=${encodeURIComponent(user.suspendUntil)}`
      );
      return;
    }
  }

  if (user.status === 'banned') {
    // Redirect to banned page
    res.redirect('/status?banned=true');
    return;
  }

  req.currentUser = user;

  return next();
});

const refundAuth = (req, res, next) => {
  const token = req.cookies.refundAuthToken;
  if (!token) return res.redirect('/dashboard');

  try {
    const decoded = jwt.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/dashboard');
  }
};

const checkIfLoggedIn = catchAsync(async (req, res, next) => {
  const token = req.cookies.authToken;
  if (token) {
    const decodedToken = jwt.verifyToken(token, process.env.JWT_SECRET);

    const user = await usersModel.findOne({
      email: decodedToken.email,
    });

    if (!user) {
      return next();
    }

    if (await user.isPasswordChanged(decodedToken.iat)) {
      return next();
    }

    res.redirect('/dashboard');
    return;
  }

  return next();
});

export { protect, refundAuth, checkIfLoggedIn };
