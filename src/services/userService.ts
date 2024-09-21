import { User, IUser, UserRole } from '../models/userModel';
import { ApiError } from '../utils/apiResponse';
import { PaginationOptions, PaginationResult } from '../utils/pagination';
import { generateToken, verifyToken } from '../utils/jwtUtils';
import { IUserService, IUserWithToken } from "../interfaces/IUserService";
import { ApiErrors } from "../constants";

export class UserService implements IUserService {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new User(userData);
        await user.save();
        return user;
    }

    async updateUser(userId: string, userData: Partial<IUser>): Promise<IUser> {
        const user = await User.findByIdAndUpdate(userId, userData, { new: true });
        if (!user) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async deleteUser(userId: string): Promise<IUser> {
        const user = await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
        if (!user) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async getUser(userId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user || user.isDeleted) throw new ApiError(ApiErrors.NotFound);
        return user;
    }

    async listUsers(options: PaginationOptions): Promise<PaginationResult<IUser>> {
        const { pageNumber = 1, pageSize = 20, query } = options;
        const skip = (pageNumber - 1) * pageSize;

        const queryObj: any = { isDeleted: false };

        if (query) {
            queryObj.$or = [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(queryObj).skip(skip).limit(pageSize),
            User.countDocuments(queryObj),
        ]);

        return {
            items: users,
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

        const token = generateToken(user._id, user.role);
        const refreshToken = generateToken(user._id, user.role, '7d');

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

        const newToken = generateToken(user._id, user.role);
        const newRefreshToken = generateToken(user._id, user.role, '7d');

        return { token: newToken, refreshToken: newRefreshToken };
    }

    async logout(userId: string): Promise<void> {
        // In a real-world scenario, you might want to invalidate the token
        // This could involve storing invalid tokens in a blacklist (e.g., Redis)
        // For simplicity, we'll just return a success message
    }
}