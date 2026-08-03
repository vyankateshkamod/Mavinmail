import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../utils/prisma.js';
import { getLatestEmails } from './emailService.js';
import { summarizeEmailBatch } from './aiService.js';
import { resolveUserModel } from '../utils/modelHelper.js';
import logger from '../utils/logger.js';

// --- Redis Connection Setup ---
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const enableScheduler = !!process.env.REDIS_URL; // Only enable if explicitly set

let connection: Redis | null = null;
let taskQueue: Queue | null = null;
let worker: Worker | null = null;

if (enableScheduler) {
    try {
        logger.info('[Scheduler] Initializing Redis connection...');
        connection = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 3) {
                    logger.warn('[Scheduler] Redis connection failed too many times, disabling scheduler');
                    return null; // Stop retrying
                }
                return Math.min(times * 50, 2000);
            }
        });

        connection.on('error', (err) => {
            logger.warn('[Scheduler] Redis connection error (scheduler will be limited):', err.message);
        });

        connection.on('ready', () => {
            logger.info('[Scheduler] Redis connected successfully');
        });

        taskQueue = new Queue('scheduledTasks', { connection });
    } catch (error) {
        logger.error('[Scheduler] Failed to initialize Redis:', error);
    }
} else {
    logger.info('[Scheduler] Redis not configured (REDIS_URL missing). Scheduler disabled.');
}

// Define interface for Task Data
interface TaskJobData {
    taskId: number;
    userId: number;
    type: string;
    config?: any;
    frequency?: string;
}

if (connection && enableScheduler) {
    worker = new Worker<TaskJobData>(
        'scheduledTasks',
        async (job: Job<TaskJobData>) => {
            const { taskId, userId, type, config } = job.data;
            logger.info(`[Scheduler] Processing task ${taskId} type=${type} for user ${userId}`);

            try {
                if (type === 'morning-briefing') {
                    await handleMorningBriefing(userId);
                } else if (type === 'check-reply') {
                    await handleCheckReply(userId, config);
                }

                // Update task status for one-time tasks
                if (job.data.frequency === 'once') {
                    await prisma.scheduledTask.update({
                        where: { id: taskId },
                        data: { status: 'completed' }
                    });
                }

                logger.info(`[Scheduler] Task ${taskId} completed successfully`);
            } catch (error) {
                logger.error(`[Scheduler] Task ${taskId} failed:`, error);
                throw error;
            }
        },
        { connection }
    );

    worker.on('completed', (job) => {
        logger.info(`[Scheduler] Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[Scheduler] Job ${job?.id} failed with ${err.message}`);
    });
}


// ... (existing imports)

async function handleMorningBriefing(userId: number) {
    try {
        // 1. Fetch recent emails
        const emails = await getLatestEmails(userId, 10);

        if (emails.length === 0) {
            logger.info(`[MorningBriefing] No emails to summarize for user ${userId}`);
            return;
        }

        logger.info(`[MorningBriefing] Generating summary for ${emails.length} emails...`);

        // 2. Prepare for AI
        const emailInputs = emails.map(e => ({
            id: e.id,
            category: 'Primary',
            content: `From: ${e.from}\nSubject: ${e.subject}\nBody: ${e.content.slice(0, 1000)}`
        }));

        // 3. Generate Summary with AI (with fallback)
        let summaryText = "";
        let summaryJsonStr: string | null = null;

        try {
            const model = await resolveUserModel(userId);
            summaryJsonStr = await summarizeEmailBatch(emailInputs, model);
        } catch (aiError: any) {
            logger.error(`[MorningBriefing] AI summarization failed:`, aiError.message);
        }

        // 4. Format Content
        const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        if (summaryJsonStr) {
            try {
                const digest = JSON.parse(summaryJsonStr);
                summaryText = `📬 **Morning Briefing** - ${date}\n`;
                summaryText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                if (digest.sections && Array.isArray(digest.sections)) {
                    let emailNum = 1;
                    digest.sections.forEach((section: any) => {
                        if (section.items && Array.isArray(section.items)) {
                            section.items.forEach((item: any) => {
                                summaryText += `**${emailNum}. ${item.email_title || 'Email'}**\n`;
                                summaryText += `   📤 From: ${item.sender || 'Unknown'}\n`;

                                const intentEmoji = item.intent === 'Urgent' ? '🔴' : item.intent === 'Request' ? '📝' : item.intent === 'Meeting' ? '📅' : 'ℹ️';
                                const sentimentEmoji = item.sentiment === 'Positive' ? '😊' : item.sentiment === 'Negative' ? '😟' : item.sentiment === 'Urgent' ? '⚠️' : '😐';
                                summaryText += `   ${intentEmoji} ${item.intent || 'Informational'} • ${sentimentEmoji} ${item.sentiment || 'Neutral'}\n\n`;

                                summaryText += `   **Summary:**\n`;
                                summaryText += `   ${item.summary || 'No summary available.'}\n\n`;

                                if (item.action_items && item.action_items.length > 0) {
                                    summaryText += `   **Action Items:**\n`;
                                    item.action_items.forEach((action: string) => summaryText += `   • ${action}\n`);
                                    summaryText += `\n`;
                                }

                                if (item.important_details && item.important_details.length > 0) {
                                    summaryText += `   **Key Details:**\n`;
                                    item.important_details.forEach((detail: string) => summaryText += `   • ${detail}\n`);
                                    summaryText += `\n`;
                                }

                                summaryText += `───────────────────────────────\n\n`;
                                emailNum++;
                            });
                        }
                    });
                }
            } catch (pError) {
                logger.error("Parse error, using basic fallback");
                summaryText = `📬 **Morning Briefing** - ${date}\n\n`;
                summaryText += emails.map((e, i) => `${i + 1}. **${e.subject}**\n   From: ${e.from}\n`).join('\n');
            }
        } else {
            // AI Failed completely
            summaryText = `📬 **Morning Briefing** - ${date} (AI Offline)\n\n`;
            summaryText += emails.map((e, i) => `${i + 1}. **${e.subject}**\n   From: ${e.from}\n`).join('\n');
        }

        // 5. Store result
        await prisma.usageLog.create({
            data: {
                userId,
                action: 'digest',
                metadata: { summary: summaryText, emailCount: emails.length },
                success: true
            }
        });

        logger.info(`[MorningBriefing] Successfully created and stored digest for user ${userId}`);

    } catch (error) {
        logger.error(`[MorningBriefing] Critical failure for user ${userId}:`, error);
        try {
            await prisma.usageLog.create({
                data: {
                    userId,
                    action: 'digest',
                    metadata: { error: (error as any).message },
                    success: false
                }
            });
        } catch (dbError) {
            logger.error("[MorningBriefing] Failed to log failure to DB", dbError);
        }
    }
}

