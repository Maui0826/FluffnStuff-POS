import express from 'express';
import {
  getAllActionTypes,
  getAllLogs,
} from '../controllers/actionLogController.js';

const router = express.Router();

router.get('/', getAllLogs);
router.get('/actions', getAllActionTypes);
export default router;
