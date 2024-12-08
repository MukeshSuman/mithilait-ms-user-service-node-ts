// import { Request } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse } from '../utils/apiResponse';
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
  Queries,
} from 'tsoa';
import { IUser, UserRole } from '../models/userModel';

interface UserCreationParams {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other' | '';
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
  gender?: 'Male' | 'Female' | 'Other' | '';
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
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.create(userData, currUser);
    return new ApiResponse(201, true, 'User created successfully', user);
  }

  @Put('{id}')
  @Security('jwt', ['admin'])
  public async updateUser(
    @Path() id: string,
    @Body() userData: UserUpdateParams,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.update(id, userData, currUser);
    return new ApiResponse(200, true, 'User updated successfully', user);
  }

  @Delete('{id}')
  @Security('jwt', ['admin'])
  public async deleteUser(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.delete(id, currUser);
    return new ApiResponse(200, true, 'User deleted successfully', user);
  }

  @Get('{id}')
  @Security('jwt', ['admin', 'teacher', 'student'])
  public async getUser(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.getById(id, currUser);
    return new ApiResponse(200, true, 'User retrieved successfully', user);
  }

  @Get()
  @Security('jwt', ['admin', 'school'])
  public async getAll(
    @Queries() queryParams: PaginationQueryForSwagger,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<PaginationResult<IUser>>> {
    const result = await this.userService.getAll(
      handlePagination(queryParams) as PaginationQuery,
      currUser
    );
    return new ApiResponse(200, true, 'School retrieved successfully', result);
  }
}
