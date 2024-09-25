// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/apiResponse';
import { Body, Controller, Get, Path, Post, Put, Delete, Query, Route, Security, Tags, Request } from 'tsoa';
import { IUser } from '../models/userModel';

@Route('api/auth')
@Tags('Auth')
export class AuthController extends Controller {
    private userService: UserService;

    constructor() {
        super();
        this.userService = new UserService();
    }

    @Get('me')
    @Security('jwt')
    public async me(@Request() req: any): Promise<ApiResponse<null>> {
        const result = await this.userService.getUser(req.user.id);
        return new ApiResponse(200, true, 'successful', result);
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