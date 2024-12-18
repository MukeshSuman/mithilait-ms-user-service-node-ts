import { IUser } from 'src/models/userModel';
import { PaginationQuery, PaginationResult } from '../utils/pagination';

export interface IBaseService<T> {
  create(data: Partial<T>, currUser?: IUser): Promise<T>;
  update(id: string, data: Partial<T>, currUser?: IUser): Promise<T>;
  delete(id: string, currUser?: IUser): Promise<T>;
  getById(id: string, currUser?: IUser): Promise<T>;
  // getAll(options: PaginationQuery, type: string): Promise<PaginationResult<T>>;
  getAll(
    options: PaginationQuery,
    currUser?: IUser
  ): Promise<PaginationResult<T>>;
}
