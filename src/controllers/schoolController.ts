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
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const data = {
      ...userData,
      lastName: userData.name,
      role: UserRole.School,
    };
    const user = await this.userService.create(data, currUser);
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
    const user = await this.userService.update(id, data, currUser);
    return new ApiResponse(200, true, 'School updated successfully', user);
  }

  @Delete('{id}')
  @Security('jwt', ['admin'])
  public async delete(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.delete(id, currUser);
    return new ApiResponse(200, true, 'School deleted successfully', user);
  }

  @Get('{id}')
  @Security('jwt', ['admin', 'teacher', 'student'])
  public async getById(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<IUser | null>> {
    const user = await this.userService.getById(id, currUser);
    return new ApiResponse(200, true, 'School retrieved successfully', user);
  }

  @Get()
  @Security('jwt', ['admin', 'school'])
  public async getAll(
    @Queries() queryParams: PaginationQueryForSwagger,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<PaginationResult<IUser>>> {
    const result = await this.userService.getAll(
      handlePagination(queryParams, {
        role: UserRole.School,
      }) as PaginationQuery,
      currUser
    );
    return new ApiResponse(200, true, 'School retrieved successfully', result);
  }
}
