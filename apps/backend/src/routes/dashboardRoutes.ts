/**
 * Dashboard Routes
 * 
 * All routes are protected by authentication middleware
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
    getStats,
    getActivity,
    getTrends,
    getAccountStats,
    deleteActivityLog
} from '../controllers/dashboardController.js';

const router = Router();

// Apply authentication to all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get('/stats', getStats);

/**
 * GET /api/dashboard/activity
 * Get recent AI activity feed
 * Query params:
 *   - limit (optional): Number of items to return (default: 10, max: 50)
 */
router.get('/activity', getActivity);

/**
 * GET /api/dashboard/trends
 * Get usage trends for charts
 * Query params:
 *   - days (optional): Number of days of history (default: 7, max: 90)
 */
router.get('/trends', getTrends);

/**
 * GET /api/dashboard/account-stats
 * Get email statistics for connected accounts
 */
router.get('/account-stats', getAccountStats);

/**
 * DELETE /api/dashboard/activity/:id
 * Delete a specific activity log
 */
router.delete('/activity/:id', deleteActivityLog);

export default router;
