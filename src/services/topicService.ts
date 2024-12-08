import { IUser, UserRole } from '../models/userModel';
import { ITopic, Topic } from '../models/topicModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationQuery, PaginationResult } from '../utils/pagination';
import { ITopicService } from "../interfaces";
import { ApiErrors } from "../constants";
import mongoose from "mongoose";
import { convertSortObject } from '..//utils/convertSortObject';
import { isObjectEmpty } from '../utils/mix';

export class TopicService implements ITopicService {
    async create(data: Partial<ITopic>, currUser?: IUser): Promise<ITopic> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.Admin, UserRole.School].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const currUserId = new mongoose.Types.ObjectId(currUser?.id);
        const saveData = { ...data, uploadedById: currUserId, createdById: currUserId, updatedById: currUserId };
        if (currUser?.role === UserRole.School) {
            saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        };

        const result = new Topic(saveData);
        await result.save();
        return result;
    }

    async update(id: string, data: Partial<ITopic>, currUser?: IUser): Promise<ITopic> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.Admin, UserRole.School].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const currUserId = new mongoose.Types.ObjectId(currUser?.id);
        const saveData = { ...data, updatedById: currUserId };
        const result = await Topic.findByIdAndUpdate(id, saveData, { new: true });
        if (!result) throw new ApiError(ApiErrors.NotFound);
        return result;
    }

    async delete(id: string, currUser?: IUser): Promise<ITopic> {
        const result = await Topic.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!result) throw new ApiError(ApiErrors.NotFound);
        return result;
    }

    async getById(id: string, currUser?: IUser): Promise<ITopic> {
        const result = await Topic.findById(id);
        if (!result || result.isDeleted) throw new ApiError(ApiErrors.NotFound);
        const data: any = result.toJSON();
        return data;
    }

    async get(data: Record<string, any>, currUser?: IUser): Promise<ITopic[]> {
        const result = await Topic.find(data).lean();
        if (!result) throw new ApiError(ApiErrors.NotFound);
        // const finalData:any = result.map((item) => item.toJSON()).toJSON();
        return result;
    }

    async getAll(options: PaginationQuery, currUser?: IUser): Promise<PaginationResult<ITopic>> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.School, UserRole.Admin].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const { pageNumber = 1, pageSize = 20, query, search } = options;
        const skip = (pageNumber - 1) * pageSize;

        const queryObj: any = { isDeleted: false };

        if (currUser?.role === UserRole.Teacher) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.schoolId);
        }

        if (currUser?.role === UserRole.School) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        }

        if (query || search) {
            queryObj.$or = [
                { title: { $regex: query || search, $options: 'i' } },
                { description: { $regex: query || search, $options: 'i' } }
            ];
        }

        let sort = convertSortObject(options.sort || {});

        if (options.sortField && options.sortOrder) {
            sort = {
                ...sort,
                ...convertSortObject({ [options.sortField]: options.sortOrder })
            }
        }

        if (isObjectEmpty(sort)) {
            sort = convertSortObject({ createdAt: 'desc' })
        }

        const searchMatchArr: Array<any> = [];
        let searchMatchObj = {}
        const dateMatch: any = {}
        const filterObj:any = {} 


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
                        filterObj[key] = { $regex: value, $options: 'i' }
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

        const finalQuery = {
            ...queryObj,
            // ...searchMatchObj,
            ...filterObj,
            ...dateMatch
          }

          console.log("Topic finalQuery", JSON.stringify(finalQuery))

        const [results, total] = await Promise.all([
            Topic.find(finalQuery).skip(skip).limit(pageSize).sort(sort),
            Topic.countDocuments(finalQuery),
        ]);

        return {
            items: results.map((item) => item.toJSON()),
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async getRandom(data: Record<string, any>, currUser?: IUser): Promise<ITopic> {
        const queryObj: any = { isDeleted: false };

        if (currUser?.role === UserRole.Teacher) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.schoolId);
        }

        if (currUser?.role === UserRole.School) {
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        }

        if(data.difficulty){
            queryObj.difficulty = data.difficulty
        }

        const finalQuery = {
            ...queryObj,
          }

        const randomTopic = await Topic.aggregate([{$match: finalQuery}, { $sample: { size: 1 } }]);
        return randomTopic[0];
      };
}
