import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadConfig.js';

const router = express.Router();

// Authentication routes
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Authenticated user info and update
router
  .route('/me')
  .get(protect, authController.personalDetails)
  .patch(protect, authController.updateUser);

// Password reset
router
  .route('/resetPassword')
  .post(authController.resetPasswordLink)
  .patch(authController.passwordReset);

// Email update flow
router
  .route('/updateEmail')
  .post(protect, authController.updateEmailLink)
  .get(authController.updateEmail);

export default router;
