import { IApiError } from "../interfaces";

export class ApiResponse<T> {
    constructor(
        public statusCode: number,
        public success: boolean,
        public message: string,
        public data?: T | Error | unknown,
        public error?: any
    ) { }
}

export class ApiError extends Error {
    public statusCode: number;
    constructor(public apiError: IApiError) {
        super(apiError.message);
        this.name = 'ApiError';
        this.statusCode = apiError.httpStatusCode || 500;
        this.message = apiError.message || 'Unexpected error';
    }
}