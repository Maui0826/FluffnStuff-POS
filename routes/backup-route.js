// routes/backupRoutes.js
import express from 'express';
import { backupDatabase } from '../controllers/backupController.js';

const router = express.Router();

router.get('/', backupDatabase);

export default router;
