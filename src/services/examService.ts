import { IUser, UserRole, User } from '../models/userModel';
import { IExam, Exam } from '../models/examModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { IExamFilter, IExamService, ISubitExamData } from "../interfaces";
import { ApiErrors } from "../constants";
import mongoose from "mongoose";
import { ReportService } from './reportService';
import { IReport, Report } from '../models/reportModel';

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
        const data:any = exam.toJSON();
        // let students:any = []
        // if(data.schoolId){
        //     const queryObj: any = { schoolId: new mongoose.Types.ObjectId(exam.schoolId) };
        //     const result = await User.find(queryObj);
        //     if(result.length){
        //         students = result
        //     }
        // }
        // data.students = students
        return data;
    }

    async getByIdWithOtherDetails(id: string, filter: IExamFilter, currUser?: IUser): Promise<any> {
        const exam = await Exam.findById(id);
        if (!exam || exam.isDeleted) throw new ApiError(ApiErrors.NotFound);
        const data:any = exam.toJSON();
        let students:IUser[] = []
        let reports: IReport[] = []
        let studentReportMapper: any[] = []
        const studentMapper: Map<string, IUser> = new Map();
        if((filter.students || filter.mapStudentsAndReports) && data.schoolId){
            const queryObj: any = { schoolId: new mongoose.Types.ObjectId(exam.schoolId) };
            const result = await User.find(queryObj);
            if(result.length){
                students = result;
                result.map(student => {
                    studentMapper.set(student.id, student)
                })
            }
        }

        if(filter.reports || filter.mapStudentsAndReports){
            const queryObj: any = { examId: new mongoose.Types.ObjectId(id) };
            const result = await Report.find(queryObj);
            if(result.length){
                reports = result
            }
        }

        if(filter.mapStudentsAndReports){
            reports.map(report => {
                const reportJson = report.toJSON()
                const stu = studentMapper.get(reportJson.studentId)
                if(stu){
                    studentReportMapper.push({
                      ...stu,
                      ...reportJson,
                      reportId: reportJson.id,
                    })
                }
            })
            data.studentWithReport = studentReportMapper;
        } 

        data.students = students
        return data;
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

    async submitExam(id: string, studentId: string, data: ISubitExamData, currUser?: IUser): Promise<any> {
        const reportService = new ReportService()
        const reportData:any = {
            examId: new mongoose.Types.ObjectId(id),
            studentId: new mongoose.Types.ObjectId(studentId),
            status: data.status,
            remarks: data.remarks,
            result: data.result,
            score: data.score,
            apiReponse: data.apiReponse
        }
        if(data.fileId){
            reportData.fileId = new mongoose.Types.ObjectId(data.fileId)
        }
        const reportResult = await reportService.create(reportData, currUser)
        return reportResult;
    }
}