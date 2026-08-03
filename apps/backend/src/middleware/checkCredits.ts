import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

// Cost table for features
export const FEATURE_COSTS = {
    SUMMARIZE_EMAIL: 5,
    DRAFT_REPLY: 10,
    ENHANCE_TEXT: 2,
    ASK_QUESTION: 15,
    AUTOCOMPLETE: 1,
    SCHEDULE_TASK: 20,
};

/**
 * Middleware to check if user has enough credits for the requested feature.
 * If successful, it deducts the credits from the user's balance.
 */
export const checkCredits = (cost: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Get User ID from request (set by authMiddleware)
            const userId = (req.user as any)?.userId;

            if (!userId) {
                return next(new AppError('User not authenticated', 401));
            }

            // 2. Fetch User's current credit balance and role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { credits: true, plan: true, role: true },
            });

            if (!user) {
                return next(new AppError('User not found', 404));
            }

            // 3. Check for Admin Bypass
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                logger.info(`Admin bypass for user ${userId} (Role: ${user.role}). No credits deducted.`);
                res.setHeader('X-Credits-Remaining', 'Unlimited');
                res.setHeader('X-Credits-Cost', '0');
                return next();
            }

            // 4. Check Balance
            if (user.credits < cost) {
                logger.warn(`User ${userId} has insufficient credits (${user.credits} < ${cost})`);
                return next(new AppError(`Insufficient credits. You need ${cost} credits but have ${user.credits}. Top-up or upgrade to PRO for more credits.`, 403));
            }

            // 5. Deduct Credits
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { decrement: cost } },
            });

            logger.info(`Deducted ${cost} credits from user ${userId}. New balance: ${user.credits - cost}`);

            // Attach remaining credits to response headers for frontend visibility
            res.setHeader('X-Credits-Remaining', String(user.credits - cost));
            res.setHeader('X-Credits-Cost', String(cost));

            next();
        } catch (error) {
            logger.error('Error checking credits:', error);
            next(new AppError('Failed to process credit check', 500));
        }
    };
};
