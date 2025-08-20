import multer from 'multer';
import path from 'path';
import fs from 'fs';

const imagePath = path.join(
  process.cwd(),
  'Images'
);

// Ensure the folder exists
if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagePath);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

export default upload;
