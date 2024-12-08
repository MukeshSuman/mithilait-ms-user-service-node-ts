import express from 'express';
import { SchoolController } from '../controllers/schoolController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import {
  createSchoolSchema,
  updateSchoolSchema,
} from '../validators/userValidator';
import { IUser, UserRole } from '../models/userModel';
import { ApiError } from '../utils/apiResponse';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();
const schoolController = new SchoolController();

router.post(
  '/',
  authMiddleware([UserRole.Admin]),
  validate(createSchoolSchema),
  async (req, res, next) => {
    try {
      const result = await schoolController.create(req.body, req.user as IUser);
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.put(
  '/:id',
  authMiddleware([UserRole.Admin]),
  validate(updateSchoolSchema),
  async (req, res, next) => {
    try {
      delete req.body.password;
      const result = await schoolController.update(
        req.params.id,
        req.body,
        req.user as IUser
      );
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.delete(
  '/:id',
  authMiddleware([UserRole.Admin]),
  async (req, res, next) => {
    try {
      const result = await schoolController.delete(req.params.id);
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.get(
  '/:id',
  authMiddleware([UserRole.Admin, UserRole.School]),
  async (req, res, next) => {
    try {
      const result = await schoolController.getById(
        req.params.id,
        req.user as IUser
      );
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.get(
  '/',
  authMiddleware([UserRole.Admin, UserRole.School]),
  async (req, res, next) => {
    try {
      const result = await schoolController.getAll(
        req.query as any,
        req.user as IUser
      );
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);

export { router as schoolRouter };
