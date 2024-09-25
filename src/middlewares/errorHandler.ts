import { Request, Response, NextFunction } from 'express';
import { ApiError, ApiResponse } from '../utils/apiResponse';
import { logger } from '../config/logger';
import { date } from "joi";
import { Error as MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';

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

    // Handle Mongoose validation errors
    if (err instanceof MongooseError.ValidationError) {
        const errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));
        return res.status(400).json(new ApiResponse(500, false, 'Validation Error', null, errors));
    }

    // Handle Mongoose CastError (e.g., invalid ObjectId)
    if (err instanceof MongooseError.CastError) {
        return res.status(400).json(new ApiResponse(500, false, 'Invalid ID', null, err.message));
    }

    // Handle MongoDB duplicate key error
    if (err instanceof MongoError && err.code === 11000) {
        const errMongo: any = err;
        const field = Object.keys(errMongo?.keyPattern)[0];
        return res.status(409).json(new ApiResponse(500, false, 'Duplicate Key Error', null, `The ${field} already exists.`));
    }

    // Handle other MongoDB errors
    if (err instanceof MongoError) {
        return res.status(500).json(new ApiResponse(500, false, 'Database Error', null, err.message));
    }

    // Handle custom ApiError
    if (err instanceof Error && 'statusCode' in err) {
        const apiError: any = err;
        return res.status(apiError.statusCode || 500).json(new ApiResponse(500, false, apiError.message || 'Internal Server Error', null, apiError.errors));
    }

    // Handle other errors
    if (err instanceof Error) {
        return res.status(500).json(new ApiResponse(500, false, 'Internal Server Error', null, err.message));
    }

    // Handle unknown errors
    return res.status(500).json(new ApiResponse(500, false, 'An unexpected error occurred'));
};