import express, { Request } from 'express';
import { StudentController } from '../controllers/studentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import {
  createStudentSchema,
  updateStudentSchema,
} from '../validators/userValidator';
import { IUser, UserRole } from '../models/userModel';
import { errorHandler } from '../middlewares/errorHandler';
import multer from 'multer';
import path from 'path';

// Define file filter to check file type based on MIME type and file extension
const fileFilter = (req: Request, file: any, cb: any) => {
  if (!file) {
    return cb(new Error('No file provided'), false);
  }

  // Allowed file extensions
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Allowed MIME types for CSV, XLS, and XLSX
  // const allowedMimeTypes = [
  //   'text/csv',
  //   'application/vnd.ms-excel',
  //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // ];

  // Check both file extension and MIME type
  if (
    (fileExtension === '.csv' && file.mimetype === 'text/csv') ||
    (fileExtension === '.xls' &&
      file.mimetype === 'application/vnd.ms-excel') ||
    (fileExtension === '.xlsx' &&
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  ) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error(
        'Invalid file type. Only CSV, XLS, and XLSX files are allowed.'
      ),
      false
    ); // Reject file
  }
};

const router = express.Router();
const studentController = new StudentController();
const upload = multer({
  dest: 'upload/bulk-upload',
  fileFilter: fileFilter, // Attach the file filter
});

router.post(
  '/',
  authMiddleware([UserRole.Admin, UserRole.School]),
  validate(createStudentSchema),
  async (req, res, next) => {
    try {
      const result = await studentController.create(
        req.body,
        req.user as IUser
      );
      res.json(result);
    } catch (error: any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.put(
  '/:id',
  authMiddleware([UserRole.Admin, UserRole.School]),
  validate(updateStudentSchema),
  async (req, res, next) => {
    try {
      delete req.body.password;
      const result = await studentController.update(
        req.params.id,
        req.body,
        req.user as IUser
      );
      res.json(result);
    } catch (error: any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.delete(
  '/:id',
  authMiddleware([UserRole.Admin, UserRole.School]),
  async (req, res, next) => {
    try {
      const result = await studentController.delete(req.params.id);
      res.json(result);
    } catch (error: any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.get(
  '/:id',
  authMiddleware([UserRole.Admin, UserRole.School]),
  async (req, res, next) => {
    try {
      const result = await studentController.getById(
        req.params.id,
        req.user as IUser
      );
      res.json(result);
    } catch (error: any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.get(
  '/',
  authMiddleware([UserRole.Admin, UserRole.School]),
  async (req, res, next) => {
    try {
      const result = await studentController.getAll(
        req.query as any,
        req.user as IUser
      );
      res.json(result);
    } catch (error: any) {
      errorHandler(error, req, res, next);
    }
  }
);

router.post(
  '/bulk-upload',
  authMiddleware([UserRole.School]),
  upload.single('file'),
  async (req, res, next) => {
    // if (!req.file) {
    //     errorHandler('No file uploaded', req, res, next);
    // }
    try {
      const result = await studentController.bulkUpload(
        req.file as any,
        req.user as IUser
      );
      res.json(result);
    } catch (error: any) {
      errorHandler(error, req, res, next);
    }
  }
);

export { router as studentRouter };
