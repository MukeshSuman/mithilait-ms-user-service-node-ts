import { IUser } from 'src/models/userModel';
import { PaginationOptions, PaginationResult } from '../utils/pagination';

export interface IBaseService<T> {
    create(data: Partial<T>, currUser?: IUser): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<T>;
    getById(id: string): Promise<T>;
    getAll(options: PaginationOptions, type: string): Promise<PaginationResult<T>>;
}
