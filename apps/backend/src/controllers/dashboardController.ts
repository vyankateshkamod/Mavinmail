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
import {
    getDashboardStats,
    getRecentActivity,
    getUsageTrends,
    getAccountEmailStats,
    deleteActivity
} from '../services/analyticsService.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
    };
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * GET /api/dashboard/stats
 * Returns comprehensive dashboard statistics
 */
export const getStats = async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authenticatedReq.user.userId;

    try {
        const stats = await getDashboardStats(userId);
        res.json(stats);
    } catch (error: any) {
        console.error('[DashboardController] Error fetching stats:', error);
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
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authenticatedReq.user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Cap the limit to prevent abuse
    const safeLimit = Math.min(limit, 50);

    try {
        const activity = await getRecentActivity(userId, safeLimit);
        res.json({ activity });
    } catch (error: any) {
        console.error('[DashboardController] Error fetching activity:', error);
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
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authenticatedReq.user.userId;
    const days = parseInt(req.query.days as string) || 7;

    // Cap the days to prevent expensive queries
    const safeDays = Math.min(Math.max(days, 1), 90);

    try {
        const trends = await getUsageTrends(userId, safeDays);
        res.json({ trends });
    } catch (error: any) {
        console.error('[DashboardController] Error fetching trends:', error);
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
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authenticatedReq.user.userId;

    try {
        const stats = await getAccountEmailStats(userId);
        res.json(stats);
    } catch (error: any) {
        console.error('[DashboardController] Error fetching account stats:', error);
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
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authenticatedReq.user.userId;
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
        console.error('[DashboardController] Error deleting activity:', error);
        res.status(500).json({
            error: 'Failed to delete activity',
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
};
