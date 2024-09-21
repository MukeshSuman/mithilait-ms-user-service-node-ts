import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtUtils';
import { ApiError } from '../utils/apiResponse';
import { UserRole } from '../models/userModel';

export const authMiddleware = (roles?: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // const authHeader = req.headers.authorization;
        // if (!authHeader) {
        //     return next(new ApiError(401, 'No token provided'));
        // }

        // const token = authHeader.split(' ')[1];
        try {
            // const decoded = verifyToken(token);
            // if (typeof decoded === 'string') {
            //     throw new Error('Invalid token');
            // }
            // req.user = {
            //     id: decoded.userId,
            //     role: decoded.role,
            //     email: decoded.email,
            //     ...decoded
            // };

            // if (roles && !roles.includes(decoded.role)) {
            //     return next(new ApiError(403, 'Insufficient permissions'));
            // }

            next();
        } catch (error) {
            next(new ApiError(401, 'Invalid token'));
        }
    };
};

export function expressAuthentication(request: any, securityName: string, scopes?: string[]) {
    // Your authentication logic here
    // ...

    return (request.user);
}