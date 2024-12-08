import { IUser, UserRole } from '../models/userModel';
import { PaginationQuery, PaginationResult } from '../utils/pagination';
import { IBaseService } from './IBaseService';

export interface IUserService extends IBaseService<IUser> {
  // createUser(userData: Partial<IUser>): Promise<IUser>;
  // updateUser(userId: string, userData: Partial<IUser>): Promise<IUser>;
  // deleteUser(userId: string): Promise<IUser>;
  // getUser(userId: string): Promise<IUser>;
  // listUsers(options: PaginationQuery): Promise<PaginationResult<IUser>>;
  login(email: string, password: string): Promise<IUserWithToken>;
  refreshToken(refreshToken: string): Promise<IUserWithToken>;
  logout(userId: string): Promise<void>;
}

export interface IUserWithToken extends IUser {
  token: string;
  refreshToken: string;
}
