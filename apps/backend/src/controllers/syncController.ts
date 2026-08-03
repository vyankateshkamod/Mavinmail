import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import prisma from '../utils/prisma.js';
import {
  getLatestMessageIdsWithDate,
  getEmailById,
  getNewMessageIdsSinceHistory,
  getCurrentHistoryId,
} from '../services/emailService.js';
import { upsertEmailChunks } from '../services/pineconeService.js';
import logger from '../utils/logger.js';

// In-flight guard: prevent concurrent syncs for the same user
const syncInFlight = new Map<number, boolean>();

// ============================================================================
// Helper: Deduplicate message IDs against SyncedEmail table
// ============================================================================
async function filterAlreadySyncedIds(
  userId: number,
  messageIds: string[]
): Promise<string[]> {
  if (messageIds.length === 0) return [];

  const alreadySynced = await prisma.syncedEmail.findMany({
    where: {
      userId,
      gmailMessageId: { in: messageIds },
    },
    select: { gmailMessageId: true },
  });

  const syncedSet = new Set(alreadySynced.map((s) => s.gmailMessageId));
  const newIds = messageIds.filter((id) => !syncedSet.has(id));

  logger.info(
    `[Sync Dedup] ${messageIds.length} total → ${syncedSet.size} already synced → ${newIds.length} new to process`
  );

  return newIds;
}

// ============================================================================
// Helper: Process a single email (fetch, embed, record)
// ============================================================================
async function processAndEmbedEmail(
  userId: number,
  userNamespace: string,
  msgId: string
): Promise<boolean> {
  try {
    const email = await getEmailById(userId, msgId);

    if (!email) {
      logger.warn(`[Sync] Skipped email ${msgId} (returned null/too large)`);
      return false;
    }

    // Upsert vectors to Pinecone
    await upsertEmailChunks(email.cleanedContent, email.id, userNamespace, {
      messageId: email.messageId,
      threadId: email.threadId,
      subject: email.subject,
      from: email.from,
      to: email.to,
      timestamp: email.timestamp,
      fromDomain: email.fromDomain,
      date: email.date,
      month: email.month,
      emailType: email.emailType,
      vendor: email.vendor,
      isInvoice: email.isInvoice,
      isUnread: email.isUnread,
      currency: email.currency,
      amount: email.amount,
    });

    // Record in SyncedEmail table (dedup tracking)
    // Use upsert to handle race conditions gracefully
    await prisma.syncedEmail.upsert({
      where: {
        userId_gmailMessageId: { userId, gmailMessageId: msgId },
      },
      create: {
        userId,
        gmailMessageId: msgId,
        threadId: email.threadId,
        subject: email.subject?.substring(0, 200), // Truncate long subjects
      },
      update: {}, // No-op if already exists
    });

    return true;
  } catch (innerError) {
    logger.error(`[Sync] Error processing email ${msgId}:`, innerError);
    return false;
  }
}

// ============================================================================
// 1. SYNC EMAILS — Enhanced with dedup, count, and date params
// POST /api/sync/emails
// Body: { count?: number, afterDate?: string }
// ============================================================================
export const syncEmails = async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  if (!authenticatedReq.user?.userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID missing from token.' });
  }

  const userId = authenticatedReq.user.userId;

  // Prevent concurrent syncs
  if (syncInFlight.get(userId)) {
    return res.status(429).json({
      message: 'A sync is already in progress. Please wait for it to complete.',
    });
  }
  syncInFlight.set(userId, true);

  try {
    // Validate connected account
    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: { userId: Number(userId), provider: 'google' },
    });

    if (!connectedAccount?.refreshToken) {
      syncInFlight.delete(userId);
      return res.status(401).json({ message: 'Google account refresh token not found.' });
    }

    // Parse params from body (with safe defaults)
    const count = Math.min(Math.max(Number(req.body.count) || 20, 1), 500);
    const afterDate = req.body.afterDate as string | undefined;

    logger.info(`[Sync] Starting sync for user ${userId}: count=${count}, afterDate=${afterDate || 'none'}`);

    // 1. Get message IDs from Gmail (lightweight)
    const messageIds = await getLatestMessageIdsWithDate(Number(userId), count, afterDate);

    if (messageIds.length === 0) {
      syncInFlight.delete(userId);
      return res.json({
        message: 'No emails found to sync.',
        synced: 0,
        skipped: 0,
        total: 0,
      });
    }

    // 2. Deduplicate against SyncedEmail table
    const newMessageIds = await filterAlreadySyncedIds(Number(userId), messageIds);

    if (newMessageIds.length === 0) {
      syncInFlight.delete(userId);
      return res.json({
        message: 'All emails are already synced.',
        synced: 0,
        skipped: messageIds.length,
        total: messageIds.length,
      });
    }

    // 3. Process only new emails sequentially (OOM-safe)
    const userNamespace = String(userId);
    let successCount = 0;

    for (const msgId of newMessageIds) {
      const success = await processAndEmbedEmail(Number(userId), userNamespace, msgId);
      if (success) successCount++;
    }

    // 4. Update sync state on ConnectedAccount
    const currentHistoryId = await getCurrentHistoryId(Number(userId));

    await prisma.connectedAccount.update({
      where: { userId_provider: { userId: Number(userId), provider: 'google' } },
      data: {
        initialSyncDone: true,
        lastSyncAt: new Date(),
        totalEmailsSynced: { increment: successCount },
        ...(currentHistoryId && { lastHistoryId: currentHistoryId }),
      },
    });

    // 5. Record sync history
    await prisma.syncHistory.create({
      data: {
        userId: Number(userId),
        emailCount: successCount,
        status: successCount > 0 ? 'success' : 'partial',
      },
    });

    syncInFlight.delete(userId);

    res.json({
      message: `Successfully synced and embedded ${successCount} new emails.`,
      synced: successCount,
      skipped: messageIds.length - newMessageIds.length,
      total: messageIds.length,
    });
  } catch (error) {
    syncInFlight.delete(userId);
    logger.error('Sync error:', error);
    res.status(500).json({ message: 'Failed to sync emails.' });
  }
};

