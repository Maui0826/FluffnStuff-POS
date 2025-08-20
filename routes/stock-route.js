import express from 'express';
import { getAllOrders, updateStatus } from '../controllers/stockController.js';

const router = express.Router();

router.get('/orders', getAllOrders);
router.patch('/:id/status', updateStatus);

export default router;
