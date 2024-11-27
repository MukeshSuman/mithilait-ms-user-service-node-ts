import { IExam } from "../models/examModel";
import { IUser } from "../models/userModel";
import { ApiResponse } from '../utils/apiResponse';
import { PaginationQuery, PaginationResult, handlePagination } from '../utils/pagination';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request, Hidden, FormField, UploadedFile, Queries } from 'tsoa';
import { ExamService, ReportService, FileService } from "../services";
import { flattenObject, reorderObjectKeys, transformObject } from "../utils/jsonTransform";
import { arrayToXLSX } from "../utils/createXLSX";
// import mongoose from "mongoose";

interface ExamCreationParams {
    title: string;
    type: "Reading" | "Speaking" | "Writing" | "Listening" | "Typing";
    topic: string;
    duration: number;
    class: number;
    description?: string;
    section?: string;
    isPractice?: boolean;
}


interface QueryParams {
    pageNumber: number;
    pageSize: number;
    query?: string;
    sortKey?: string;
    sortOrder?: string;
    filterKey?: string;
    filterValue?: string;
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
    @Security('jwt', ['admin', 'school', 'teacher', 'student'])
    public async getAll(
        @Query() pageNumber: number = 1,
        @Query() pageSize: number = 20,
        @Query() query?: string,
        @Query() type?: string,
        @Query() isPractice?: boolean,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<PaginationResult<IExam>>> {
        const options: PaginationQuery = { pageNumber, pageSize, query };
        // const result = await this.examService.getAll(options, type || '', currUser);
        const result =  await this.examService.getExamWithStudentsReportAndPagination(options,{ type, isPractice: isPractice }, currUser)
        return new ApiResponse(200, true, 'Exam retrieved successfully', result);
    }

    @Get('report/all')
    @Security('jwt', ['admin', 'school', 'teacher', 'student'])
    public async getReport(
        @Queries() queryParams: QueryParams,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<PaginationResult<IExam>>> {
        console.log('queryParams -------------> ', queryParams)
        // const options: PaginationOptions = { pageNumber, pageSize, query };
        // const result = await this.examService.getAll(options, type || '', currUser);
        const result =  await this.examService.getExamWithStudentsReportAndPagination(handlePagination(queryParams) as PaginationQuery,{ type: "" }, currUser)
        return new ApiResponse(200, true, 'Exam retrieved successfully', result);
    }
    @Get('report/download')
    @Security('jwt', ['admin', 'school', 'teacher', 'student'])
    public async downloadReport(
        @Queries() queryParams: QueryParams,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<any>> {
        const result =  await this.examService.getExamWithStudentsReportAndPagination(handlePagination(queryParams) as PaginationQuery,{ type: "" }, currUser);

        const data = this._prepareData(result.items || []);
        const filePath = await arrayToXLSX(data, {})

        return new ApiResponse(200, true, 'Exam retrieved successfully', {
            filePath: filePath
        });
    }

     _prepareData = (data: Array<any>) => {
        const list: Array<any> = [];
        data?.map((exam: any) => {
          exam.students?.map((student: any) => {
            const ignoreKeys = ['students', 'apiReponse', 'apiResponse', '__v'];
            const stu = flattenObject({ ...student, exam: exam }, ignoreKeys)
            const overrideObject = {
              report_result_accuracyScore: '-',
              report_result_completenessScore: '-',
              report_result_fluencyScore: '-',
              report_result_pronunciationScore: '-',
              report_result_prosodyScore: '-',
              exam_section: ' '
            }
            const newObject = transformObject({ ...overrideObject, ...stu }, {
              selectKeys: [],
              renames: { exam_title: "Title", exam_type: "Type", exam_topic: "Topic", report_result_accuracyScore: "AccuracyScore", report_result_completenessScore: "CompletenessScore", report_result_fluencyScore: "FluencyScore", report_result_pronunciationScore: "PronunciationScore", report_result_prosodyScore: "ProsodyScore" },
              newKeys: { Name: 'firstName,lastName', StudentClass: 'class,section', ExamFor: 'exam_class,exam_section' },
            });
            const reorderKeys = reorderObjectKeys(newObject, ['Name', 'StudentClass', 'Title', 'Type', 'Topic', 'ExamFor', 'AccuracyScore', 'CompletenessScore', 'FluencyScore', 'PronunciationScore', 'ProsodyScore']);
            list.push(reorderKeys)
          })
        })
        return list;
      }
}