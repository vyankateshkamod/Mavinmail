import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { UserRole } from '../middleware/roleMiddleware.js';

// ============================================================================
// USER LISTING & DETAILS
// ============================================================================

interface ListUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
}

export const listUsers = async (options: ListUsersOptions = {}) => {
    const { page = 1, limit = 20, search, role, isActive } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (typeof isActive === 'boolean') {
        where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        usageLogs: true,
                        connectedAccounts: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

export const getUserById = async (id: number) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            preferredModel: true,
            _count: {
                select: {
                    usageLogs: true,
                    connectedAccounts: true,
                    syncHistory: true,
                    scheduledTasks: true,
                },
            },
            connectedAccounts: {
                select: {
                    id: true,
                    provider: true,
                    email: true,
                    createdAt: true,
                },
            },
            settings: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

interface CreateUserParams {
    email: string;
    password: string;
    role?: UserRole;
    firstName?: string;
    lastName?: string;
}

export const createUserByAdmin = async (
    params: CreateUserParams,
    actorId: number,
    ipAddress?: string
) => {
    const { email, password, role = 'USER', firstName, lastName } = params;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role,
            firstName,
            lastName,
            // preferredModel is null by default - resolved dynamically from DB/env
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    // Log the action
    await logAdminAction({
        actorId,
        action: 'USER_CREATED',
        targetType: 'USER',
        targetId: user.id,
        metadata: { email, role, firstName, lastName },
        ipAddress,
    });

    return user;
};

export const updateUserRole = async (
    userId: number,
    newRole: UserRole,
    actorId: number,
    ipAddress?: string
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const oldRole = user.role;

    // Update the role
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
            id: true,
            email: true,
            role: true,
        },
    });

    // Log the action
    await logAdminAction({
        actorId,
        action: 'ROLE_CHANGED',
        targetType: 'USER',
        targetId: userId,
        metadata: { oldRole, newRole },
        ipAddress,
    });

    return updatedUser;
};

export const suspendUser = async (
    userId: number,
    actorId: number,
    reason?: string,
    ipAddress?: string
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true, role: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.isActive) {
        throw new Error('User is already suspended');
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
            id: true,
            email: true,
            isActive: true,
        },
    });

    await logAdminAction({
        actorId,
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: userId,
        metadata: { reason },
        ipAddress,
    });

    return updatedUser;
};

export const activateUser = async (
    userId: number,
    actorId: number,
    ipAddress?: string
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.isActive) {
        throw new Error('User is already active');
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: {
            id: true,
            email: true,
            isActive: true,
        },
    });

    await logAdminAction({
        actorId,
        action: 'USER_ACTIVATED',
        targetType: 'USER',
        targetId: userId,
        metadata: {},
        ipAddress,
    });

    return updatedUser;
};

// ============================================================================
// PLATFORM STATS
// ============================================================================

export const getPlatformStats = async () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        usersToday,
        usersByRole,
        apiCallsToday,
        apiCallsMonth,
        totalApiCalls,
        syncHistoryToday,
    ] = await Promise.all([
        // Total users (excluding admins)
        prisma.user.count({
            where: {
                role: { notIn: ['ADMIN', 'SUPER_ADMIN'] }
            }
        }),

        // Active users (not suspended, excluding admins)
        prisma.user.count({
            where: {
                isActive: true,
                role: { notIn: ['ADMIN', 'SUPER_ADMIN'] }
            }
        }),

        // Suspended users (excluding admins)
        prisma.user.count({
            where: {
                isActive: false,
                role: { notIn: ['ADMIN', 'SUPER_ADMIN'] }
            }
        }),

        // New users today
        prisma.user.count({
            where: { createdAt: { gte: startOfToday } },
        }),

        // Users by role
        prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        }),

        // API calls today
        prisma.usageLog.count({
            where: { createdAt: { gte: startOfToday } },
        }),

        // API calls this month
        prisma.usageLog.count({
            where: { createdAt: { gte: startOfMonth } },
        }),

        // Total API calls (All time)
        prisma.usageLog.count(),

        // Total emails synced today
        prisma.syncHistory.aggregate({
            where: { syncedAt: { gte: startOfToday } },
            _sum: { emailCount: true },
        }),
    ]);

    // Transform role counts
    const roleBreakdown = usersByRole.reduce((acc: Record<string, number>, item) => {
        acc[item.role] = item._count.role;
        return acc;
    }, {});

    return {
        users: {
            total: totalUsers,
            active: activeUsers,
            suspended: suspendedUsers,
            newToday: usersToday,
            byRole: roleBreakdown,
        },
        activity: {
            apiCallsToday,
            apiCallsMonth,
            totalApiCalls,
            emailsSyncedToday: syncHistoryToday._sum.emailCount || 0,
        },
    };
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

