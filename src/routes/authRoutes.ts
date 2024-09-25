import express from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { loginSchema } from '../validators/userValidator';
import { ApiError } from "../utils/apiResponse";
import { errorHandler } from "../middlewares/errorHandler";

const router = express.Router();
const userController = new AuthController();

router.get('/me', authMiddleware(), async (req, res, next) => {
    try {
        const result = await userController.me(req);
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

export { router as authRouter };