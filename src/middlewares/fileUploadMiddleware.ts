import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Create a multer storage that dynamically creates folder based on a request-provided path
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    // Extract folder path from request body or query
    const folderPath = req.body.folderPath || req.query.folderPath || 'default';

    const uploadDir = path.join(__dirname, '../../uploads', folderPath); // Create the full path

    // Check if directory exists, if not, create it
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory recursively
    }

    cb(null, uploadDir); // Set the destination folder
  },
  filename: (req: Request, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`; // Use timestamp and original file name
    cb(null, fileName);
  },
});

// Multer middleware to handle file uploads
export const dynamicUpload = multer({ storage });

// Middleware to handle multer errors
export const fileValidationErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};