interface LogAdminActionParams {
    actorId: number;
    action: string;
    targetType: string;
    targetId?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
}

export const logAdminAction = async (params: LogAdminActionParams) => {
    return prisma.auditLog.create({
        data: {
            actorId: params.actorId,
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId,
            metadata: params.metadata || {},
            ipAddress: params.ipAddress,
        },
    });
};

export const getAuditLogs = async (options: {
    page?: number;
    limit?: number;
    actorId?: number;
    action?: string;
}) => {
    const { page = 1, limit = 50, actorId, action } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (actorId) {
        where.actorId = actorId;
    }

    if (action) {
        where.action = action;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                actor: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

// Default system config values
const DEFAULT_SYSTEM_CONFIG: Record<string, any> = {
    maintenance_mode: false,
    maintenance_message: '',
    system_announcement: '',
    system_announcement_active: false,
};

/**
 * Get a single system config value
 */
export const getSystemConfig = async (key: string): Promise<any> => {
    const config = await prisma.systemConfig.findUnique({
        where: { key },
    });

    if (!config) {
        return DEFAULT_SYSTEM_CONFIG[key] ?? null;
    }

    try {
        return JSON.parse(config.value);
    } catch {
        return config.value;
    }
};

/**
 * Set a single system config value
 */
export const setSystemConfig = async (
    key: string,
    value: any,
    actorId?: number
): Promise<void> => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    await prisma.systemConfig.upsert({
        where: { key },
        create: {
            key,
            value: stringValue,
            updatedBy: actorId,
        },
        update: {
            value: stringValue,
            updatedBy: actorId,
        },
    });

    // Log the action if actorId is provided
    if (actorId) {
        await logAdminAction({
            actorId,
            action: 'SYSTEM_CONFIG_CHANGED',
            targetType: 'SYSTEM',
            metadata: { key, value },
        });
    }
};

/**
 * Get all system settings as a flat object
 */
export const getAllSystemSettings = async (): Promise<Record<string, any>> => {
    const configs = await prisma.systemConfig.findMany();

    const result: Record<string, any> = { ...DEFAULT_SYSTEM_CONFIG };

    for (const config of configs) {
        try {
            result[config.key] = JSON.parse(config.value);
        } catch {
            result[config.key] = config.value;
        }
    }

    return result;
};

/**
 * Update multiple system settings at once
 */
export const updateSystemSettings = async (
    settings: Record<string, any>,
    actorId: number,
    ipAddress?: string
): Promise<Record<string, any>> => {
    const updates = Object.entries(settings).map(([key, value]) =>
        setSystemConfig(key, value, actorId)
    );

    await Promise.all(updates);

    return getAllSystemSettings();
};

/**
 * Get public system status (for unauthenticated requests)
 * Returns only maintenance mode and announcement info
 */
export const getPublicSystemStatus = async (): Promise<{
    maintenanceMode: boolean;
    maintenanceMessage: string;
    announcement: string;
    announcementActive: boolean;
}> => {
    const [
        maintenanceMode,
        maintenanceMessage,
        announcement,
        announcementActive,
    ] = await Promise.all([
        getSystemConfig('maintenance_mode'),
        getSystemConfig('maintenance_message'),
        getSystemConfig('system_announcement'),
        getSystemConfig('system_announcement_active'),
    ]);

    return {
        maintenanceMode: maintenanceMode ?? false,
        maintenanceMessage: maintenanceMessage ?? '',
        announcement: announcement ?? '',
        announcementActive: announcementActive ?? false,
    };
};

