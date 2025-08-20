import express from 'express';
import {
  createTransaction,
  searchProduct,
} from '../controllers/posController.js';

const router = express.Router();

router.post('/search', searchProduct);

router.post('/transactions', createTransaction);

export default router;
