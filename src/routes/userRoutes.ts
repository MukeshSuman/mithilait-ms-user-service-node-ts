import express from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
} from '../validators/userValidator';
import { IUser, UserRole } from '../models/userModel';
import { ApiError } from '../utils/apiResponse';
import { errorHandler } from '../middlewares/errorHandler';
import { toTitleCase } from '../utils/mix';

const router = express.Router();
const userController = new UserController();

router.post(
  '/',
  authMiddleware([UserRole.Admin, UserRole.School]),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const result = await userController.createUser(
        req.body,
        req.user as IUser
      );
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.put(
  '/:id',
  authMiddleware([UserRole.Admin, UserRole.School]),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      delete req.body.password;
      const result = await userController.updateUser(
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
  authMiddleware([UserRole.Admin, UserRole.School]),
  async (req, res, next) => {
    try {
      const result = await userController.deleteUser(req.params.id);
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);
router.get(
  '/:id',
  authMiddleware([UserRole.Admin, UserRole.Teacher, UserRole.Student]),
  async (req, res, next) => {
    try {
      const result = await userController.getUser(
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
      const result = await userController.getAll(
        req.query as any,
        req.user as IUser
      );
      res.json(result);
    } catch (error: ApiError | any) {
      errorHandler(error, req, res, next);
    }
  }
);

export { router as userRouter };
