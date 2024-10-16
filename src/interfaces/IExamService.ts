import { IExam } from '../models/examModel';
import { PaginationOptions, PaginationResult } from '../utils/pagination';

export interface IExamService {
    create(userData: Partial<IExam>): Promise<IExam>;
    update(id: string, userData: Partial<IExam>): Promise<IExam>;
    delete(id: string): Promise<IExam>;
    getById(id: string): Promise<IExam>;
    getAll(options: PaginationOptions, type: string): Promise<PaginationResult<IExam>>;
}
