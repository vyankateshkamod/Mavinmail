/**
 * Analytics Service
 * 
 * Handles all analytics-related operations including:
 * - Logging AI usage events
 * - Fetching aggregated dashboard statistics
 * - Calculating time-saved metrics
 * - Usage trend analysis
 */

import prisma from '../utils/prisma.js';
import { google } from 'googleapis';
import { decrypt } from './encryptionService.js';
import logger from '../utils/logger.js';

// ============================================================================
// TYPES
// ============================================================================

export type ActionType =
    | 'summarize'
    | 'draft'
    | 'enhance'
    | 'rag_query'
    | 'digest'
    | 'thread_summary'
    | 'autocomplete';

export interface LogUsageParams {
    userId: number;
    action: ActionType;
    metadata?: Record<string, any>;
    success?: boolean;
}

export interface DashboardStats {
    emailsToday: number;
    totalEmails: number;
    emailsIndexed: number;
    draftsGenerated: number;
    questionsAnswered: number;
    threadsSummarized: number;
    textEnhancements: number;
    timeSavedMinutes: number;
    lastSyncTime: string | null;
    connectedAccounts: number;
}

export interface ActivityItem {
    id: number;
    action: string;
    description: string;
    timestamp: string;
    success: boolean;
}

export interface UsageTrend {
    date: string;
    total: number;
    breakdown: {
        summarize: number;
        draft: number;
        enhance: number;
        rag: number;
        digest: number;
    };
}

// ============================================================================
// TIME ESTIMATES (in minutes)
// ============================================================================

const TIME_ESTIMATES: Record<ActionType, number> = {
    summarize: 3,        // Time to read an email thread manually
    draft: 5,            // Time to write a reply from scratch
    enhance: 2,          // Time to edit and polish text
    rag_query: 4,        // Time to search through emails manually
    digest: 10,          // Time to read all daily emails individually
    thread_summary: 3,   // Time to read a thread
    autocomplete: 1,     // Time saved on typing
};

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log a usage event for analytics tracking
 */
export async function logUsage(params: LogUsageParams): Promise<void> {
    const { userId, action, metadata = {}, success = true } = params;

    try {
        await prisma.usageLog.create({
            data: {
                userId,
                action,
                metadata,
                success,
            },
        });
    } catch (error) {
        // Don't throw - logging failures shouldn't break main functionality
        logger.error('[AnalyticsService] Failed to log usage:', error);
    }
}

/**
 * Log sync history when emails are synced
 */
