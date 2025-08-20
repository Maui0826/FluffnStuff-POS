import express from 'express';
import {
  fetchProduct,
  refundProduct,
  searchReceipt,
} from '../controllers/refundController.js';
import { refundLogin } from '../controllers/authController.js';
import { refundAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:id/refund', refundProduct);
router.post('/:receiptNum/search', searchReceipt);
router.get('/:receiptNum', fetchProduct);
router.post('/refund-login', refundAuth, refundLogin);
export default router;
