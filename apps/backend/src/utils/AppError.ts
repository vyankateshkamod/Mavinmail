/**
 * Custom application error class.
 *
 * Extends the native Error with HTTP status codes and an operational flag
 * so the global error handler knows which errors are safe to expose to clients
 * vs. which are unexpected bugs.
 *
 * Usage:
 * ```ts
 * throw new AppError('User not found', 404);
 * throw new AppError('Invalid credentials', 401);
 * throw AppError.badRequest('Email is required');
 * throw AppError.unauthorized('Token expired');
 * ```
 */
export class AppError extends Error {
    public readonly statusCode: number;
    /** true = expected/known error; false = unexpected bug */
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    // ─── Factory Methods ─────────────────────────────
    static badRequest(message = 'Bad request') {
        return new AppError(message, 400);
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Forbidden') {
        return new AppError(message, 403);
    }

    static notFound(message = 'Not found') {
        return new AppError(message, 404);
    }

    static conflict(message = 'Conflict') {
        return new AppError(message, 409);
    }

    static tooManyRequests(message = 'Too many requests') {
        return new AppError(message, 429);
    }

    static internal(message = 'Internal server error') {
        return new AppError(message, 500, false);
    }
}
