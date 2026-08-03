import { type Response } from 'express';

/**
 * Standardized API response helpers.
 *
 * Ensures every endpoint returns a consistent shape:
 *   { success: true, data: T }              — on success
 *   { success: false, error: string, ... }   — on failure
 *
 * Usage in controllers:
 *   return ApiResponse.success(res, user);
 *   return ApiResponse.created(res, ticket);
 *   return ApiResponse.error(res, 'Not found', 404);
 */
export class ApiResponse {
    /** 200 OK */
    static success<T>(res: Response, data: T, meta?: Record<string, unknown>) {
        return res.status(200).json({
            success: true,
            data,
            ...(meta && { meta }),
        });
    }

    /** 201 Created */
    static created<T>(res: Response, data: T) {
        return res.status(201).json({
            success: true,
            data,
        });
    }

    /** 204 No Content */
    static noContent(res: Response) {
        return res.status(204).send();
    }

    /** Generic error response */
    static error(
        res: Response,
        message: string,
        statusCode = 500,
        details?: unknown
    ) {
        const body: Record<string, unknown> = { success: false, error: message };
        if (details !== undefined) body.details = details;
        return res.status(statusCode).json(body);
    }

    /** 400 Bad Request */
    static badRequest(res: Response, message = 'Bad request', details?: unknown) {
        return this.error(res, message, 400, details);
    }

    /** 401 Unauthorized */
    static unauthorized(res: Response, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    /** 403 Forbidden */
    static forbidden(res: Response, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    /** 404 Not Found */
    static notFound(res: Response, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    /** 429 Too Many Requests */
    static tooManyRequests(res: Response, message = 'Too many requests') {
        return this.error(res, message, 429);
    }

    /** Paginated response */
    static paginated<T>(
        res: Response,
        data: T[],
        pagination: { page: number; limit: number; total: number }
    ) {
        return res.status(200).json({
            success: true,
            data,
            meta: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: Math.ceil(pagination.total / pagination.limit),
            },
        });
    }
}
