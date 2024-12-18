import { IUser, UserRole } from '../models/userModel';
import { IReport, Report } from '../models/reportModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationQuery, PaginationResult } from '../utils/pagination';
import { IReportService } from '../interfaces';
import { ApiErrors } from '../constants';
import mongoose from 'mongoose';

export class ReportService implements IReportService {
  async create(data: Partial<IReport>, currUser?: IUser): Promise<IReport> {
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
      uploadedById: currUserId,
      createdById: currUserId,
      updatedById: currUserId,
    };
    if (data.studentId) {
      saveData.studentId = new mongoose.Types.ObjectId(data.studentId);
    }
    if (currUser?.role === UserRole.School) {
      saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
    }

    const checkIsExist = await Report.findOne({
      studentId: saveData.studentId,
      examId: data.examId,
    });

    if (checkIsExist && checkIsExist.id) {
      return await this.update(checkIsExist.id, saveData, currUser);
    }

    const result = new Report(saveData);
    await result.save();
    return result;
  }

  async update(
    id: string,
    data: Partial<IReport>,
    currUser?: IUser
  ): Promise<IReport> {
    console.log('currUser role', currUser?.role);
    const result = await Report.findByIdAndUpdate(id, data, { new: true });
    if (!result) throw new ApiError(ApiErrors.NotFound);
    return result;
  }

  async delete(id: string, currUser?: IUser): Promise<IReport> {
    console.log('currUser role', currUser?.role);
    const result = await Report.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!result) throw new ApiError(ApiErrors.NotFound);
    return result;
  }

  async getById(id: string, currUser?: IUser): Promise<IReport> {
    console.log('currUser role', currUser?.role);
    const result = await Report.findById(id);
    if (!result || result.isDeleted) throw new ApiError(ApiErrors.NotFound);
    const data: any = result.toJSON();
    return data;
  }

  async get(data: Record<string, any>, currUser?: IUser): Promise<IReport[]> {
    console.log('currUser role', currUser?.role);
    const result = await Report.find(data).lean();
    if (!result) throw new ApiError(ApiErrors.NotFound);
    // const finalData:any = result.map((item) => item.toJSON()).toJSON();
    return result;
  }

  async getAll(
    options: PaginationQuery,
    currUser?: IUser
  ): Promise<PaginationResult<IReport>> {
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

    // if (type) {
    //     queryObj.type = {
    //         $in: [type]
    //     };
    // }

    if (query) {
      queryObj.$or = [
        { fileName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    const [results, total] = await Promise.all([
      Report.find(queryObj).skip(skip).limit(pageSize),
      Report.countDocuments(queryObj),
    ]);

    return {
      items: results.map((item) => item.toJSON()),
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getLimitedReportIds(limit: number = 10): Promise<Array<any>> {
    try {
      // Query MongoDB for documents in MyModel, limit the results, and return only `_id`
      const ids = await Report.find(
        {
          status: 'InProgress',
        },
        { _id: 1 }
      )
        .limit(limit)
        .lean();

      // Extract the `_id` values from the result
      const idArray = ids.map((doc) => doc._id);

      console.log(idArray);
      return idArray;
    } catch (error) {
      console.error('Error fetching limited document IDs:', error);
      throw error;
    }
  }
}
