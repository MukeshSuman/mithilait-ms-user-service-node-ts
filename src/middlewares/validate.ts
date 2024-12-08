import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ApiError } from '../utils/apiResponse';

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(
        new ApiError({
          httpStatusCode: 400,
          message: errorMessage,
          code: 'VALIDATION_ERROR',
        })
      );
    }
    next();
  };
};
