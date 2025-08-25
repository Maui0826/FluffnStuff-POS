import express from 'express';
import { getSalesReportController } from '../controllers/reportController.js';
import { fetchOrderReport } from '../controllers/orderReportController.js';

const router = express.Router();

router.get('/sales', getSalesReportController);
router.get('/order', fetchOrderReport);

export default router;
