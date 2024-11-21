import { User, IUser, UserRole } from '../models/userModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationQuery, PaginationResult } from '../utils/pagination';
import { generateToken, verifyToken } from '../utils/jwtUtils';
import { IUserService, IUserWithToken } from "../interfaces/IUserService";
import { ApiErrors } from "../constants";
import mongoose from "mongoose";

export class UserService implements IUserService {
    async createUser(userData: Partial<IUser>, currUser?: IUser): Promise<IUser> {
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

    async updateUser(userId: string, userData: Partial<IUser>, currUser?: IUser): Promise<IUser> {
        delete userData.role;
        console.log("userData==========================", userData);
        console.log("userId =========================", userId);
        const user = await User.findByIdAndUpdate(userId, userData, { new: true });
        if (!user) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async deleteUser(userId: string, currUser?: IUser): Promise<IUser> {
        const user = await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
        if (!user) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async getUser(userId: string, currUser?: IUser): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user || user.isDeleted) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async listUsers(options: PaginationQuery, role: UserRole, currUser?: IUser): Promise<PaginationResult<IUser>> {
        console.log("currUser==========================", currUser);
        console.log("role==========================", role);
        if (currUser?.role && ![UserRole.Teacher, UserRole.School, UserRole.Admin].includes(currUser?.role)) throw new ApiError(ApiErrors.InsufficientPermissions);
        const { pageNumber = 1, pageSize = 20, query } = options;
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
            if (!role) {
                queryObj.role = {
                    $in: [UserRole.Teacher, UserRole.Student]
                };
            } else {
                queryObj.role = role;
            }
        }


        if (query) {
            queryObj.$or = [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(queryObj).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
            User.countDocuments(queryObj),
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

        const token = generateToken(tempUser);
        const refreshToken = generateToken(tempUser, '7d');

        return {
            ...user.toJSON(),
            token,
            refreshToken,
        };;
    }

    async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string; }> {
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

        return { token: newToken, refreshToken: newRefreshToken };
    }

    async bulkStudentInsertOrUpdate(students: Array<any>, currUser?: IUser): Promise<any> {
        let totalAdded = 0;
        let totalUpdated = 0;
        let totalError = 0;

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