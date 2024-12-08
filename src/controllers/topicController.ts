import { ITopic } from '../models/topicModel';
import { IUser } from '../models/userModel';
import { ApiResponse } from '../utils/apiResponse';
import {
  PaginationQueryForSwagger,
  PaginationQuery,
  PaginationResult,
  handlePagination,
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
  Request,
  Hidden,
  FormField,
  UploadedFile,
  Queries,
} from 'tsoa';
import { TopicService } from '../services';

interface TopicCreationParams {
  title: string;
  description: string;
  type: 'Reading' | 'Speaking' | 'Writing' | 'Listening' | 'Typing';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  // topic: string;
  duration: number;
  class?: number;
  isPractice?: boolean;
}

@Route('api/topic')
@Tags('Topic')
export class TopicController extends Controller {
  private topicService: TopicService;

  constructor() {
    super();
    this.topicService = new TopicService();
  }

  @Post()
  @Security('jwt', ['admin'])
  public async create(
    @Body() createData: TopicCreationParams,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<ITopic | null>> {
    const data = {
      ...createData,
    };
    const result = await this.topicService.create(data, currUser);
    return new ApiResponse(201, true, 'Topic created successfully', result);
  }

  @Put('{id}')
  @Security('jwt', ['admin'])
  public async update(
    @Path() id: string,
    @Body() updateData: Partial<TopicCreationParams>,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<ITopic>> {
    const data = {
      ...updateData,
    };
    const result = await this.topicService.update(id, data, currUser);
    return new ApiResponse(200, true, 'Topic updated successfully', result);
  }

  @Delete('{id}')
  @Security('jwt', ['admin'])
  public async delete(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<any>> {
    const result = await this.topicService.delete(id, currUser);
    return new ApiResponse(200, true, 'Topic deleted successfully', result);
  }

  @Get('{id}')
  @Security('jwt', ['admin', 'teacher', 'student'])
  public async getById(
    @Path() id: string,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<ITopic>> {
    const result = await this.topicService.getById(id, currUser);
    return new ApiResponse(200, true, 'Topic retrieved successfully', result);
  }

  @Get()
  @Security('jwt', ['admin', 'school', 'teacher', 'student'])
  public async getAll(
    @Queries() queryParams: PaginationQueryForSwagger,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<PaginationResult<ITopic>>> {
    const result = await this.topicService.getAll(
      handlePagination(queryParams, { type: '' }) as PaginationQuery,
      currUser
    );
    return new ApiResponse(200, true, 'Topic retrieved successfully', result);
  }

  @Get('/random')
  @Security('jwt', ['admin', 'school', 'teacher', 'student'])
  public async getRandom(
    @Queries()
    @Hidden()
    queryParams: {
      search?: string;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
    },
    // @Queries() @Hidden() queryParams: PaginationQueryForSwagger,
    @Query() @Hidden() currUser?: IUser
  ): Promise<ApiResponse<PaginationResult<ITopic>>> {
    const result = await this.topicService.getRandom(queryParams, currUser);
    return new ApiResponse(200, true, 'Topic retrieved successfully', result);
  }
}
