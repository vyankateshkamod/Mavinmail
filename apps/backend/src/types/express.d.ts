import { TokenPayload } from '../middleware/authMiddleware.js';

/**
 * Express module augmentation.
 *
 * Tells TypeScript that Express's Request.user can be our TokenPayload.
 * This eliminates the need for AuthenticatedRequest in most cases —
 * you can just use `req.user?.userId` directly on standard Request objects.
 */
declare global {
    namespace Express {
        interface User extends TokenPayload { }
    }
}