async function handleCheckReply(userId: number, config: any) {
    // Placeholder for check-reply logic
    // specific threadId check, etc.
    logger.info(`[CheckReply] Checking reply for user ${userId} with config`, config);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const scheduleTask = async (
    userId: number,
    type: string,
    frequency: string, // "daily", "once"
    time: string,      // "08:00" (HH:mm) or ISO for once
    config: any = {}
) => {
    // 1. Save to DB
    const task = await prisma.scheduledTask.create({
        data: {
            userId,
            type,
            frequency,
            time,
            config,
            status: 'active',
        },
    });

    // 2. Schedule in BullMQ
    // Calculate delay or cron pattern
    // Simple version: If "daily", use repeatable job. If "once", use delay.

    const jobId = `task-${task.id}`;
    const jobOptions: any = { jobId };

    if (frequency === 'daily') {
        // "08:00" -> cron "0 8 * * *"
        const [hour, minute] = time.split(':').map(Number);
        jobOptions.repeat = {
            cron: `${minute} ${hour} * * *`
        };
    } else if (frequency === 'once') {
        // Calculate delay
        const targetDate = new Date(time);
        const delay = targetDate.getTime() - Date.now();
        if (delay > 0) jobOptions.delay = delay;
    }

    // Pass frequency in job data so worker knows if it's 'once'
    if (taskQueue) {
        try {
            await taskQueue.add(type, { taskId: task.id, userId, type, config, frequency }, jobOptions);
            logger.info(`[Scheduler] Scheduled task ${task.id} (${type})`);
        } catch (error) {
            logger.error(`[Scheduler] Failed to add task ${task.id} to queue (Redis likely down):`, error);
        }
    } else {
        logger.warn(`[Scheduler] Queue not available. Task ${task.id} saved to DB but NOT scheduled.`);
    }

    return task;
};


export const deleteTask = async (taskId: number) => {
    // 1. First fetch task to know its type/frequency for queue cleanup
    let taskInfo: { type: string; frequency: string; time: string } | null = null;
    try {
        const task = await prisma.scheduledTask.findUnique({ where: { id: taskId } });
        if (task) {
            taskInfo = { type: task.type, frequency: task.frequency, time: task.time };
        }
    } catch (e) {
        logger.warn('[Scheduler] Could not fetch task info before deletion');
    }

    // 2. Remove from DB
    try {
        await prisma.scheduledTask.delete({ where: { id: taskId } });
        logger.info(`[Scheduler] Task ${taskId} deleted from DB`);
    } catch (error: any) {
        if (error.code === 'P2025') {
            logger.warn(`[Scheduler] Task ${taskId} already deleted from DB`);
        } else {
            throw error;
        }
    }

    // 3. Remove from Queue (best effort, don't fail if queue removal fails)
    if (taskQueue) {
        try {
            if (taskInfo && taskInfo.frequency === 'daily') {
                // For repeatable jobs, we need to remove by the repeat key
                const [hour, minute] = taskInfo.time.split(':').map(Number);
                const cronPattern = `${minute} ${hour} * * *`;

                // Remove repeatable by key - BullMQ requires jobId and repeat options
                await taskQueue.removeRepeatableByKey(`${taskInfo.type}:task-${taskId}:::${cronPattern}`);
                logger.info(`[Scheduler] Removed repeatable job for task ${taskId}`);
            } else {
                // For one-time delayed jobs
                const jobs = await taskQueue.getJobs(['delayed', 'waiting']);
                const job = jobs.find(j => j.data.taskId === taskId);
                if (job) {
                    await job.remove();
                    logger.info(`[Scheduler] Removed delayed job for task ${taskId}`);
                }
            }
        } catch (queueError: any) {
            // Log but don't throw - DB deletion is the critical part
            logger.warn(`[Scheduler] Queue cleanup warning for task ${taskId}:`, queueError.message);
        }
    }
};

export const listTasks = async (userId: number) => {
    return prisma.scheduledTask.findMany({
        where: { userId }
    });
};
