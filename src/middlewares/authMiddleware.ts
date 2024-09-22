import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtUtils';
import { ApiError } from '../utils/apiResponse';
import { UserRole } from '../models/userModel';
import { ApiErrors } from "../constants";

export const authMiddleware = (roles?: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(new ApiError(ApiErrors.NoTokenProvided));
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = verifyToken(token);
            if (typeof decoded === 'string') {
                throw new ApiError(ApiErrors.UnAuthorized);
            }
            req.user = {
                id: decoded.userId,
                role: decoded.role,
                email: decoded.email,
                ...decoded
            };

            if (roles && !roles.includes(decoded.role)) {
                return next(new ApiError(ApiErrors.InsufficientPermissions));
            }

            next();
        } catch (error) {
            next(new ApiError(ApiErrors.UnAuthorized));
        }
    };
};

export function expressAuthentication(request: any, securityName: string, scopes?: string[]) {
    // Your authentication logic here
    // ...

    return (request.user);
}