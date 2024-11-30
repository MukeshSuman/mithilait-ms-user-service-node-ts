export const ApiErrors = {
    Unexpected: {
        code: 'UNEXPECTED',
        message: 'An unexpected error occurred.',
        httpStatusCode: 500,
    },
    MethodNotSupported: {
        code: 'METHOD_NOT_SUPPORTED',
        message: 'Unsupported HTTP request method encountered.',
        httpStatusCode: 500,
    },
    MethodNotImplemented: {
        code: 'METHOD_NOT_IMPLEMENTED',
        message: 'Method Not Implemented.',
        httpStatusCode: 501,
    },
    Forbidden: {
        code: 'FORBIDDEN',
        message: 'Not allowed.',
        httpStatusCode: 403,
    },
    UnAuthorized: {
        code: 'UNAUTHORIZED',
        message: 'Auth Token either invalid or expired.',
        httpStatusCode: 403,
    },
    BadRequest: {
        code: 'BAD_REQUEST',
        message: 'Error handling request.',
        httpStatusCode: 400,
    },
    InvalidCredentials: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.',
        httpStatusCode: 401,
    },
    InvalidParameters: {
        code: 'INVALID_PARAMETERS',
        message: 'Invalid parameters were supplied',
        httpStatusCode: 422,
    },
    NoContent: {
        code: 'NO_CONTENT',
        message: 'No result found.',
        httpStatusCode: 204,
    },
    NotFound: {
        code: 'NOT_FOUND',
        message: 'Record is not found.',
        httpStatusCode: 404,
    },
    InvalidRefreshToken: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token either invalid or expired.',
        httpStatusCode: 401,
    },
    NoTokenProvided: {
        code: 'NO_TOKEN_PROVIDED',
        message: 'No token provided.',
        httpStatusCode: 401,
    },
    InsufficientPermissions: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions.',
        httpStatusCode: 401,
    }
};
