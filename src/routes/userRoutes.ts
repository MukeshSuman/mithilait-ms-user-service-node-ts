import express from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createUserSchema, updateUserSchema, loginSchema } from '../validators/userValidator';
import { UserRole } from "../models/userModel";
import { ApiError } from "../utils/apiResponse";
import { errorHandler } from "../middlewares/errorHandler";

const router = express.Router();
const userController = new UserController();

router.post('/', authMiddleware([UserRole.Admin]), validate(createUserSchema), async (req, res, next) => {
    try {
        const result = await userController.createUser(req.body);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.put('/:userId', authMiddleware([UserRole.Admin]), validate(updateUserSchema), async (req, res, next) => {
    try {
        const result = await userController.updateUser(req.params.userId, req.body);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.delete('/:userId', authMiddleware([UserRole.Admin]), async (req, res, next) => {
    try {
        const result = await userController.deleteUser(req.params.userId);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/:userId', authMiddleware([UserRole.Admin, UserRole.Teacher, UserRole.Student]), async (req, res, next) => {
    try {
        const result = await userController.getUser(req.params.userId);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.get('/', authMiddleware([UserRole.Admin]), async (req, res, next) => {
    try {
        const { pageNumber = 1, pageSize = 20 } = req.query;
        const query = req.query.query || "";
        const role = UserRole[req.query.role as keyof typeof UserRole] || undefined;
        const result = await userController.listUsers(+pageNumber, +pageSize);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const result = await userController.login(req.body);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.post('/refresh-token', async (req, res, next) => {
    try {
        const result = await userController.refreshToken(req.body);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});
router.post('/logout', authMiddleware(), async (req, res, next) => {
    try {
        const result = await userController.logout(req);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});

export { router as userRouter };