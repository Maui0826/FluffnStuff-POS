import express from 'express';
import {
  banUserController,
  createUser,
  getAllUsers,
  suspendUserController,
  unbanUserController,
  updateUser,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:userId', updateUser);
router.post('/:id/ban', banUserController);
router.post('/:id/suspend', suspendUserController);
router.post('/:id/unban', unbanUserController);
export default router;
