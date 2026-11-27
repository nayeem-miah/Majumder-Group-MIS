import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import ApiError from '../errors/apiError';
import httpStatus from 'http-status';

/**
 * CSV files are parsed immediately after upload and then deleted, so they only
 * need a scratch location. Serverless platforms (Vercel) expose a read-only
 * project filesystem and only allow writes under the OS temp directory, so use
 * that everywhere instead of writing into the project folder.
 */
const uploadDir = path.join(os.tmpdir(), 'garmentflow-uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (error) {
  // Do not crash the whole API at import time if the temp dir is unavailable.
  console.error('Unable to create CSV upload temp directory:', error);
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
