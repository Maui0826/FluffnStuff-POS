import express from 'express';
import { dashboard } from '../controllers/dashboardController.js';

const router = express.Router();

router.route('/').get(dashboard);

export default router;
