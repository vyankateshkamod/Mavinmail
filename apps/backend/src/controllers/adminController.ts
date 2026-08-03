import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as adminService from '../services/adminService.js';
import { canModifyRole, canAssignRole, UserRole } from '../middleware/roleMiddleware.js';
import logger from '../utils/logger.js';

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export const createUser = async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
        const { email, password, role, firstName, lastName } = req.body;
        const actorId = authenticatedReq.user!.userId;
        const actorRole = authenticatedReq.user!.role;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Validate role if provided
        const validRoles: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];
        const targetRole = role || 'USER';
        if (!validRoles.includes(targetRole)) {
            return res.status(400).json({ error: 'Invalid role', validRoles });
        }

        // Check if actor can assign this role
        if (!canAssignRole(actorRole, targetRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions to assign this role',
                yourRole: actorRole,
                targetRole: targetRole
            });
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

        const user = await adminService.createUserByAdmin(
            { email, password, role: targetRole, firstName, lastName },
            actorId,
            ipAddress
        );

        res.status(201).json({
            message: 'User created successfully',
            user
        });
    } catch (error: any) {
        logger.error('Create user error:', error);
        if (error.message === 'User with this email already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
};

/**
 * GET /api/admin/users
 * List all users with pagination and search
 */
export const listUsers = async (req: Request, res: Response) => {
    try {
        const { page, limit, search, role, isActive } = req.query;

        const result = await adminService.listUsers({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            role: role as UserRole,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });

        res.json(result);
    } catch (error: any) {
        logger.error('List users error:', error);
        res.status(500).json({ error: error.message || 'Failed to list users' });
    }
};

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await adminService.getUserById(userId);
        res.json(user);
    } catch (error: any) {
        logger.error('Get user error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: error.message || 'Failed to get user' });
    }
};

/**
 * PUT /api/admin/users/:id
 * Update user role
 */
export const updateUserRole = async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
        const userId = parseInt(req.params.id);
        const { role: newRole } = req.body;
        const actorId = authenticatedReq.user!.userId;
        const actorRole = authenticatedReq.user!.role;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Validate new role
        const validRoles: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ error: 'Invalid role', validRoles });
        }

        // Prevent self-modification of role
        if (userId === actorId) {
            return res.status(403).json({ error: 'Cannot modify your own role' });
        }

        // Check if actor can assign this role
        if (!canAssignRole(actorRole, newRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions to assign this role',
                yourRole: actorRole,
                targetRole: newRole
            });
        }

        // Get target user's current role to check permissions
        const targetUser = await adminService.getUserById(userId);
        const targetRole = targetUser.role as UserRole;

        // Check if actor can modify this user
        if (!canModifyRole(actorRole, targetRole)) {
            return res.status(403).json({
                error: 'Cannot modify a user with equal or higher privileges',
                yourRole: actorRole,
                targetRole: targetRole
            });
        }

        // Get IP address for audit logging
        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

        const result = await adminService.updateUserRole(userId, newRole, actorId, ipAddress);
        res.json(result);
    } catch (error: any) {
        logger.error('Update role error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: error.message || 'Failed to update role' });
    }
};

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user account
 */
export const suspendUser = async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
        const userId = parseInt(req.params.id);
        const { reason } = req.body;
        const actorId = authenticatedReq.user!.userId;
        const actorRole = authenticatedReq.user!.role;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Prevent self-suspension
        if (userId === actorId) {
            return res.status(403).json({ error: 'Cannot suspend your own account' });
        }

        // Check target user's role
        const targetUser = await adminService.getUserById(userId);
        const targetRole = targetUser.role as UserRole;

        // Check if actor can modify this user
        if (!canModifyRole(actorRole, targetRole)) {
            return res.status(403).json({
                error: 'Cannot suspend a user with equal or higher privileges'
            });
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
        const result = await adminService.suspendUser(userId, actorId, reason, ipAddress);
        res.json({ message: 'User suspended successfully', user: result });
    } catch (error: any) {
        logger.error('Suspend user error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.message === 'User is already suspended') {
            return res.status(400).json({ error: 'User is already suspended' });
        }
        res.status(500).json({ error: error.message || 'Failed to suspend user' });
    }
};

/**
 * POST /api/admin/users/:id/activate
 * Activate a suspended user account
 */
export const activateUser = async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
        const userId = parseInt(req.params.id);
        const actorId = authenticatedReq.user!.userId;
        const actorRole = authenticatedReq.user!.role;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Check target user's role
        const targetUser = await adminService.getUserById(userId);
        const targetRole = targetUser.role as UserRole;

        // Check if actor can modify this user
        if (!canModifyRole(actorRole, targetRole)) {
            return res.status(403).json({
                error: 'Cannot activate a user with equal or higher privileges'
            });
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
        const result = await adminService.activateUser(userId, actorId, ipAddress);
        res.json({ message: 'User activated successfully', user: result });
    } catch (error: any) {
        logger.error('Activate user error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.message === 'User is already active') {
            return res.status(400).json({ error: 'User is already active' });
        }
        res.status(500).json({ error: error.message || 'Failed to activate user' });
    }
};

// ============================================================================
// PLATFORM STATS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/stats
 * Get platform-wide statistics
 */
export const getPlatformStats = async (req: Request, res: Response) => {
    try {
        const stats = await adminService.getPlatformStats();
        res.json(stats);
    } catch (error: any) {
        logger.error('Get stats error:', error);
        res.status(500).json({ error: error.message || 'Failed to get platform stats' });
    }
};

// ============================================================================
// AUDIT LOG ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/audit-logs
 * Get admin audit logs (SUPER_ADMIN only)
 */
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { page, limit, actorId, action } = req.query;

        const result = await adminService.getAuditLogs({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            actorId: actorId ? parseInt(actorId as string) : undefined,
            action: action as string,
        });

        res.json(result);
    } catch (error: any) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({ error: error.message || 'Failed to get audit logs' });
    }
};

// ============================================================================
// SYSTEM SETTINGS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/settings
 * Get all system settings
 */
export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const settings = await adminService.getAllSystemSettings();
        res.json(settings);
    } catch (error: any) {
        logger.error('Get system settings error:', error);
        res.status(500).json({ error: error.message || 'Failed to get system settings' });
    }
};

/**
 * PUT /api/admin/settings
 * Update system settings
 */
export const updateSystemSettings = async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
        const actorId = authenticatedReq.user!.userId;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

        const settings = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings object' });
        }

        const updatedSettings = await adminService.updateSystemSettings(
            settings,
            actorId,
            ipAddress
        );

        res.json({
            message: 'Settings updated successfully',
            settings: updatedSettings
        });
    } catch (error: any) {
        logger.error('Update system settings error:', error);
        res.status(500).json({ error: error.message || 'Failed to update system settings' });
    }
};

/**
 * GET /api/system/status (PUBLIC - no auth required)
 * Get public system status for maintenance mode and announcements
 */
export const getPublicSystemStatus = async (req: Request, res: Response) => {
    try {
        const status = await adminService.getPublicSystemStatus();
        res.json(status);
    } catch (error: any) {
        logger.error('Get system status error:', error);
        res.status(500).json({ error: error.message || 'Failed to get system status' });
    }
};

