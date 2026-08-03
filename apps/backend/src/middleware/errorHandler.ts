import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Global error-handling middleware.
 *
 * Express recognizes error-handlers by their 4-argument signature.
 * Mount this AFTER all routes in app.ts:
 *   app.use(errorHandler);
 *
 * Handles:
 *   - AppError          → returns statusCode + message
 *   - ZodError          → 400 + flattened validation errors
 *   - Prisma errors     → mapped to appropriate HTTP codes
 *   - Unknown errors    → 500 + generic message (details hidden in production)
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // ─── AppError (our own) ──────────────────────────
    if (err instanceof AppError) {
        if (!err.isOperational) {
            logger.error({ err }, 'Non-operational error');
        } else {
            logger.warn({ statusCode: err.statusCode }, err.message);
        }

        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }

    // ─── Zod validation errors ───────────────────────
    if (err instanceof ZodError) {
        const flattened = err.flatten();
        logger.warn({ errors: flattened.fieldErrors }, 'Validation failed');

        res.status(400).json({
            error: 'Validation failed',
            details: flattened.fieldErrors,
        });
        return;
    }

    // ─── Prisma known errors ─────────────────────────
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let statusCode = 500;
        let message = 'Database error';

        switch (err.code) {
            case 'P2002': // Unique constraint
                statusCode = 409;
                message = 'A record with this value already exists';
                break;
            case 'P2025': // Record not found
                statusCode = 404;
                message = 'Record not found';
                break;
            case 'P2003': // Foreign key constraint
                statusCode = 400;
                message = 'Related record not found';
                break;
        }

        logger.warn({ code: err.code, meta: err.meta }, message);
        res.status(statusCode).json({ error: message });
        return;
    }

    // ─── Unknown / unexpected errors ─────────────────
    logger.error({ err }, 'Unhandled error');

    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: 'Internal server error',
        ...(isDev && { details: err.message, stack: err.stack }),
    });
}

/**
 * Catches 404s for undefined routes.
 * Mount this AFTER all routes and BEFORE errorHandler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
