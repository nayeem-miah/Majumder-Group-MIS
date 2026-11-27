import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../errors/apiError';
import httpStatus from 'http-status';

const uploadDir = path.join(process.cwd(), '.tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'csv-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const csvUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/octet-stream';

    if (ext === '.csv' && isMimeCsv) {
      cb(null, true);
    } else {
      cb(new ApiError(httpStatus.BAD_REQUEST, 'Only CSV files (.csv) are allowed!'));
    }
  },
});
