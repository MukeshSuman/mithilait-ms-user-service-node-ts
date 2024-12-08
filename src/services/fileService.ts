import { IUser, UserRole } from '../models/userModel';
import { IFile, File } from '../models/fileModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationQuery, PaginationResult } from '../utils/pagination';
import { IFileService } from '../interfaces';
import { ApiErrors } from '../constants';
import mongoose from 'mongoose';
import { getFileInfo } from '../utils/file';

export class FileService implements IFileService {
  async saveFile(file: Express.Multer.File, currUser?: IUser): Promise<IFile> {
    if (
      currUser?.role &&
      ![UserRole.Teacher, UserRole.Admin, UserRole.School].includes(
        currUser?.role
      )
    )
      throw new ApiError(ApiErrors.InsufficientPermissions);
    const currUserId = new mongoose.Types.ObjectId(currUser?.id);
    const data: any = await getFileInfo(file);
    const saveData = {
      ...data,
      uploadedById: currUserId,
      createdById: currUserId,
      updatedById: currUserId,
    };
    if (currUser?.role === UserRole.School) {
      saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
    }
    const result = new File(saveData);
    await result.save();
    return result;
  }

  async create(data: Partial<IFile>, currUser?: IUser): Promise<IFile> {
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
    if (currUser?.role === UserRole.School) {
      saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
    }
    const result = new File(saveData);
    await result.save();
    return result;
  }

  async update(
    id: string,
    data: Partial<IFile>,
    currUser?: IUser
  ): Promise<IFile> {
    console.log('currUser log', currUser?.role);
    const result = await File.findByIdAndUpdate(id, data, { new: true });
    if (!result) throw new ApiError(ApiErrors.NotFound);
    return result;
  }

  async delete(id: string, currUser?: IUser): Promise<IFile> {
    console.log('currUser log', currUser?.role);

    const result = await File.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!result) throw new ApiError(ApiErrors.NotFound);
    return result;
  }

  async getById(id: string, currUser?: IUser): Promise<IFile> {
    console.log('currUser log', currUser?.role);
    const result = await File.findById(id);
    if (!result || result.isDeleted) throw new ApiError(ApiErrors.NotFound);
    const data: any = result.toJSON();
    return data;
  }

  async getAll(
    options: PaginationQuery,
    currUser?: IUser
  ): Promise<PaginationResult<IFile>> {
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
      File.find(queryObj).skip(skip).limit(pageSize),
      File.countDocuments(queryObj),
    ]);

    return {
      items: results.map((item) => item.toJSON()),
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
