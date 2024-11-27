import { IUser, UserRole, User } from "../models/userModel";
import { IExam, Exam } from "../models/examModel";
import { ApiError } from "../utils/apiResponse";
import { PaginationQuery, PaginationResult } from "../utils/pagination";
import { IExamFilter, IExamService, ISubmitExamData } from "../interfaces";
import { ApiErrors } from "../constants";
import mongoose, { Mongoose } from "mongoose";
import { ReportService } from "./reportService";
import { IReport, Report } from "../models/reportModel";
import { convertSortObject } from "../utils/convertSortObject";
import { isObjectEmpty } from "../utils/mix";
import { arrayToXLSX } from "../utils/createXLSX";

export class ExamService implements IExamService {
  async create(data: Partial<IExam>, currUser?: IUser): Promise<IExam> {
    if (
      currUser?.role &&
      ![UserRole.Teacher, UserRole.Admin, UserRole.School].includes(
        currUser?.role
      )
    )
      throw new ApiError(ApiErrors.InsufficientPermissions);
    const currUserId = new mongoose.Types.ObjectId(currUser?.id);
    const saveData = {
      ...data,
      createdById: currUserId,
      updatedById: currUserId,
    };
    if (currUser?.role === UserRole.School) {
      saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
    }
    const exam = new Exam(saveData);
    await exam.save();
    return exam;
  }

  async update(
    id: string,
    data: Partial<IExam>,
    currUser?: IUser
  ): Promise<IExam> {
    const exam = await Exam.findByIdAndUpdate(id, data, { new: true });
    if (!exam) throw new ApiError(ApiErrors.NotFound);
    return exam;
  }

