import { Request, Response, NextFunction } from 'express';
import { ApiError, ApiResponse } from '../utils/apiResponse';
import { logger } from '../config/logger';
import { date } from "joi";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error(err.stack);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(new ApiResponse(err.statusCode, false, err.message, null, err.message));
    }

    return res.status(500).json(new ApiResponse(500, false, 'Internal Server Error'));
};