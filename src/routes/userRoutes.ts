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

router.post('/', authMiddleware([UserRole.Admin]), validate(createUserSchema), (req, res) => userController.createUser(req.body));
// router.put('/:userId', authMiddleware([UserRole.Admin]), validate(updateUserSchema), userController.updateUser);
router.delete('/:userId', authMiddleware([UserRole.Admin]), userController.deleteUser);
router.get('/:userId', authMiddleware([UserRole.Admin, UserRole.Teacher, UserRole.Student]), userController.getUser);
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
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', authMiddleware(), userController.logout);

export { router as userRouter };