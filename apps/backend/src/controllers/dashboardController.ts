/**
 * Dashboard Controller
 * 
 * Handles all dashboard-related API endpoints including:
 * - Dashboard statistics
 * - Activity feed
 * - Usage trends
 * - Account statistics
 */

import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import {
    getDashboardStats,
    getRecentActivity,
    getUsageTrends,
    getAccountEmailStats,
    deleteActivity,
    logUsage
} from '../services/analyticsService.js';

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * GET /api/dashboard/stats
 * Returns comprehensive dashboard statistics
 */
export const getStats = async (req: Request, res: Response) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;

    try {
        const stats = await getDashboardStats(userId);
        res.json(stats);
    } catch (error: any) {
        logger.error('[DashboardController] Error fetching stats:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================================
// ACTIVITY FEED
// ============================================================================

/**
 * GET /api/dashboard/activity
 * Returns recent AI activity for the activity feed
 */
export const getActivity = async (req: Request, res: Response) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Cap the limit to prevent abuse
    const safeLimit = Math.min(limit, 50);

    try {
        const activity = await getRecentActivity(userId, safeLimit);
        res.json({ activity });
    } catch (error: any) {
        logger.error('[DashboardController] Error fetching activity:', error);
        res.status(500).json({
            error: 'Failed to fetch activity feed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================================
// USAGE TRENDS
// ============================================================================

/**
 * GET /api/dashboard/trends
 * Returns usage trends for charts
 */
export const getTrends = async (req: Request, res: Response) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const days = parseInt(req.query.days as string) || 7;

    // Cap the days to prevent expensive queries
    const safeDays = Math.min(Math.max(days, 1), 90);

    try {
        const trends = await getUsageTrends(userId, safeDays);
        res.json({ trends });
    } catch (error: any) {
        logger.error('[DashboardController] Error fetching trends:', error);
        res.status(500).json({
            error: 'Failed to fetch usage trends',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================================================
// ACCOUNT EMAIL STATS
// ============================================================================

/**
 * GET /api/dashboard/account-stats
 * Returns email statistics for connected accounts
 */
export const getAccountStats = async (req: Request, res: Response) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;

    try {
        const stats = await getAccountEmailStats(userId);
        res.json(stats);
    } catch (error: any) {
        logger.error('[DashboardController] Error fetching account stats:', error);
        res.status(500).json({
            error: 'Failed to fetch account statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * DELETE /api/dashboard/activity/:id
 * Deletes a specific activity log
 */
export const deleteActivityLog = async (req: Request, res: Response) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const activityId = parseInt(req.params.id);

    if (isNaN(activityId)) {
        return res.status(400).json({ error: 'Invalid activity ID' });
    }

    try {
        const success = await deleteActivity(userId, activityId);
        if (success) {
            res.json({ success: true, message: 'Activity deleted successfully' });
        } else {
            res.status(404).json({ error: 'Activity not found or not owned by user' });
        }
    } catch (error: any) {
        logger.error('[DashboardController] Error deleting activity:', error);
        res.status(500).json({
            error: 'Failed to delete activity',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * POST /api/dashboard/usage
 * Records a client-side AI usage event so local-only flows still appear in dashboard metrics.
 */
export const recordUsage = async (req: Request, res: Response) => {
    if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { action, metadata, success } = req.body as {
        action: Parameters<typeof logUsage>[0]['action'];
        metadata?: Record<string, unknown>;
        success?: boolean;
    };

    try {
        await logUsage({
            userId,
            action,
            metadata,
            success,
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        logger.error('[DashboardController] Error recording usage:', error);
        res.status(500).json({
            error: 'Failed to record usage',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getStats,
    getActivity,
    getTrends,
    getAccountStats,
    deleteActivityLog,
    recordUsage,
};
