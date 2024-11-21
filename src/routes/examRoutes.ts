import express, { Request, Response, NextFunction } from 'express';
import { ExamController } from '../controllers/examController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createExamSchema, updateExamSchema } from '../validators';
import { IUser, UserRole } from "../models/userModel";
import { ApiError } from "../utils/apiResponse";
import { errorHandler } from "../middlewares/errorHandler";
import { audioUpload, audioValidationErrorHandler } from "../middlewares/audioValidation";
import { toBoolean } from '../utils/mix';
// import { NextFunction } from 'express-serve-static-core';

const router = express.Router();
const examController = new ExamController();

// const allowedType = "audio/wav";

// export const audioUpload = multer({
//     dest: "uploads/audio/",  // Destination for uploaded files
//     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit (adjust as needed)
//     fileFilter: (req: Request, file: Express.Multer.File, cb) => {
//       // Check if the file is a .wav file
//       if (file.mimetype !== allowedType) {
//         return cb(new Error("Only .wav audio files are allowed"));
//       }
//       cb(null, true);
//     },
//   });

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

router.post('/:id/submit/:studentId', authMiddleware([UserRole.Admin, UserRole.School]), audioUpload.single('file'), audioValidationErrorHandler, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await examController.submitExam(req.params.id, req.params.studentId, req.file as Express.Multer.File, req.user as IUser);
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
        let isPractice = false;

        if(req.query.hasOwnProperty("isPractice") ){
            isPractice = toBoolean(req.query.isPractice)
        }

        const result = await examController.getAll(+pageNumber, +pageSize, query as string, type as string, isPractice as boolean, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});

router.get('/report/all', authMiddleware([UserRole.Admin, UserRole.School]), async (req, res, next) => {
    try {

        console.log('/exam/report', req.query)

        const result = await examController.getReport(req.query as any, req.user as IUser);
        res.json(result);
    } catch (error: ApiError | any) {
        errorHandler(error, req, res, next);
    }
});

export { router as examRouter };