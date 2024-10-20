import { IExam } from "../models/examModel";
import { IUser } from "../models/userModel";
import { ApiResponse } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request, Hidden, FormField, UploadedFile } from 'tsoa';
import { ExamService, ReportService, FileService } from "../services";
// import mongoose from "mongoose";

interface ExamCreationParams {
    title: string;
    type: string;
    topic: string;
    duration: number;
    class: number;
    description?: string;
    section?: string;
    isPractice?: boolean;
}

@Route('api/exams')
@Tags('Exam')
export class ExamController extends Controller {
    private examService: ExamService;
    private fileService: FileService;
    private reportService: ReportService

    constructor() {
        super();
        this.examService = new ExamService();
        this.fileService = new FileService();
        this.reportService = new ReportService();
    }

    @Post()
    @Security('jwt', ['admin'])
    public async create(
        @Body() examData: ExamCreationParams,
        @Query() @Hidden() currUser?: IUser): Promise<ApiResponse<IUser | null>> {
        const data = {
            ...examData,
        };
        const result = await this.examService.create(data, currUser);
        return new ApiResponse(201, true, 'Exam created successfully', result);
    }

    @Put('{id}')
    @Security('jwt', ['admin'])
    public async update(
        @Path() id: string,
        @Body() examData: Partial<ExamCreationParams>,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const data = {
            ...examData,
        };
        const result = await this.examService.update(id, data, currUser);
        return new ApiResponse(200, true, 'Exam updated successfully', result);
    }

    @Delete('{id}')
    @Security('jwt', ['admin'])
    public async delete(
        @Path() id: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const result = await this.examService.delete(id, currUser);
        return new ApiResponse(200, true, 'Exam deleted successfully', result);
    }

    @Get('{id}')
    @Security('jwt', ['admin', 'teacher', 'student'])
    public async getById(
        @Path() id: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        // const result = await this.examService.getByIdWithOtherDetails(id, { mapStudentsAndReports: true }, currUser);
        const result = await this.examService.getSingleExamWithStudentsReportAndPagination(id, currUser);

        return new ApiResponse(200, true, 'Exam retrieved successfully', result);
    }

    @Post('{id}/submit/{studentId}')
    @Security('jwt', ['admin', 'teacher', 'student'])
    public async submitExam(
        @Path() id: string,
        @Path() studentId: string,
        @UploadedFile() file: Express.Multer.File,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const fileResult = await this.fileService.saveFile(file, currUser);
        const result = await this.examService.submitExam(id, studentId, {
            fileId: fileResult.id,
            status: 'InProgress'
        }, currUser)
        const examResults:any = await this.examService.getById(id)
        delete examResults.students
        return new ApiResponse(200, true, 'Exam submitted successfully', {...examResults, report: result, file: fileResult});
    }

    @Get()
    @Security('jwt', ['admin', 'exam'])
    public async getAll(
        @Query() pageNumber: number = 1,
        @Query() pageSize: number = 20,
        @Query() query?: string,
        @Query() type?: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<PaginationResult<IExam>>> {
        const options: PaginationOptions = { pageNumber, pageSize, query };
        // const result = await this.examService.getAll(options, type || '', currUser);
        const result =  await this.examService.getExamWithStudentsReportAndPagination(options, type || '', currUser)
        return new ApiResponse(200, true, 'Exam retrieved successfully', result);
    }
}