import { type Request, type Response, type NextFunction } from 'express';
import { z, type ZodType } from 'zod';

/**
 * Reusable validation middleware factory.
 *
 * Usage in routes:
 * ```ts
 * router.post('/signup', validate(signupSchema), signup);
 * ```
 *
 * Validates req.body against the provided Zod schema.
 * On failure, returns a 400 with structured field errors.
 * On success, replaces req.body with the parsed (typed & stripped) data.
 */
export function validate<T extends ZodType>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const flattened = result.error.flatten();
            _res.status(400).json({
                error: 'Validation failed',
                details: flattened.fieldErrors,
            });
            return;
        }

        // Replace body with parsed/stripped data (removes unknown keys)
        req.body = result.data;
        next();
    };
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery<T extends ZodType>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            const flattened = result.error.flatten();
            _res.status(400).json({
                error: 'Invalid query parameters',
                details: flattened.fieldErrors,
            });
            return;
        }

        req.query = result.data as typeof req.query;
        next();
    };
}

/**
 * Validates route parameters against a Zod schema.
 */
export function validateParams<T extends ZodType>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            const flattened = result.error.flatten();
            _res.status(400).json({
                error: 'Invalid route parameters',
                details: flattened.fieldErrors,
            });
            return;
        }

        req.params = result.data as typeof req.params;
        next();
    };
}
