import { IUser } from 'src/models/userModel';
import { IExam } from '../models/examModel';
import { IBaseService } from './IBaseService';

//     schoolId: mongoose.Types.ObjectId;  // Reference to the User (School)
//     examId: mongoose.Types.ObjectId;  // Reference to the Exam
//     studentId: mongoose.Types.ObjectId;  // Reference to the User (Student)
//     fileId?: mongoose.Types.ObjectId;  // Reference to the File
//     status: 'Start' | 'Pending' | 'InProgress' | 'Completed'
//     score?: number;
//     remarks?: string;
//     apiReponse?: Record<string, any>;
//     result?: Record<string, any>;

export interface ISubitExamData {
    status: 'Start' | 'Pending' | 'InProgress' | 'Completed';
    fileId?: string;
    reportId?: string;
    score?: number;
    remarks?:  string;
    apiReponse?: Record<string, any>;
    result?: Record<string, any>;
}

export interface IExamFilter {
    students?: boolean;
    reports?: boolean;
    mapStudentsAndReports?: boolean;
}

export interface IExamService extends IBaseService<IExam> {
    submitExam(id: string, studentId: string, data: ISubitExamData, currUser?: IUser): Promise<any>;
    getByIdWithOtherDetails(id: string, filter: IExamFilter, currUser?: IUser): Promise<any>
}
