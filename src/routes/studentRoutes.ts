import express from 'express';
import { StudentController } from '../controllers/studentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createStudentSchema, updateStudentSchema } from '../validators/userValidator';
import { IUser, UserRole } from "../models/userModel";
import { ApiError } from "../utils/apiResponse";
import { errorHandler } from "../middlewares/errorHandler";

const router = express.Router();
const studentController = new StudentController();

router.post('/', authMiddleware([UserRole.Admin, UserRole.School]), validate(createStudentSchema), async (req, res, next) => {
    try {
        const result = await studentController.create(req.body, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.put('/:id', authMiddleware([UserRole.Admin, UserRole.School]), validate(updateStudentSchema), async (req, res, next) => {
    try {
        delete req.body.password;
        const result = await studentController.update(req.params.id, req.body, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.delete('/:id', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const result = await studentController.delete(req.params.id);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/:id', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const result = await studentController.getById(req.params.id, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const { pageNumber = 1, pageSize = 20 } = req.query;
        const query = req.query.query || "";
        const result = await studentController.getAll(+pageNumber, +pageSize, query as string, UserRole.Student, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});

export { router as studentRouter };