  async delete(id: string, currUser?: IUser): Promise<IExam> {
    const exam = await Exam.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!exam) throw new ApiError(ApiErrors.NotFound);
    return exam;
  }

  async getById(id: string, currUser?: IUser): Promise<IExam> {
    const exam = await Exam.findById(id);
    if (!exam || exam.isDeleted) throw new ApiError(ApiErrors.NotFound);
    const data: any = exam.toJSON();
    return data;
  }

  async getAll(
    options: PaginationQuery,
    type: string,
    currUser?: IUser
  ): Promise<PaginationResult<IExam>> {
    if (
      currUser?.role &&
      ![UserRole.Teacher, UserRole.School, UserRole.Admin].includes(
        currUser?.role
      )
    )
      throw new ApiError(ApiErrors.InsufficientPermissions);
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
        $in: [type],
      };
    }

    if (query) {
      queryObj.$or = [
        { title: { $regex: query, $options: "i" } },
        { topic: { $regex: query, $options: "i" } },
      ];
    }

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

  async submitExam(
    id: string,
    studentId: string,
    data: ISubmitExamData,
    currUser?: IUser
  ): Promise<any> {
    const reportService = new ReportService();
    const reportData: any = {
      examId: new mongoose.Types.ObjectId(id),
      studentId: new mongoose.Types.ObjectId(studentId),
      status: data.status,
      remarks: data.remarks,
      result: data.result,
      score: data.score,
      apiResponse: data.apiResponse,
    };
    if (data.fileId) {
      reportData.fileId = new mongoose.Types.ObjectId(data.fileId);
    }
    const checkReportExists = await reportService.get({
      studentId: reportData.studentId,
      examId: reportData.examId,
    });
    if (checkReportExists.length) {
      const oldData: any = checkReportExists[0];
      const oldInfo = oldData.oldInfo || [];
      const takenCount = oldData.takenCount ? oldData.takenCount + 1 : 1;
      oldInfo.push({
        fileId: oldData.fileId,
        apiResponse: oldData.apiResponse || oldData.apiReponse || {},
        result: oldData.result,
      })
      const newData = { ...oldData, ...reportData, oldInfo: oldInfo, takenCount: takenCount };
      return await reportService.update(checkReportExists[0].id, newData);
    } else {
      const reportResult = await reportService.create(reportData, currUser);
      return reportResult;
    }

  }
  async getExamWithStudentsReportAndPagination(
    options: PaginationQuery,
    filters: Record<string, any>,
    currUser?: IUser
  ): Promise<any> {
    return await this._getExamWithStudentsReportAndPagination(
      options,
      filters,
      currUser
    );
  }

  async getSingleExamWithStudentsReportAndPagination(
    examId: string,
    currUser?: IUser
  ): Promise<any> {
    const results = await this._getExamWithStudentsReportAndPagination(
      { pageNumber: 1, pageSize: 1 },
      { id: examId },
      currUser
    );
    return {
      ...results.items[0], // Contains the single exam, with students' reports and file information
    };
  }

  private async _getExamWithStudentsReportAndPagination(
    options: PaginationQuery,
    filter: IExamFilter,
    currUser?: IUser
  ): Promise<PaginationResult<IExam>> {
    let { pageNumber = 1, pageSize = 1 } = options;
    let skip = (pageNumber - 1) * pageSize;

    let sort = convertSortObject(options.sort || {});

    if(options.downloadOption){
      skip = 0,
      pageNumber = 1;
      pageSize = Number(options.downloadOption.totalItems) || 100000000;
    }

    if (options.sortField && options.sortOrder) {
      sort = {
        ...sort,
        ...convertSortObject({ [options.sortField]: options.sortOrder })
      }
    }

    if (isObjectEmpty(sort)) {
      sort = convertSortObject({ createdAt: 'asc' })
    }

    const searchMatchArr: Array<any> = [];
    let searchMatchObj = {}
    let dateMatch: any = {}

    if (!isObjectEmpty(options.filters || {})) {
      Object.entries(options.filters || {}).forEach(([key, value]) => {
        if (value) {
          if (key.startsWith("startDate") || key.startsWith("fromDate")) {
            const tempValue = new Date(value as string)
            if (dateMatch.createdAt) {
              dateMatch.createdAt = {
                ...dateMatch.createdAt,
                $gte: tempValue
              }
            } else {
              dateMatch.createdAt = {
                $gte: tempValue
              }
            }
          } else if (key.startsWith("endDate") || key.startsWith("toDate")) {
            const tempValue = new Date(value as string)
            if (dateMatch.createdAt) {
              dateMatch.createdAt = {
                ...dateMatch.createdAt,
                $lte: tempValue
              }
            } else {
              dateMatch.createdAt = {
                $lte: tempValue
              }
            }
          } else {
            searchMatchArr.push({ [key]: { $regex: value, $options: 'i' } })
          }
        }
      });
      if (searchMatchArr.length) {
        searchMatchObj = {
          $or: searchMatchArr
        }
      }
    }

    const examQuery: Partial<{
      title: string;
      type: "Speaking" | "Reading" | "Writing" | "Listening" | "Typing";
      topic: string;
      duration: number;
      class: number;
      description?: string;
      section?: string;
      isPractice?: boolean;
      isActive?: boolean;
      isDeleted?: boolean;
      _id?: mongoose.Types.ObjectId;
      schoolId?: mongoose.Types.ObjectId;
    }> = {
      isDeleted: false, // Ensure the exam is not deleted
      isActive: true, // Ensure the exam is active
    };

    const userQuery: Partial<{
      isDeleted?: boolean;
      schoolId?: mongoose.Types.ObjectId;
    }> = {
      isDeleted: false
    }

    let schoolId = null;

    if (filter.id) {
      examQuery._id = new mongoose.Types.ObjectId(filter.id);
    }

    if (filter.hasOwnProperty("isPractice")) {
      examQuery.isPractice = filter.isPractice;
    }

    if (currUser) {
      if (
        currUser.role === UserRole.Student ||
        currUser.role === UserRole.Teacher
      ) {
        schoolId = new mongoose.Types.ObjectId(currUser.schoolId);
      } else if (currUser.role === UserRole.School) {
        schoolId = new mongoose.Types.ObjectId(currUser.id);
      }
    }

    if (schoolId) {
      examQuery.schoolId = schoolId;
      userQuery.schoolId = schoolId;
    }

    const finalQuery = {
      ...examQuery,
      ...searchMatchObj,
      ...dateMatch
    }

    console.log("finalQuery", finalQuery);

    // Step 1: Get the total number of exams (totalItems)
    const totalItems = await Exam.countDocuments(finalQuery).exec();

    // Calculate the total number of pages (totalPages)
    const totalPages = Math.ceil(totalItems / pageSize);

    console.log("examQuery ====>", examQuery);
    console.log("page =====>", skip, pageSize);

    // Aggregation pipeline
    const pipeline = [
      {
        // Step 2: Match all active exams
        $match: finalQuery,
      },
      {
        $addFields: {
          filterSection: { $ifNull: ['$section', null] } // Set filterSection to section or null if section is not defined
        }
      },
      {
        // Step 3: Lookup students based on class, and if section is present, match by section
        $lookup: {
          from: "users", // The name of the User collection
          //let: { classVar: "$class", sectionVar: "$section", examId: "$_id" }, // Use class, section, and examId from the Exam
          let: { classVar: '$class', filterSection: '$filterSection', examId: '$_id' },
          pipeline: [
            {
              $match: {
                ...userQuery,
                $expr: {
                  $and: [
                    // { $eq: ['$schoolId', schoolId] },
                    { $eq: ["$class", "$$classVar"] }, // Match students based on class from Exam
                    {
                      // Match all sections if filterSection is null; otherwise, match by specific section
                      $cond: {
                        if: { $eq: ['$$filterSection', null] },
                        then: true, // Include all sections
                        else: { $eq: ['$section', '$$filterSection'] } // Filter by section if specified
                      }
                    },
                    { $eq: ["$isDeleted", false] }, // Ensure the user is not deleted
                  ],
                },
              },
            },
            {
              // Step 4: Lookup the Report for the student and the current exam
              $lookup: {
                from: "reports", // The name of the Report collection
                localField: "_id", // The student's ID
                foreignField: "studentId", // The field in Report to match student
                let: { examIdVar: "$$examId" }, // Bind the examId from the parent pipeline
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$examId", "$$examIdVar"] }, // Match the examId
                          { $eq: ["$isDeleted", false] }, // Ensure the report is not deleted
                        ],
                      },
                    },
                  },
                ],
                as: "report",
              },
            },
            {
              // Step 5: Unwind the report array to handle one report per student
              $unwind: {
                path: "$report",
                preserveNullAndEmptyArrays: true, // Allow students without reports
              },
            },
            {
              // Step 6: Lookup file associated with the report, if any
              $lookup: {
                from: "files", // The name of the File collection
                localField: "report.fileId", // Match the fileId in the report
                foreignField: "_id",
                as: "file",
              },
            },
            {
              // Step 7: Unwind the file array to handle one file per report
              $unwind: {
                path: "$file",
                preserveNullAndEmptyArrays: true, // Allow reports without files
              },
            },
            {
              // Step 8: Add a computed field to show if the student has taken the exam and concatenate firstName and lastName into name
              $addFields: {
                hasTakenExam: {
                  $cond: {
                    if: { $ifNull: ["$report", null] },
                    then: true,
                    else: false,
                  },
                }, // Check if the student has taken the exam
                // hasTakenExam: { $cond: { if: { $gt: [{ $size: '$report' }, 0] }, then: true, else: false } }, // Check if the student has taken the exam
                name: { $concat: ["$firstName", " ", "$lastName"] }, // Concatenate firstName and lastName to create the name
              },
            },
            {
              // Step 9: Rename _id to id for students
              $addFields: {
                id: "$_id",
              },
            },
            //   {
            //     $project: {
            //       _id: 0, // Remove the _id field for students
            //       firstName: 0, // Remove firstName after concatenating
            //       lastName: 0,  // Remove lastName after concatenating
            //     }
            //   }
          ],
          as: "students", // Embed the students array inside each exam
        },
      },
      {
        // Step 10: Calculate total students, students who took the exam, and students who did not
        $addFields: {
          totalStudents: { $size: "$students" }, // Total number of students for the exam
          totalStudentsTakeExam: {
            $size: {
              $filter: {
                input: "$students", // Filter the students who have taken the exam
                as: "student",
                cond: { $eq: ["$$student.hasTakenExam", true] }, // Only count those who have taken the exam
              },
            },
          },
          totalStudentsNotTakeExam: {
            $size: {
              $filter: {
                input: "$students", // Filter the students who have not taken the exam
                as: "student",
                cond: { $eq: ["$$student.hasTakenExam", false] }, // Only count those who have not taken the exam
              },
            },
          },
        },
      },
      {
        $sort: sort,
      },
      {
        // Step 11: Rename _id to id for the exam
        $addFields: {
          id: "$_id",
        },
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
      totalItems, // Total number of exams
      totalPages, // Total number of pages
      pageNumber,
      pageSize,
    };
  }
}
