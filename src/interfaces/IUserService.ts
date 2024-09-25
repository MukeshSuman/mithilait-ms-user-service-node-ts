import { IUser, UserRole } from '../models/userModel';
import { PaginationOptions, PaginationResult } from '../utils/pagination';

export interface IUserService {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    updateUser(userId: string, userData: Partial<IUser>): Promise<IUser>;
    deleteUser(userId: string): Promise<IUser>;
    getUser(userId: string): Promise<IUser>;
    listUsers(options: PaginationOptions, role: UserRole): Promise<PaginationResult<IUser>>;
    login(email: string, password: string): Promise<IUserWithToken>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
}

export interface IUserWithToken extends IUser {
    token: string;
    refreshToken: string;
}