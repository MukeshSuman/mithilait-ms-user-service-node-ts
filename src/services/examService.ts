import { IUser, UserRole, User } from '../models/userModel';
import { IExam, Exam } from '../models/examModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { IExamFilter, IExamService, ISubitExamData } from "../interfaces";
import { ApiErrors } from "../constants";
import mongoose from "mongoose";
import { ReportService } from './reportService';
import { IReport, Report } from '../models/reportModel';

export class ExamService implements IExamService {
    async create(data: Partial<IExam>, currUser?: IUser): Promise<IExam> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.Admin, UserRole.School].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const currUserId = new mongoose.Types.ObjectId(currUser?.id);
        const saveData = { ...data, createdById: currUserId, updatedById: currUserId };
        if (currUser?.role === UserRole.School) {
            saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        };
        const exam = new Exam(saveData);
        await exam.save();
        return exam;
    }

    async update(id: string, data: Partial<IExam>, currUser?: IUser): Promise<IExam> {
        const exam = await Exam.findByIdAndUpdate(id, data, { new: true });
        if (!exam) throw new ApiError(ApiErrors.NotFound);
        return exam;
    }

    async delete(id: string, currUser?: IUser): Promise<IExam> {
        const exam = await Exam.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!exam) throw new ApiError(ApiErrors.NotFound);
        return exam;
    }

    async getById(id: string, currUser?: IUser): Promise<IExam> {
        const exam = await Exam.findById(id);
        if (!exam || exam.isDeleted) throw new ApiError(ApiErrors.NotFound);
        const data: any = exam.toJSON();
        // let students:any = []
        // if(data.schoolId){
        //     const queryObj: any = { schoolId: new mongoose.Types.ObjectId(exam.schoolId) };
        //     const result = await User.find(queryObj);
        //     if(result.length){
        //         students = result
        //     }
        // }
        // data.students = students
        return data;
    }

    async getByIdWithOtherDetails(id: string, filter: IExamFilter, currUser?: IUser): Promise<any> {
        const exam = await Exam.findById(id);
        if (!exam || exam.isDeleted) throw new ApiError(ApiErrors.NotFound);
        const data: any = exam.toJSON();
        let students: IUser[] = [];
        let reports: IReport[] = [];
        let studentReportMapper: any[] = [];
        const studentMapper: Map<string, IUser> = new Map();
        if ((filter.students || filter.mapStudentsAndReports) && data.schoolId) {
            const queryObj: any = { schoolId: new mongoose.Types.ObjectId(exam.schoolId) };
            const result = await User.find(queryObj);
            if (result.length) {
                students = result;
                result.map(student => {
                    studentMapper.set(student.id, student);
                });
            }
        }

        if (filter.reports || filter.mapStudentsAndReports) {
            const queryObj: any = { examId: new mongoose.Types.ObjectId(id) };
            const result = await Report.find(queryObj);
            if (result.length) {
                reports = result;
            }
        }

        if (filter.mapStudentsAndReports) {
            reports.map(report => {
                const reportJson = report.toJSON();
                const stu = studentMapper.get(reportJson.studentId);
                if (stu) {
                    studentReportMapper.push({
                        ...stu,
                        ...reportJson,
                        reportId: reportJson.id,
                    });
                }
            });
            data.studentWithReport = studentReportMapper;
        }

        data.students = students;
        return data;
    }
    async getAll(options: PaginationOptions, type: string, currUser?: IUser): Promise<PaginationResult<IExam>> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.School, UserRole.Admin].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const { pageNumber = 1, pageSize = 20, query } = options;
        const skip = (pageNumber - 1) * pageSize;

        const queryObj: any = { isDeleted: false };

        if (currUser?.role === UserRole.Teacher) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.schoolId);
        }

        if (currUser?.role === UserRole.School) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        }

        if (type) {
            queryObj.type = {
                $in: [type]
            };
        }

        if (query) {
            queryObj.$or = [
                { title: { $regex: query, $options: 'i' } },
                { topic: { $regex: query, $options: 'i' } }
            ];
        }

        console.log(queryObj);

        const [exams, total] = await Promise.all([
            Exam.find(queryObj).skip(skip).limit(pageSize),
            Exam.countDocuments(queryObj),
        ]);

        return {
            items: exams.map((exam) => exam.toJSON()),
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async submitExam(id: string, studentId: string, data: ISubitExamData, currUser?: IUser): Promise<any> {
        const reportService = new ReportService();
        const reportData: any = {
            examId: new mongoose.Types.ObjectId(id),
            studentId: new mongoose.Types.ObjectId(studentId),
            status: data.status,
            remarks: data.remarks,
            result: data.result,
            score: data.score,
            apiReponse: data.apiReponse
        };
        if (data.fileId) {
            reportData.fileId = new mongoose.Types.ObjectId(data.fileId);
        }
        const reportResult = await reportService.create(reportData, currUser);
        return reportResult;
    }

    async getExamReportWithPagination(id: string, page: number, pageSize: number): Promise<any> {
        const skip = (page - 1) * pageSize;

        const exam = await Exam.findById(id);


        const match: any = {
            class: exam?.class
        };

        if (exam) {
            if (exam.section) {
                match.section = exam.section;
            }
        } else {
            throw Error("Exam not found");
        }



        // Aggregation pipeline
        const pipeline = [
            {
                // Step 1: Match students based on class and section
                $match: match,
            },
            {
                // Step 2: Lookup the Report for the student and examId
                $lookup: {
                    from: 'reports',  // The name of the Report collection
                    localField: '_id',  // The student's ID
                    foreignField: 'studentId',  // The field in Report to match student
                    let: { examIdVar: id },  // Bind the examId to be used in the pipeline below
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$examId', '$$examIdVar'] },  // Match the examId
                                        { $eq: ['$isDeleted', false] },       // Ensure the report is not deleted
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'report',
                },
            },
            {
                // Step 3: Lookup file associated with the report, if any
                $lookup: {
                    from: 'files',  // The name of the File collection
                    localField: 'report.fileId',  // Match the fileId in the report
                    foreignField: '_id',
                    as: 'file',
                },
            },
            {
                // Step 4: Add computed fields for report status and exam participation
                $addFields: {
                    hasTakenExam: { $gt: [{ $size: '$report' }, 0] },  // Check if the student has taken the exam
                },
            },
            {
                // Step 5: Pagination: Limit and Skip
                $skip: skip,
            },
            {
                $limit: pageSize,
            },
        ];

        // Aggregate query
        const results = await User.aggregate(pipeline).exec();

        // Calculate total counts
        const totalStudent = await User.countDocuments(match).exec();
        const totalStudentTakeExam = await Report.countDocuments({ examId: id, isDeleted: false }).exec();
        const totalStudentNotTakeExam = totalStudent - totalStudentTakeExam;

        return {
            students: results,
            totalStudent,
            totalStudentTakeExam,
            totalStudentNotTakeExam,
            page,
            pageSize,
        };
    };

    async getExamWithStudentsReportAndPagination(
        options: PaginationOptions, type?: string, currUser?: IUser
    ): Promise<any> {
        const { pageNumber = 1, pageSize = 1 } = options;
        const skip = (pageNumber - 1) * pageSize;

        // Step 1: Get the total number of exams (totalItems)
        const totalItems = await Exam.countDocuments({
            isDeleted: false, // Ensure the exam is not deleted
            isActive: true,   // Ensure the exam is active
        }).exec();

        // Calculate the total number of pages (totalPages)
        const totalPages = Math.ceil(totalItems / pageSize);

        // Aggregation pipeline
        const pipeline = [
            {
                // Step 2: Match all active exams
                $match: {
                    isDeleted: false, // Ensure the exam is not deleted
                    isActive: true,   // Ensure the exam is active
                },
            },
            {
                // Step 3: Lookup students based on class, and if section is present, match by section
                $lookup: {
                    from: 'users', // The name of the User collection
                    let: { classVar: '$class', sectionVar: '$section', examId: '$_id' }, // Use class, section, and examId from the Exam
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$class', '$$classVar'] },   // Match students based on class from Exam
                                        {
                                            // Conditionally match section, only if `section` exists in the Exam
                                            $or: [
                                                { $eq: ['$section', '$$sectionVar'] }, // Match section if provided
                                                { $eq: ['$$sectionVar', null] },       // If section is null, match all students in the class
                                                { $eq: ['$section', ''] }              // Match empty string as well for non-sectioned students
                                            ],
                                        },
                                        { $eq: ['$isDeleted', false] },      // Ensure the user is not deleted
                                    ],
                                },
                            },
                        },
                        {
                            // Step 4: Lookup the Report for the student and the current exam
                            $lookup: {
                                from: 'reports',  // The name of the Report collection
                                localField: '_id',  // The student's ID
                                foreignField: 'studentId',  // The field in Report to match student
                                let: { examIdVar: '$$examId' },  // Bind the examId from the parent pipeline
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$examId', '$$examIdVar'] },  // Match the examId
                                                    { $eq: ['$isDeleted', false] },       // Ensure the report is not deleted
                                                ],
                                            },
                                        },
                                    },
                                ],
                                as: 'report',
                            },
                        },
                        {
                            // Step 5: Unwind the report array to handle one report per student
                            $unwind: {
                                path: '$report',
                                preserveNullAndEmptyArrays: true // Allow students without reports
                            }
                        },
                        {
                            // Step 6: Lookup file associated with the report, if any
                            $lookup: {
                                from: 'files',  // The name of the File collection
                                localField: 'report.fileId',  // Match the fileId in the report
                                foreignField: '_id',
                                as: 'file',
                            },
                        },
                        {
                            // Step 7: Unwind the file array to handle one file per report
                            $unwind: {
                                path: '$file',
                                preserveNullAndEmptyArrays: true // Allow reports without files
                            }
                        },
                        {
                            // Step 8: Add a computed field to show if the student has taken the exam and concatenate firstName and lastName into name
                            $addFields: {
                                hasTakenExam: { $cond: { if: { $ifNull: ['$report', null] }, then: true, else: false } }, // Check if the student has taken the exam
                                // hasTakenExam: { $cond: { if: { $gt: [{ $size: '$report' }, 0] }, then: true, else: false } }, // Check if the student has taken the exam
                                name: { $concat: ['$firstName', ' ', '$lastName'] } // Concatenate firstName and lastName to create the name
                            },
                        },
                        {
                            // Step 9: Rename _id to id for students
                            $addFields: {
                                id: '$_id'
                            }
                        },
                        //   {
                        //     $project: {
                        //       _id: 0, // Remove the _id field for students
                        //       firstName: 0, // Remove firstName after concatenating
                        //       lastName: 0,  // Remove lastName after concatenating
                        //     }
                        //   }
                    ],
                    as: 'students', // Embed the students array inside each exam
                },
            },
            {
                // Step 10: Calculate total students, students who took the exam, and students who did not
                $addFields: {
                    totalStudents: { $size: '$students' }, // Total number of students for the exam
                    totalStudentsTakeExam: {
                        $size: {
                            $filter: {
                                input: '$students', // Filter the students who have taken the exam
                                as: 'student',
                                cond: { $eq: ['$$student.hasTakenExam', true] } // Only count those who have taken the exam
                            }
                        }
                    },
                    totalStudentsNotTakeExam: {
                        $size: {
                            $filter: {
                                input: '$students', // Filter the students who have not taken the exam
                                as: 'student',
                                cond: { $eq: ['$$student.hasTakenExam', false] } // Only count those who have not taken the exam
                            }
                        }
                    }
                }
            },
            {
                // Step 11: Rename _id to id for the exam
                $addFields: {
                    id: '$_id'
                }
            },
            // {
            //   // Step 12: Remove _id field for exams
            //   $project: {
            //     _id: 0 // Remove the _id field for the exams
            //   }
            // },
            {
                // Step 13: Pagination: Skip and limit the exam results
                $skip: skip,
            },
            {
                $limit: pageSize,
            },
        ];


        // Execute the aggregation query
        const results = await Exam.aggregate(pipeline).exec();

        return {
            items: results, // Contains the exam list, each with students' reports, file information, and counts
            totalItems,     // Total number of exams
            totalPages,     // Total number of pages
            pageNumber,
            pageSize,
        };
    };

    async getSingleExamWithStudentsReportAndPagination(
        examId: string,
        currUser?: IUser
    ): Promise<any> {
        const { pageNumber, pageSize } = {
            pageNumber: 1,
            pageSize: 10
        };
        const skip = (pageNumber - 1) * pageSize;

        // Aggregation pipeline
        const pipeline = [
            {
                // Step 2: Match all active exams
                $match: {
                    _id: new mongoose.Types.ObjectId(examId),      // Match the provided examId
                    isDeleted: false, // Ensure the exam is not deleted
                    isActive: true,   // Ensure the exam is active
                },
            },
            {
                // Step 3: Lookup students based on class, and if section is present, match by section
                $lookup: {
                    from: 'users', // The name of the User collection
                    let: { classVar: '$class', sectionVar: '$section', examId: '$_id' }, // Use class, section, and examId from the Exam
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$class', '$$classVar'] },   // Match students based on class from Exam
                                        {
                                            // Conditionally match section, only if `section` exists in the Exam
                                            $or: [
                                                { $eq: ['$section', '$$sectionVar'] }, // Match section if provided
                                                { $eq: ['$$sectionVar', null] },       // If section is null, match all students in the class
                                                { $eq: ['$section', ''] }              // Match empty string as well for non-sectioned students
                                            ],
                                        },
                                        { $eq: ['$isDeleted', false] },      // Ensure the user is not deleted
                                    ],
                                },
                            },
                        },
                        {
                            // Step 4: Lookup the Report for the student and the current exam
                            $lookup: {
                                from: 'reports',  // The name of the Report collection
                                localField: '_id',  // The student's ID
                                foreignField: 'studentId',  // The field in Report to match student
                                let: { examIdVar: '$$examId' },  // Bind the examId from the parent pipeline
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$examId', '$$examIdVar'] },  // Match the examId
                                                    { $eq: ['$isDeleted', false] },       // Ensure the report is not deleted
                                                ],
                                            },
                                        },
                                    },
                                ],
                                as: 'report',
                            },
                        },
                        {
                            // Step 5: Unwind the report array to handle one report per student
                            $unwind: {
                                path: '$report',
                                preserveNullAndEmptyArrays: true // Allow students without reports
                            }
                        },
                        {
                            // Step 6: Lookup file associated with the report, if any
                            $lookup: {
                                from: 'files',  // The name of the File collection
                                localField: 'report.fileId',  // Match the fileId in the report
                                foreignField: '_id',
                                as: 'file',
                            },
                        },
                        {
                            // Step 7: Unwind the file array to handle one file per report
                            $unwind: {
                                path: '$file',
                                preserveNullAndEmptyArrays: true // Allow reports without files
                            }
                        },
                        {
                            // Step 8: Add a computed field to show if the student has taken the exam and concatenate firstName and lastName into name
                            $addFields: {
                                hasTakenExam: { $cond: { if: { $ifNull: ['$report', null] }, then: true, else: false } }, // Check if the student has taken the exam
                                //  hasTakenExam: { $cond: { if: { $gt: [{ $size: '$report' }, 0] }, then: true, else: false } }, // Check if the student has taken the exam
                                name: { $concat: ['$firstName', ' ', '$lastName'] } // Concatenate firstName and lastName to create the name
                            },
                        },
                        {
                            // Step 9: Rename _id to id for students
                            $addFields: {
                                id: '$_id'
                            }
                        },
                        //   {
                        //     $project: {
                        //       _id: 0, // Remove the _id field for students
                        //       firstName: 0, // Remove firstName after concatenating
                        //       lastName: 0,  // Remove lastName after concatenating
                        //     }
                        //   }
                    ],
                    as: 'students', // Embed the students array inside each exam
                },
            },
            {
                // Step 10: Calculate total students, students who took the exam, and students who did not
                $addFields: {
                    totalStudents: { $size: '$students' }, // Total number of students for the exam
                    totalStudentsTakeExam: {
                        $size: {
                            $filter: {
                                input: '$students', // Filter the students who have taken the exam
                                as: 'student',
                                cond: { $eq: ['$$student.hasTakenExam', true] } // Only count those who have taken the exam
                            }
                        }
                    },
                    totalStudentsNotTakeExam: {
                        $size: {
                            $filter: {
                                input: '$students', // Filter the students who have not taken the exam
                                as: 'student',
                                cond: { $eq: ['$$student.hasTakenExam', false] } // Only count those who have not taken the exam
                            }
                        }
                    }
                }
            },
            {
                // Step 11: Rename _id to id for the exam
                $addFields: {
                    id: '$_id'
                }
            },
            // {
            //   // Step 12: Remove _id field for exams
            //   $project: {
            //     _id: 0 // Remove the _id field for the exams
            //   }
            // },
            {
                // Step 13: Pagination: Skip and limit the exam results
                $skip: skip,
            },
            {
                $limit: pageSize,
            },
        ];

        // Execute the aggregation query
        const results = await Exam.aggregate(pipeline).exec();

        // Calculate total counts
        const totalStudents = await User.countDocuments({
            class: results[0]?.class, // Get the class from the matched exam
            isDeleted: false,
            ...(results[0]?.section ? { section: results[0].section } : {}), // Include section if it exists
        }).exec();

        const totalStudentsTakeExam = await Report.countDocuments({
            examId: examId,
            isDeleted: false,
        }).exec();

        const totalStudentsNotTakeExam = totalStudents - totalStudentsTakeExam;

        return {
            ...results[0], // Contains the single exam, with students' reports and file information
            // totalStudents,
            // totalStudentsTakeExam,
            // totalStudentsNotTakeExam,
            //   page: pageNumber,
            //   pageSize,
        };
    };
}