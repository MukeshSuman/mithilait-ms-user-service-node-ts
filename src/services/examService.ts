import { IUser, UserRole, User } from '../models/userModel';
import { IExam, Exam } from '../models/examModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { IExamService } from "../interfaces";
import { ApiErrors } from "../constants";
import mongoose from "mongoose";

export class ExamService implements IExamService {
    async create(data: Partial<IExam>, currUser?: IUser): Promise<IExam> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.Admin, UserRole.School].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const currUserId = new mongoose.Types.ObjectId(currUser?.id);
        const saveData = { ...data, createdById: currUserId, updatedById: currUserId };
        if (currUser?.role === UserRole.School) {
            saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        };
        const exam = new Exam(saveData);
        await exam.save();
        return exam;
    }

    async update(id: string, data: Partial<IExam>, currUser?: IUser): Promise<IExam> {
        const exam = await Exam.findByIdAndUpdate(id, data, { new: true });
        if (!exam) throw new ApiError(ApiErrors.NotFound);
        return exam;
    }

    async delete(id: string, currUser?: IUser): Promise<IExam> {
        const exam = await Exam.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!exam) throw new ApiError(ApiErrors.NotFound);
        return exam;
    }

    async getById(id: string, currUser?: IUser): Promise<IExam> {
        const exam = await Exam.findById(id);
        if (!exam || exam.isDeleted) throw new ApiError(ApiErrors.NotFound);
        const data = exam.toJSON();
        const queryObj: any = { schoolId: exam.schoolId };
        User.find(queryObj);
        return exam;
    }

    async getAll(options: PaginationOptions, type: string, currUser?: IUser): Promise<PaginationResult<IExam>> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.School, UserRole.Admin].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const { pageNumber = 1, pageSize = 20, query } = options;
        const skip = (pageNumber - 1) * pageSize;

        const queryObj: any = { isDeleted: false };

        if (currUser?.role === UserRole.Teacher) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.schoolId);
        }

        if (currUser?.role === UserRole.School) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        }

        if (type) {
            queryObj.type = {
                $in: [type]
            };
        }

        if (query) {
            queryObj.$or = [
                { title: { $regex: query, $options: 'i' } },
                { topic: { $regex: query, $options: 'i' } }
            ];
        }

        console.log(queryObj);

        const [exams, total] = await Promise.all([
            Exam.find(queryObj).skip(skip).limit(pageSize),
            Exam.countDocuments(queryObj),
        ]);

        return {
            items: exams.map((exam) => exam.toJSON()),
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };
    }
}