// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request, Hidden } from 'tsoa';
import { IUser, UserRole } from '../models/userModel';

interface StudentCreationParams {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    gender?: 'Male' | 'Female' | 'Other' | '';
    rollNumber: number;
    class: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    section: string;
    assessmentYear: 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | 2027 | 2028 | 2029 | 2030;
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
        @Query() @Hidden() currUser?: IUser): Promise<ApiResponse<IUser | null>> {
        const data = {
            ...userData,
            role: UserRole.Student
        };
        const user = await this.userService.createUser(data, currUser);
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
        const user = await this.userService.updateUser(id, data);
        return new ApiResponse(200, true, 'Student updated successfully', user);
    }

    @Delete('{id}')
    @Security('jwt', ['admin'])
    public async delete(
        @Path() id: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.deleteUser(id);
        return new ApiResponse(200, true, 'Student deleted successfully', user);
    }

    @Get('{id}')
    @Security('jwt', ['admin', 'school', 'student'])
    public async getById(
        @Path() id: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.getUser(id);
        return new ApiResponse(200, true, 'Student retrieved successfully', user);
    }

    @Get()
    @Security('jwt', ['admin', 'school'])
    public async getAll(
        @Query() pageNumber: number = 1,
        @Query() pageSize: number = 20,
        @Query() query?: string,
        @Query() role?: UserRole,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<PaginationResult<IUser>>> {
        const options: PaginationOptions = { pageNumber, pageSize, query };
        const result = await this.userService.listUsers(options, UserRole.Student, currUser);
        return new ApiResponse(200, true, 'Student retrieved successfully', result);
    }
}