// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request, Hidden } from 'tsoa';
import { IUser, UserRole } from '../models/userModel';

interface SchoolCreationParams {
    username: string;
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

interface SchoolUpdateParams {
    username?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
}

@Route('api/schools')
@Tags('School')
export class SchoolController extends Controller {
    private userService: UserService;

    constructor() {
        super();
        this.userService = new UserService();
    }

    @Post()
    @Security('jwt', ['admin'])
    public async create(
        @Body() userData: SchoolCreationParams,
        @Query() @Hidden() currUser?: IUser): Promise<ApiResponse<IUser | null>> {
        const data = {
            ...userData,
            lastName: userData.name,
            role: UserRole.School
        };
        const user = await this.userService.createUser(data, currUser);
        return new ApiResponse(201, true, 'School created successfully', user);
    }

    @Put('{id}')
    @Security('jwt', ['admin'])
    public async update(
        @Path() id: string,
        @Body() userData: SchoolUpdateParams,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const data = {
            ...userData,
            lastName: userData.name,
        };
        const user = await this.userService.updateUser(id, data);
        return new ApiResponse(200, true, 'School updated successfully', user);
    }

    @Delete('{id}')
    @Security('jwt', ['admin'])
    public async delete(
        @Path() id: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.deleteUser(id);
        return new ApiResponse(200, true, 'School deleted successfully', user);
    }

    @Get('{id}')
    @Security('jwt', ['admin', 'teacher', 'student'])
    public async getById(
        @Path() id: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.getUser(id);
        return new ApiResponse(200, true, 'School retrieved successfully', user);
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
        const result = await this.userService.listUsers(options, UserRole.School, currUser);
        return new ApiResponse(200, true, 'School retrieved successfully', result);
    }
}