export async function logSyncHistory(
    userId: number,
    emailCount: number,
    status: 'success' | 'failed' | 'partial' = 'success',
    errorMsg?: string
): Promise<void> {
    try {
        await prisma.syncHistory.create({
            data: {
                userId,
                emailCount,
                status,
                errorMsg,
            },
        });
    } catch (error) {
        logger.error('[AnalyticsService] Failed to log sync history:', error);
    }
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

/**
 * Get comprehensive dashboard statistics for a user
 */
export async function getDashboardStats(userId: number): Promise<DashboardStats> {
    // Get start of today (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Run all queries in parallel for performance
    const [
        usageCounts,
        todayDigest,
        syncStats,
        connectedAccountsCount,
        lastSync,
    ] = await Promise.all([
        // Count all usage by action type (all time)
        prisma.usageLog.groupBy({
            by: ['action'],
            where: { userId, success: true },
            _count: { action: true },
        }),

        // Count emails synced today
        prisma.syncHistory.aggregate({
            where: {
                userId,
                status: 'success',
                syncedAt: { gte: todayStart },
            },
            _sum: { emailCount: true },
        }),

        // Get total emails synced and indexed
        prisma.syncHistory.aggregate({
            where: { userId, status: 'success' },
            _sum: { emailCount: true },
        }),

        // Count connected accounts
        prisma.connectedAccount.count({
            where: { userId },
        }),

        // Get last sync time
        prisma.syncHistory.findFirst({
            where: { userId, status: 'success' },
            orderBy: { syncedAt: 'desc' },
            select: { syncedAt: true, emailCount: true },
        }),
    ]);

    // --- LIVE STATS FETCHING ---
    // Fetch real-time email counts from Gmail API with robust error handling
    let liveStats = { today: 0, total: 0, usingLive: false };

    try {
        const googleAccount = await prisma.connectedAccount.findFirst({
            where: { userId, provider: 'google' }
        });

        if (googleAccount) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID!,
                process.env.GOOGLE_CLIENT_SECRET!
            );

            // Set credentials with both access and refresh tokens for auto-refresh
            try {
                const credentials: any = {
                    access_token: decrypt(googleAccount.accessToken)
                };

                // Include refresh token if available for automatic token refresh
                if (googleAccount.refreshToken) {
                    credentials.refresh_token = decrypt(googleAccount.refreshToken);
                }

                oauth2Client.setCredentials(credentials);
            } catch (decryptError) {
                logger.error('[Analytics] Token decryption failed:', decryptError);
                throw new Error('Token decryption failed');
            }

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Use Unix timestamp for robust timezone handling (local midnight)
            // 'after:YYYY/MM/DD' can be ambiguous or UTC-based, missing early morning emails
            const midnightTimestamp = Math.floor(todayStart.getTime() / 1000);

            // Fetch stats in parallel for performance
            const [profileRes, todayRes] = await Promise.all([
                // Get user profile which contains messagesTotal (All Mail count)
                gmail.users.getProfile({
                    userId: 'me'
                }).catch((err) => {
                    logger.error('[Analytics] Failed to fetch Gmail profile:', err.message);
                    return null;
                }),
                // Get all emails from today (Sent + Received) using timestamp
                gmail.users.messages.list({
                    userId: 'me',
                    q: `after:${midnightTimestamp}`,
                    maxResults: 500,
                    includeSpamTrash: false
                }).catch((err) => {
                    logger.error('[Analytics] Failed to fetch today\'s emails:', err.message);
                    return null;
                })
            ]);

            if (profileRes && todayRes) {
                // Log the raw data for debugging
                logger.info(`[Analytics] Raw Gmail API data for user ${userId}:`);
                logger.info(`  - Query used: after:${midnightTimestamp} (${new Date(midnightTimestamp * 1000).toLocaleString()})`);
                logger.info(`  - Profile messagesTotal: ${profileRes.data.messagesTotal}`);
                logger.info(`  - Today's resultSizeEstimate: ${todayRes.data.resultSizeEstimate}`);
                logger.info(`  - Actual IDs returned: ${todayRes.data.messages?.length || 0}`);

                liveStats = {
                    // Use actual length if available and less than resultSizeEstimate, otherwise rely on estimate
                    today: todayRes.data.messages?.length || todayRes.data.resultSizeEstimate || 0,
                    // messagesTotal from profile is the exact count of all emails (All Mail)
                    total: profileRes.data.messagesTotal || 0,
                    usingLive: true
                };
                logger.info(`[Analytics] Successfully fetched live stats for user ${userId}: ${liveStats.total} total, ${liveStats.today} today`);
            } else {
                logger.warn(`[Analytics] Partial Gmail API response for user ${userId}, falling back to DB stats`);
            }
        }
    } catch (e: any) {
        logger.warn(`[Analytics] Failed to fetch live Gmail stats for user ${userId}:`, e.message);
        // Fallback to DB stats seamlessly
    }

    // Process usage counts into a map
    const usageMap: Record<string, number> = {};
    for (const item of usageCounts) {
        usageMap[item.action] = item._count.action;
    }

    // --- DYNAMIC TIME SAVED CALCULATION ---

    // 1. Fetch digest logs to look at actual email counts
    const digestLogs = await prisma.usageLog.findMany({
        where: { userId, action: 'digest', success: true },
        select: { metadata: true }
    });

    let digestEmailCount = 0;
    digestLogs.forEach(log => {
        const meta = log.metadata as any;
        if (meta && typeof meta.emailCount === 'number') {
            digestEmailCount += meta.emailCount;
        }
    });

    // 2. Calculate base time saved from usage map (excluding digest)
    let timeSavedMinutes = 0;
    for (const [action, count] of Object.entries(usageMap)) {
        if (action === 'digest') continue; // Handle digest separately
        const estimate = TIME_ESTIMATES[action as ActionType] || 0;
        timeSavedMinutes += count * estimate;
    }

    // 3. Add dynamic digest savings (2 minutes per email summarized)
    // If no metadata, fall back to fixed 10 mins per digest
    const digestCount = usageMap['digest'] || 0;
    const dynamicDigestSavings = digestEmailCount > 0
        ? (digestEmailCount * 2)
        : (digestCount * 10);

    timeSavedMinutes += dynamicDigestSavings;

    // Determine final stats values with intelligent fallback
    // Prefer live Gmail data, but fall back to DB stats if API fails
    const emailsToday = liveStats.usingLive
        ? liveStats.today
        : (todayDigest._sum.emailCount || 0);

    const totalEmails = liveStats.usingLive
        ? liveStats.total
        : (syncStats._sum.emailCount || 0);

    logger.info(`[Analytics] Final stats for user ${userId}: emailsToday=${emailsToday}, totalEmails=${totalEmails}, source=${liveStats.usingLive ? 'Gmail API' : 'Database'}`);

    return {
        emailsToday,
        totalEmails,
        emailsIndexed: syncStats._sum.emailCount || 0, // Indexed count remains DB-based
        draftsGenerated: usageMap['draft'] || 0,
        questionsAnswered: usageMap['rag_query'] || 0,
        threadsSummarized: (usageMap['summarize'] || 0) + (usageMap['thread_summary'] || 0),
        textEnhancements: usageMap['enhance'] || 0,
        timeSavedMinutes,
        lastSyncTime: lastSync?.syncedAt?.toISOString() || null,
        connectedAccounts: connectedAccountsCount,
    };
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================

