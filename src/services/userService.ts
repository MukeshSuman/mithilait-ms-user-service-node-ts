import { User, IUser, UserRole } from '../models/userModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationQuery, PaginationResult } from '../utils/pagination';
import { generateToken, verifyToken } from '../utils/jwtUtils';
import { IUserService, IUserWithToken } from "../interfaces/IUserService";
import { ApiErrors } from "../constants";
import mongoose from "mongoose";
import { convertSortObject } from '../utils/convertSortObject';
import { isObjectEmpty } from '../utils/mix';

export class UserService implements IUserService {
    async create(userData: Partial<IUser>, currUser?: IUser): Promise<IUser> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.Student, UserRole.Admin, UserRole.School].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        if (userData.role === UserRole.Admin) throw new ApiError(ApiErrors.InsufficientPermissions);
        if (userData?.role === UserRole.School && currUser?.role !== UserRole.Admin) throw new ApiError(ApiErrors.InsufficientPermissions);
        // let schoolId = currUser?.schoolId;
        const currUserId = new mongoose.Types.ObjectId(currUser?.id);
        const saveData = { ...userData, createdById: currUserId, updatedById: currUserId };
        if (currUser?.role === UserRole.School) {
            saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        };
        // if (userData?.role === UserRole.Teacher || userData?.role === UserRole.Student) {
        //     saveData.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        // }
        const user = new User(saveData);
        await user.save();
        return user;
    }

    async update(userId: string, userData: Partial<IUser>, currUser?: IUser): Promise<IUser> {
        delete userData.role;
        console.log("userData==========================", userData);
        console.log("userId =========================", userId);
        const user = await User.findByIdAndUpdate(userId, userData, { new: true });
        if (!user) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async delete(userId: string, currUser?: IUser): Promise<IUser> {
        const user = await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
        if (!user) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async getById(userId: string, currUser?: IUser): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user || user.isDeleted) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async getAll(options: PaginationQuery, currUser?: IUser): Promise<PaginationResult<IUser>> {
        if (currUser?.role && ![UserRole.Teacher, UserRole.School, UserRole.Admin].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const { pageNumber = 1, pageSize = 20, query, search } = options;
        const skip = (pageNumber - 1) * pageSize;

        const queryObj: any = { isDeleted: false };

        if (currUser?.role === UserRole.Teacher) {
            queryObj.role = UserRole.Student;
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.schoolId);
        }

        if (currUser?.role === UserRole.School) {
            queryObj.role = UserRole.Student;
            queryObj.schoolId = new mongoose.Types.ObjectId(currUser?.id);
        }

        if (currUser?.role === UserRole.Admin) {
            if (!options?.role) {
                queryObj.role = {
                    $in: [UserRole.Teacher, UserRole.Student]
                };
            } else if(options?.role) {
                queryObj.role = options?.role;
            }
        }

        if (query || search) {
            queryObj.$or = [
                { firstName: { $regex: query || search, $options: 'i' } },
                { lastName: { $regex: query || search, $options: 'i' } }
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


        const [users, total] = await Promise.all([
            User.find(finalQuery).skip(skip).limit(pageSize).sort(sort),
            User.countDocuments(finalQuery),
        ]);

        return {
            items: users.map((user) => user.toJSON()),
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async login(email: string, password: string): Promise<IUserWithToken> {
        const user = await User.findOne({ email, isDeleted: false });
        console.log(user);
        if (!user || !(await user.comparePassword(password))) {
            throw new ApiError(ApiErrors.InvalidCredentials);
        }
        const tempUser = user.toJSON();

        const token = generateToken(tempUser, '8h');
        const refreshToken = generateToken(tempUser, '7d');

        return {
            ...user.toJSON(),
            token,
            refreshToken,
        };;
    }

    async refreshToken(refreshToken: string): Promise<IUserWithToken> {
        const decoded = verifyToken(refreshToken);
        if (!decoded || typeof decoded === 'string') {
            throw new ApiError(ApiErrors.InvalidRefreshToken);
        }

        const user = await User.findById(decoded.userId);
        if (!user || user.isDeleted) {
            throw new ApiError(ApiErrors.NotFound);
        }

        const newToken = generateToken(user);
        const newRefreshToken = generateToken(user, '7d');

        return { ...user.toJSON(), token: newToken, refreshToken: newRefreshToken };
    }

    async bulkStudentInsertOrUpdate(students: Array<any>, currUser?: IUser): Promise<any> {
        let totalAdded = 0;
        let totalUpdated = 0;
        const totalError = 0;

        const schoolId = new mongoose.Types.ObjectId(currUser?.id);
        const tempNumber = new Date().getTime();
        const bulkOps = students.map((student, idx) => ({
            updateOne: {
                filter: { email: student.email },
                update: { $set: { ...student, username: idx + 'STU' + tempNumber, schoolId: schoolId, role: 'student', password: '$2b$10$Jo4ApxQMs/4cawgtHhbXMOrSNfhB3.6SAaosPaF8qcgMaqDS3HCsW' } },
                upsert: true
            }
        }));

        try {
            const result = await User.bulkWrite(bulkOps);

            // Count added and updated documents
            totalAdded = result.upsertedCount;   // Documents added
            totalUpdated = result.modifiedCount;  // Documents updated

        } catch (err) {
            console.error(err);
            // Count total errors if any
            // totalError = students.length;  // Assume all failed for simplicity
        }

        return {
            total: students.length,
            totalAdded,
            totalUpdated,
            totalError
        };

    }

    async logout(userId: string): Promise<void> {
        // In a real-world scenario, you might want to invalidate the token
        // This could involve storing invalid tokens in a blacklist (e.g., Redis)
        // For simplicity, we'll just return a success message
    }
}