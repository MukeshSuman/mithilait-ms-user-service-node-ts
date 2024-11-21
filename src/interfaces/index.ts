export * from './IApiErrors';
export * from './IExamService';
export * from './IUserService';
export * from './IFileService';
export * from './IReportService'

export interface IExamReportFilter {
    title: string;
    type: 'Speaking' | 'Reading' | 'Writing' | 'Listening' | 'Typing';
    topic: string;
    duration: number;
    class: number;
    description?: string;
    section?: string;
    isPractice?: boolean;
    isActive?: boolean;
    maxTakenCount?: number;

    status: 'Start' | 'Pending' | 'InProgress' | 'Completed' | 'Error' | 'Processing'
    score?: number;
    remarks?: string;
    // apiResponse?: Record<string, any>;
    result?: ReportResult
    reason: string;
    takenCount?: number;
}

interface ReportResult {
    accuracyScore: number 
    completenessScore: number 
    fluencyScore: number 
    pronunciationScore: number 
    prosodyScore: number 
}