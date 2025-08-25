// controllers/backupController.js
import { getDatabaseBackup } from '../services/backupService.js';
import archiver from 'archiver';
import { Parser as Json2CsvParser } from 'json2csv';

export const backupDatabase = async (req, res, next) => {
  try {
    const backup = await getDatabaseBackup();
    const format = req.query.format || 'zip';

    // ---- JSON BACKUP ----
    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify(backup, null, 2));
    }

    // ---- CSV BACKUP ----
    if (format === 'csv') {
      res.setHeader('Content-Disposition', 'attachment; filename=backup.zip');
      res.setHeader('Content-Type', 'application/zip');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      // Convert each collection to CSV and add to ZIP
      for (const [name, records] of Object.entries(backup.data)) {
        if (records.length === 0) {
          // Empty file if no records
          archive.append('', { name: `${name}.csv` });
        } else {
          const parser = new Json2CsvParser({ header: true });
          const csv = parser.parse(records);
          archive.append(csv, { name: `${name}.csv` });
        }
      }

      await archive.finalize();
      return;
    }

    // ---- ZIP BACKUP (default) ----
    if (format === 'zip') {
      res.setHeader('Content-Disposition', 'attachment; filename=backup.zip');
      res.setHeader('Content-Type', 'application/zip');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      archive.append(JSON.stringify(backup, null, 2), { name: 'backup.json' });

      await archive.finalize();
      return;
    }

    // ---- Unsupported format ----
    return res.status(400).json({
      status: 'error',
      message:
        'Unsupported format. Use ?format=json, ?format=zip, or ?format=csv',
    });
  } catch (err) {
    next(err);
  }
};