/**
 * Get recent AI activity for a user
 */
export async function getRecentActivity(
    userId: number,
    limit: number = 10
): Promise<ActivityItem[]> {
    const logs = await prisma.usageLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return logs.map((log) => ({
        id: log.id,
        action: log.action,
        description: getActionDescription(log.action, log.metadata as any),
        timestamp: log.createdAt.toISOString(),
        success: log.success,
        metadata: log.metadata as any,
    }));
}

/**
 * Generate human-readable description for an action
 */
function getActionDescription(action: string, metadata?: Record<string, any>): string {
    switch (action) {
        case 'summarize':
            return 'Summarized an email';
        case 'thread_summary':
            return 'Summarized email thread';
        case 'draft':
            return 'Generated draft reply';
        case 'enhance':
            const type = metadata?.type || 'general';
            return `Enhanced text (${type})`;
        case 'rag_query':
            const query = metadata?.query?.slice(0, 50) || 'question';
            return `Answered: "${query}..."`;
        case 'digest':
            const count = metadata?.emailCount || 0;
            return `Generated daily digest (${count} emails)`;
        case 'autocomplete':
            return 'AI autocomplete suggestion';
        default:
            return `AI action: ${action}`;
    }
}

// ============================================================================
// USAGE TRENDS
// ============================================================================

/**
 * Get usage trends for the past N days
 */
export async function getUsageTrends(
    userId: number,
    days: number = 7
): Promise<UsageTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all logs in the period
    const logs = await prisma.usageLog.findMany({
        where: {
            userId,
            createdAt: { gte: startDate },
            success: true,
        },
        select: {
            action: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trendMap: Record<string, UsageTrend> = {};

    // Initialize all days (using Local Date to match user's perspective)
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        trendMap[dateStr] = {
            date: dateStr,
            total: 0,
            breakdown: {
                summarize: 0,
                draft: 0,
                enhance: 0,
                rag: 0,
                digest: 0,
            },
        };
    }

    // Populate with actual data
    for (const log of logs) {
        // Use local date string to align with "today" concept on client
        const dateStr = log.createdAt.toLocaleDateString('en-CA');
        if (trendMap[dateStr]) {
            trendMap[dateStr].total++;

            const action = log.action;
            if (action === 'summarize' || action === 'thread_summary') {
                trendMap[dateStr].breakdown.summarize++;
            } else if (action === 'draft') {
                trendMap[dateStr].breakdown.draft++;
            } else if (action === 'enhance') {
                trendMap[dateStr].breakdown.enhance++;
            } else if (action === 'rag_query') {
                trendMap[dateStr].breakdown.rag++;
            } else if (action === 'digest') {
                trendMap[dateStr].breakdown.digest++;
            }
        }
    }

    return Object.values(trendMap);
}

// ============================================================================
// EMAIL STATISTICS (per account)
// ============================================================================

/**
 * Get email statistics for connected accounts
 */
export async function getAccountEmailStats(userId: number) {
    const [syncStats, lastSync] = await Promise.all([
        prisma.syncHistory.aggregate({
            where: { userId, status: 'success' },
            _sum: { emailCount: true },
        }),
        prisma.syncHistory.findFirst({
            where: { userId, status: 'success' },
            orderBy: { syncedAt: 'desc' },
        }),
    ]);

    return {
        totalProcessed: syncStats._sum.emailCount || 0,
        indexed: syncStats._sum.emailCount || 0,
        lastSync: lastSync?.syncedAt?.toISOString() || null,
    };
}

/**
 * Delete a specific activity log
 */
export async function deleteActivity(userId: number, activityId: number): Promise<boolean> {
    const result = await prisma.usageLog.deleteMany({
        where: {
            id: activityId,
            userId: userId
        }
    });

    return result.count > 0;
}

export default {
    logUsage,
    logSyncHistory,
    getDashboardStats,
    getRecentActivity,
    getUsageTrends,
    getAccountEmailStats,
    deleteActivity,
};
