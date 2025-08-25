// routes/restoreRoutes.js
import express from 'express';
import {
  uploadMiddleware,
  restoreDatabaseController,
} from '../controllers/restoreController.js';

const router = express.Router();

router.post('/', uploadMiddleware, restoreDatabaseController);

export default router;
