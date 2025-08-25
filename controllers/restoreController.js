// controllers/restoreController.js
import fs from 'fs';
import multer from 'multer';
import { restoreDatabase } from '../services/restoreService.js';

// configure multer (store uploads in /uploads)
const upload = multer({ dest: 'uploads/' });
export const uploadMiddleware = upload.single('backupFile');

export const restoreDatabaseController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: 'error', message: 'No file uploaded' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const backupJson = JSON.parse(fileContent);

    const result = await restoreDatabase(backupJson);

    // remove uploaded file after processing
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      status: 'success',
      message: 'Database restored successfully',
      restored: result,
    });
  } catch (err) {
    next(err);
  }
};
