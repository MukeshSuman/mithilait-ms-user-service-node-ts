// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiError, ApiResponse } from '../utils/apiResponse';
import {
  handlePagination,
  PaginationQuery,
  PaginationQueryForSwagger,
  PaginationResult,
} from '../utils/pagination';
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Put,
  Delete,
  Query,
  Route,
  Security,
  Tags,
  Hidden,
  UploadedFile,
  Queries,
} from 'tsoa';
// import multer from 'multer';
import xlsx from 'xlsx';
import { IUser, UserRole } from '../models/userModel';
import csvParser from 'csv-parser';
import fs from 'fs';
import { generateFakeEmail, generateFakeUsername } from '../utils/mix';

// const upload = multer({ dest: 'upload/bulk-upload' });

interface StudentCreationParams {
  username: string;
  firstName: string;
  lastName: string;
  // email: string;
  password: string;
  phoneNumber?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  rollNumber: number;
  class: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  section: string;
  assessmentYear:
    | 2019
    | 2020
    | 2021
    | 2022
    | 2023
    | 2024
    | 2025
    | 2026
    | 2027
    | 2028
    | 2029
    | 2030;
}

@Route('api/students')
@Tags('Student')
export class StudentController extends Controller {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  @Post()
  @Security('jwt', ['admin'])
  public async create(
    @Body() userData: StudentCreationParams,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const data = {
      ...userData,
      username: !userData.username ? generateFakeUsername() : userData.username,
      email: generateFakeEmail(),
      role: UserRole.Student,
    };
    const user = await this.userService.create(data, currUser);
    return new ApiResponse(201, true, 'Student created successfully', user);
  }

  @Put('{id}')
  @Security('jwt', ['admin'])
  public async update(
    @Path() id: string,
    @Body() userData: Partial<StudentCreationParams>,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const data = {
      ...userData,
    };
    const user = await this.userService.update(id, data, currUser);
    return new ApiResponse(200, true, 'Student updated successfully', user);
  }

  @Delete('{id}')
  @Security('jwt', ['admin'])
  public async delete(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.delete(id, currUser);
    return new ApiResponse(200, true, 'Student deleted successfully', user);
  }

  @Get('{id}')
  @Security('jwt', ['admin', 'school', 'student'])
  public async getById(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.getById(id, currUser);
    return new ApiResponse(200, true, 'Student retrieved successfully', user);
  }

  @Get()
  @Security('jwt', ['admin', 'school'])
  public async getAll(
    @Queries() queryParams: PaginationQueryForSwagger,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<PaginationResult<IUser>>> {
    const result = await this.userService.getAll(
      handlePagination(queryParams, {
        role: UserRole.Student,
      }) as PaginationQuery,
      currUser
    );
    return new ApiResponse(200, true, 'School retrieved successfully', result);
  }

  @Post('/bulk-upload')
  @Security('jwt', ['school'])
  public async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<any>> {
    // Allowed MIME types for CSV, XLS, and XLSX
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError({
        code: 'INVALID_FILE_TYPE',
        httpStatusCode: 400,
        message: 'Invalid file type. Please upload a CSV, XLS or XLSX file.',
      });
    }

    let students = [];

    if (
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ===
        file.mimetype ||
      'application/vnd.ms-excel' === file.mimetype
    ) {
      students = await this.parseFile(file);
    } else if ('text/csv' === file.mimetype) {
      students = await this.parseCSV(file);
    }

    console.log('students', students);

    const result = await this.userService.bulkStudentInsertOrUpdate(
      students,
      currUser
    );
    return new ApiResponse(200, true, 'Bulk upload successful', result);
  }

  private parseFile(file: Express.Multer.File): any[] {
    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  }

  private parseCSV(file: Express.Multer.File): any {
    // const students: any[] = [];
    // Parse the uploaded CSV file
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results)) // Resolve with the parsed data
        .on('error', (err) => reject(err)); // Reject the promise on error
    });
  }
}
