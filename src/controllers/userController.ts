// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request } from 'tsoa';
import { IUser, UserRole } from '../models/userModel';

interface UserCreationParams {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

interface UserUpdateParams {
    username?: string;
    email?: string;
    password?: string;
    role?: UserRole;
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
    public async createUser(@Body() userData: UserCreationParams): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.createUser(userData);
        return new ApiResponse(201, true, 'User created successfully', user);
    }

    @Put('{userId}')
    @Security('jwt', ['admin'])
    public async updateUser(
        @Path() userId: string,
        @Body() userData: UserUpdateParams
    ): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.updateUser(userId, userData);
        return new ApiResponse(200, true, 'User updated successfully', user);
    }

    @Delete('{userId}')
    @Security('jwt', ['admin'])
    public async deleteUser(@Path() userId: string): Promise<ApiResponse<IUser | null>> {
        const user = await this.userService.deleteUser(userId);
        return new ApiResponse(200, true, 'User deleted successfully', user);
    }

    @Get('{userId}')
    @Security('jwt', ['admin', 'teacher', 'student'])
    public async getUser(@Path() userId: string): Promise<ApiResponse<IUser | null>> {
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
    ): Promise<ApiResponse<PaginationResult<IUser>>> {
        const options: PaginationOptions = { pageNumber, pageSize, query };
        const result = await this.userService.listUsers(options);
        return new ApiResponse(200, true, 'Users retrieved successfully', result);
    }

    @Post('login')
    public async login(@Body() credentials: { email: string; password: string; }): Promise<ApiResponse<{ user: IUser; token: string; refreshToken: string; }>> {
        const result = await this.userService.login(credentials.email, credentials.password);
        return new ApiResponse(200, true, 'Login successful', result);
    }

    @Post('refresh-token')
    public async refreshToken(@Body() body: { refreshToken: string; }): Promise<ApiResponse<{ token: string; refreshToken: string; }>> {
        const result = await this.userService.refreshToken(body.refreshToken);
        return new ApiResponse(200, true, 'Token refreshed successfully', result);
    }

    @Post('logout')
    @Security('jwt')
    public async logout(@Request() req: any): Promise<ApiResponse<null>> {
        await this.userService.logout(req.user.userId);
        return new ApiResponse(200, true, 'Logout successful', null);
    }
}