// ============================================================================
// 2. SYNC NEW EMAILS — Incremental sync using Gmail historyId
// POST /api/sync/new-emails
// ============================================================================
export const syncNewEmails = async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  if (!authenticatedReq.user?.userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID missing from token.' });
  }

  const userId = authenticatedReq.user.userId;

  // Prevent concurrent syncs
  if (syncInFlight.get(userId)) {
    return res.status(429).json({ message: 'Sync already in progress.' });
  }
  syncInFlight.set(userId, true);

  try {
    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: { userId: Number(userId), provider: 'google' },
    });

    if (!connectedAccount?.refreshToken) {
      syncInFlight.delete(userId);
      return res.status(401).json({ message: 'Google account not connected.' });
    }

    let messageIds: string[] = [];
    let newHistoryId: string | null = null;

    if (connectedAccount.lastHistoryId) {
      // Use history.list for efficient incremental detection
      const historyResult = await getNewMessageIdsSinceHistory(
        Number(userId),
        connectedAccount.lastHistoryId
      );

      messageIds = historyResult.messageIds;
      newHistoryId = historyResult.newHistoryId;

      // If historyId was too old (returned null), fall back to latest 5
      if (!newHistoryId && messageIds.length === 0) {
        logger.info(`[Sync] historyId expired for user ${userId}, falling back to latest 5`);
        const { getLatestMessageIds } = await import('../services/emailService.js');
        messageIds = await getLatestMessageIds(Number(userId), 5);
        newHistoryId = await getCurrentHistoryId(Number(userId));
      }
    } else {
      // No historyId yet — just get latest 5 and seed historyId
      logger.info(`[Sync] No historyId for user ${userId}, fetching latest 5`);
      const { getLatestMessageIds } = await import('../services/emailService.js');
      messageIds = await getLatestMessageIds(Number(userId), 5);
      newHistoryId = await getCurrentHistoryId(Number(userId));
    }

    if (messageIds.length === 0) {
      // Update historyId even if no new messages
      if (newHistoryId) {
        await prisma.connectedAccount.update({
          where: { userId_provider: { userId: Number(userId), provider: 'google' } },
          data: { lastHistoryId: newHistoryId },
        });
      }

      syncInFlight.delete(userId);
      return res.json({ message: 'No new emails.', synced: 0, skipped: 0 });
    }

    // Deduplicate
    const newMessageIds = await filterAlreadySyncedIds(Number(userId), messageIds);

    if (newMessageIds.length === 0) {
      // Update historyId even when all are duplicates
      if (newHistoryId) {
        await prisma.connectedAccount.update({
          where: { userId_provider: { userId: Number(userId), provider: 'google' } },
          data: { lastHistoryId: newHistoryId },
        });
      }

      syncInFlight.delete(userId);
      return res.json({
        message: 'All new emails already synced.',
        synced: 0,
        skipped: messageIds.length,
      });
    }

    // Process new emails
    const userNamespace = String(userId);
    let successCount = 0;

    for (const msgId of newMessageIds) {
      const success = await processAndEmbedEmail(Number(userId), userNamespace, msgId);
      if (success) successCount++;
    }

    // Update sync state
    await prisma.connectedAccount.update({
      where: { userId_provider: { userId: Number(userId), provider: 'google' } },
      data: {
        lastSyncAt: new Date(),
        totalEmailsSynced: { increment: successCount },
        ...(newHistoryId && { lastHistoryId: newHistoryId }),
      },
    });

    syncInFlight.delete(userId);

    logger.info(`[Sync] Incremental sync completed for user ${userId}: ${successCount} new emails embedded`);

    res.json({
      message: `Synced ${successCount} new emails.`,
      synced: successCount,
      skipped: messageIds.length - newMessageIds.length,
    });
  } catch (error) {
    syncInFlight.delete(userId);
    logger.error('Incremental sync error:', error);
    res.status(500).json({ message: 'Failed to sync new emails.' });
  }
};

// ============================================================================
// 3. GET SYNC STATUS
// GET /api/sync/status
// ============================================================================
export const getSyncStatus = async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;

  if (!authenticatedReq.user?.userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = Number(authenticatedReq.user.userId);

  try {
    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: { userId, provider: 'google' },
      select: {
        initialSyncDone: true,
        lastSyncAt: true,
        totalEmailsSynced: true,
        lastHistoryId: true,
      },
    });

    if (!connectedAccount) {
      return res.json({
        isConnected: false,
        initialSyncDone: false,
        lastSyncAt: null,
        totalEmailsSynced: 0,
      });
    }

    // Also get count from SyncedEmail for accuracy
    const syncedCount = await prisma.syncedEmail.count({ where: { userId } });

    res.json({
      isConnected: true,
      initialSyncDone: connectedAccount.initialSyncDone,
      lastSyncAt: connectedAccount.lastSyncAt,
      totalEmailsSynced: syncedCount, // Use actual count from dedup table
      hasHistoryId: !!connectedAccount.lastHistoryId,
    });
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    res.status(500).json({ message: 'Failed to get sync status.' });
  }
};