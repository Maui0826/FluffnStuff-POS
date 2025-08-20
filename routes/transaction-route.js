import express from 'express';
import {
  deleteTransaction,
  getAllTransaction,
  getTransactionHistory,
  getUserHistory,
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllTransaction);
router.get('/history', protect, getTransactionHistory);
router.get('/user', protect, getUserHistory);

router.delete('/:id/delete', protect, deleteTransaction);

export default router;
