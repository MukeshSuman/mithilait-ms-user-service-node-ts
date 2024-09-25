// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request, Hidden } from 'tsoa';
import { IUser, UserRole } from '../models/userModel';

interface UserCreationParams {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    // bio?: string;
    // profilePictureUrl?: string;
    // websiteUrl?: string;
    phoneNumber?: string;
    role: UserRole;
}

interface UserUpdateParams {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    // bio?: string;
    // profilePictureUrl?: string;
    // websiteUrl?: string;
    phoneNumber?: string;
    role: UserRole;
}

@Route('api/users')
@Tags('User')
export class UserController extends Controller {
    private userService: UserService;

    constructor() {
        super();
        this.userService = new UserService();
    }

    @Post()
    @Security('jwt', ['admin'])
    public async createUser(
        @Body() userData: UserCreationParams,
        @Query() @Hidden() currUser?: IUser): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.createUser(userData, currUser);
        return new ApiResponse(201, true, 'User created successfully', user);
    }

    @Put('{userId}')
    @Security('jwt', ['admin'])
    public async updateUser(
        @Path() userId: string,
        @Body() userData: UserUpdateParams,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.updateUser(userId, userData);
        return new ApiResponse(200, true, 'User updated successfully', user);
    }

    @Delete('{userId}')
    @Security('jwt', ['admin'])
    public async deleteUser(
        @Path() userId: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.deleteUser(userId);
        return new ApiResponse(200, true, 'User deleted successfully', user);
    }

    @Get('{userId}')
    @Security('jwt', ['admin', 'teacher', 'student'])
    public async getUser(
        @Path() userId: string,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.getUser(userId);
        return new ApiResponse(200, true, 'User retrieved successfully', user);
    }

    @Get()
    @Security('jwt', ['admin'])
    public async listUsers(
        @Query() pageNumber: number = 1,
        @Query() pageSize: number = 20,
        @Query() query?: string,
        @Query() role?: UserRole,
        @Query() @Hidden() currUser?: IUser
    ): Promise<ApiResponse<PaginationResult<IUser>>> {
        const options: PaginationOptions = { pageNumber, pageSize, query };
        const result = await this.userService.listUsers(options, role as any, currUser);
        return new ApiResponse(200, true, 'Users retrieved successfully', result);
    }
}