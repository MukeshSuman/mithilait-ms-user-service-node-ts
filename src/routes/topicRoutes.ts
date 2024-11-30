import express, { Request, Response, NextFunction } from 'express';
import { TopicController } from '../controllers/topicController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createTopicSchema, updateTopicSchema } from '../validators';
import { IUser, UserRole } from "../models/userModel";
import { ApiError } from "../utils/apiResponse";
import { errorHandler } from "../middlewares/errorHandler";

const router = express.Router();
const topicController = new TopicController();

router.post('/', authMiddleware([UserRole.Admin, UserRole.School]), validate(createTopicSchema), async (req, res, next) => {
    try {
        const result = await topicController.create(req.body, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.put('/:id', authMiddleware([UserRole.Admin, UserRole.School]), validate(updateTopicSchema), async (req, res, next) => {
    try {
        delete req.body.password;
        const result = await topicController.update(req.params.id, req.body, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.delete('/:id', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {
        const result = await topicController.delete(req.params.id, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/:id', authMiddleware([UserRole.Admin, UserRole.School, UserRole.Teacher]), async (req, res, next) => {
    try {
        const result = await topicController.getById(req.params.id, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});

router.get('/', authMiddleware([UserRole.Admin, UserRole.School, UserRole.Teacher]), async (req, res, next) => {
    try {
        const result = await topicController.getAll(req.query as any, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});



export { router as topicRouter };