import { IUser } from 'src/models/userModel';
import { IExam } from '../models/examModel';
import { IBaseService } from './IBaseService';
import { PaginationQuery } from 'src/utils/pagination';

export interface ISubmitExamData {
    status: 'Start' | 'Pending' | 'InProgress' | 'Completed';
    fileId?: string;
    reportId?: string;
    score?: number;
    remarks?:  string;
    apiResponse?: Record<string, any>;
    result?: Record<string, any>;
}

export interface IExamFilter {
    id?: string;
    title?: string;
    type?: 'Speaking' | 'Reading' | 'Writing' | 'Listening' | 'Typing';
    topic?: string;
    duration?: number;
    class?: number;
    description?: string;
    section?: string;
    isPractice?: boolean;
}

type TSort = 1 | -1

export interface IExamSort {
    title?: TSort;
    type?: TSort;
    topic?: TSort;
    duration?: TSort;
    class?: TSort;
    description?: TSort;
    section?: TSort;
}

export interface IExamService extends IBaseService<IExam> {
    submitExam(id: string, studentId: string, data: ISubmitExamData, currUser?: IUser): Promise<any>;
    // getByIdWithOtherDetails(id: string, filter: IExamFilter, currUser?: IUser): Promise<any>;
    getSingleExamWithStudentsReportAndPagination(id: string, currUser?: IUser): Promise<any>;
    getExamWithStudentsReportAndPagination(options: PaginationQuery, currUser?: IUser): Promise<any>
}
