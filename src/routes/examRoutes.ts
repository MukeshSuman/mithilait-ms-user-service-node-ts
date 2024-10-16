import express from 'express';
import { ExamController } from '../controllers/examController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createExamSchema, updateExamSchema } from '../validators';
import { IUser, UserRole } from "../models/userModel";
import { ApiError } from "../utils/apiResponse";
import { errorHandler } from "../middlewares/errorHandler";

const router = express.Router();
const examController = new ExamController();

router.post('/', authMiddleware([UserRole.Admin, UserRole.School]), validate(createExamSchema), async (req, res, next) => {
    try {
        const result = await examController.create(req.body, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.put('/:id', authMiddleware([UserRole.Admin, UserRole.School]), validate(updateExamSchema), async (req, res, next) => {
    try {
        delete req.body.password;
        const result = await examController.update(req.params.id, req.body, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.delete('/:id', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const result = await examController.delete(req.params.id, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/:id', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const result = await examController.getById(req.params.id, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const { pageNumber = 1, pageSize = 20 } = req.query;
        const query = req.query.query || "";
        const type = req.query.type || "";
        const result = await examController.getAll(+pageNumber, +pageSize, query as string, type as string, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});

export { router as examRouter };