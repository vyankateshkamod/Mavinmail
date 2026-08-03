import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleApiService.js';
import { extractFullMetadata, EmailType } from './metadataExtractorService.js';
import { cleanEmailContent } from './textCleanerService.js';
import logger from '../utils/logger.js';

// -----------------------------------------------------
// ⭐ Extended EmailData interface with full metadata for RAG
// -----------------------------------------------------
export interface EmailData {
  // Core identifiers
  id: string;
  messageId: string;
  threadId: string;

  // Content
  content: string;        // Original content
  cleanedContent: string; // Cleaned content for embedding

  // Basic metadata
  subject: string;
  from: string;
  to: string;
  timestamp: string;      // ISO formatted

  // Extended metadata for structured queries
  fromDomain: string;
  date: string;           // YYYY-MM-DD format
  month: string;          // YYYY-MM format
  emailType: EmailType;
  vendor: string | null;
  isInvoice: boolean;
  isUnread: boolean;
  currency: string | null;
  amount: number | null;
}

// -----------------------------------------------------
// Helper: Extract a header from Gmail API header array
// -----------------------------------------------------
const getHeader = (headers: any[], name: string): string => {
  return (
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value || ""
  );
};

// -----------------------------------------------------
// Helper: Recursively find the text/plain body part
// -----------------------------------------------------
const findPlainText = (parts: any[]): string | undefined => {
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return part.body.data;
    }
    if (part.parts) {
      // Limit recursion depth implicitly by V8 stack, but typical email depth is shallow.
      // Prioritize depth-first to find content quickly.
      const nested = findPlainText(part.parts);
      if (nested) return nested;
    }
  }
};

// -----------------------------------------------------
// ⭐ MAIN FUNCTION: Fetch latest emails with all metadata
// -----------------------------------------------------
export const getLatestEmails = async (
  userId: number,
  count: number
): Promise<EmailData[]> => {
  // 1. Get auto-refreshing client from your central service
  const auth = await getAuthenticatedClient(userId);

  // 2. Initialize Gmail API
  const gmail = google.gmail({ version: "v1", auth });

  logger.info("DEBUG: Fetching latest emails...");

  try {
    // 3. Retrieve message list
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: count,
      q: "category:primary",
    });

    const messages = listResponse.data.messages;
    if (!messages) return [];

    // 4. Fetch full email bodies SEQUENTIALLY to save memory
    // (Promise.all with huge emails causes OOM)
    const processedEmails: EmailData[] = [];

    for (const msg of messages) {
      try {
        // 🛑 STEP 1: SAFETY CHECK (Metadata Fetch)
        // Fetch headers and size estimate. 'metadata' format guarantees sizeEstimate is present.
        const metaRes = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "metadata",
        });

        const sizeEstimate = metaRes.data.sizeEstimate;
        // If size is undefined, assume it's risky and cap at standard max
        const safeSize = sizeEstimate ?? 99999999;

        const MAX_SAFE_SIZE = 5 * 1024 * 1024; // 5MB Limit

        logger.info(`[EmailService] Checking email ${msg.id}: Estimate=${sizeEstimate} bytes`);

        if (safeSize > MAX_SAFE_SIZE) {
          logger.warn(`[EmailService] ⚠️ Skipping massive email ${msg.id} (Size: ${(safeSize / 1024 / 1024).toFixed(2)}MB). Limit is 5MB.`);
          // Create a placeholder so the user knows something was skipped
          processedEmails.push({
            id: msg.id!,
            messageId: `skipped-${msg.id}`,
            threadId: metaRes.data.threadId || msg.id!,
            content: "[CONTENT TOO LARGE - SKIPPED FOR PERFORMANCE]",
            cleanedContent: "Content too large to analyze.",
            subject: "(Skipped - Email Too Large)",
            from: "System",
            to: "me",
            timestamp: new Date().toISOString(),
            fromDomain: "system",
            date: new Date().toISOString().split('T')[0],
            month: new Date().toISOString().slice(0, 7),
            emailType: 'personal', // Default
            vendor: null,
            isInvoice: false,
            isUnread: false,
            currency: null,
            amount: null,
          });
          continue;
        }

        // 🛑 STEP 2: FULL DATA FETCH (Only if safe)
        const res = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });

        const payload = res.data.payload;
        const headers = payload?.headers || [];

        // Extract plain text body
        let bodyData = "";

        if (payload?.parts) {
          bodyData = findPlainText(payload.parts) || "";
        } else if (payload?.body?.data) {
          bodyData = payload.body.data;
        }

        // 🛑 OPTIMIZATION 1: Check Raw Base64 Length
        // 100KB text ~= 135KB Base64. Cap at 200KB safe limit.
        const MAX_BASE64_LENGTH = 200000;
        if (bodyData && bodyData.length > MAX_BASE64_LENGTH) {
          logger.warn(`[EmailService] Truncating massive Base64 body for ${msg.id} (${bodyData.length} chars)`);
          bodyData = bodyData.substring(0, MAX_BASE64_LENGTH);
        }

        // Decode Base64 content → UTF-8
        let content = bodyData
          ? Buffer.from(bodyData, "base64").toString("utf-8")
          : res.data.snippet || "";

        // 🛑 OPTIMIZATION 2: Secondary Content Check
        const MAX_CONTENT_LENGTH = 100000;
        if (content.length > MAX_CONTENT_LENGTH) {
          content = content.substring(0, MAX_CONTENT_LENGTH);
        }

        // Parse timestamp
        const timestamp = res.data.internalDate
          ? new Date(Number(res.data.internalDate)).toISOString()
          : new Date().toISOString();

        // Extract basic fields
        const subject = getHeader(headers, "Subject");
        const from = getHeader(headers, "From");
        const to = getHeader(headers, "To");
        const messageId = getHeader(headers, "Message-ID");
        const threadId = res.data.threadId || res.data.id!;
        const isUnread = res.data.labelIds?.includes('UNREAD') || false;

        // Clean content
        // Now safe to clean because content is strictly limited
        const cleanedContent = cleanEmailContent(content);

        // Extract extended metadata
        const extendedMeta = extractFullMetadata(from, subject, content, timestamp);

        processedEmails.push({
          id: res.data.id!,
          messageId,
          threadId,
          content,
          cleanedContent,
          subject,
          from,
          to,
          timestamp,
          fromDomain: extendedMeta.fromDomain,
          date: extendedMeta.date,
          month: extendedMeta.month,
          emailType: extendedMeta.emailType,
          vendor: extendedMeta.vendor,
          isInvoice: extendedMeta.isInvoice,
          isUnread,
          currency: extendedMeta.currency,
          amount: extendedMeta.amount,
        });

      } catch (innerError) {
        logger.warn(`[EmailService] Failed to fetch/parse email ${msg.id}, skipping.`, innerError);
        // Continue to next email, do not crash
      }
    }

    return processedEmails;

  } catch (error) {
    logger.error("Error fetching latest emails:", error);
    return [];
  }
};

// -----------------------------------------------------
// ⭐ NEW: Fetch only Message IDs (Lightweight)
// -----------------------------------------------------
export const getLatestMessageIds = async (
  userId: number,
  count: number
): Promise<string[]> => {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: count,
      q: "category:primary",
    });

    return listResponse.data.messages?.map(m => m.id!).filter(Boolean) || [];
  } catch (error) {
    logger.error("Error fetching message IDs:", error);
    return [];
  }
};

// -----------------------------------------------------
// ⭐ NEW: Fetch Message IDs with optional date filter
// Used for on-demand sync with date range support
// -----------------------------------------------------
export const getLatestMessageIdsWithDate = async (
  userId: number,
  count: number,
  afterDate?: string // YYYY-MM-DD format
): Promise<string[]> => {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  try {
    let query = "category:primary";
    
    if (afterDate) {
      // Gmail uses epoch seconds for after: filter
      const dateObj = new Date(afterDate);
      if (!isNaN(dateObj.getTime())) {
        const epochSeconds = Math.floor(dateObj.getTime() / 1000);
        query += ` after:${epochSeconds}`;
      }
    }

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: count,
      q: query,
    });

    return listResponse.data.messages?.map(m => m.id!).filter(Boolean) || [];
  } catch (error) {
    logger.error("Error fetching message IDs with date filter:", error);
    return [];
  }
};

// -----------------------------------------------------
// ⭐ NEW: Get new message IDs since a Gmail historyId
// Uses Gmail history.list API for efficient incremental sync
// Returns { messageIds, newHistoryId }
// -----------------------------------------------------
export interface HistorySyncResult {
  messageIds: string[];
  newHistoryId: string | null;
}

export const getNewMessageIdsSinceHistory = async (
  userId: number,
  historyId: string
): Promise<HistorySyncResult> => {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
    });

    const messageIds = new Set<string>();

    // Extract unique message IDs from history records
    if (historyResponse.data.history) {
      for (const record of historyResponse.data.history) {
        if (record.messagesAdded) {
          for (const msg of record.messagesAdded) {
            if (msg.message?.id) {
              messageIds.add(msg.message.id);
            }
          }
        }
      }
    }

    const newHistoryId = historyResponse.data.historyId || null;

    logger.info(`[EmailService] History sync found ${messageIds.size} new messages since historyId ${historyId}`);

    return {
      messageIds: Array.from(messageIds),
      newHistoryId,
    };
  } catch (error: any) {
    // historyId too old or invalid — Gmail returns 404
    if (error?.code === 404 || error?.response?.status === 404) {
      logger.warn(`[EmailService] historyId ${historyId} is too old or invalid. Full re-sync needed.`);
      return { messageIds: [], newHistoryId: null };
    }
    logger.error("Error fetching history:", error);
    return { messageIds: [], newHistoryId: null };
  }
};

// -----------------------------------------------------
// ⭐ NEW: Get current Gmail profile historyId
// Used to seed the initial historyId after first sync
// -----------------------------------------------------
export const getCurrentHistoryId = async (
  userId: number
): Promise<string | null> => {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const profile = await gmail.users.getProfile({ userId: "me" });
    return profile.data.historyId || null;
  } catch (error) {
    logger.error("Error fetching Gmail profile historyId:", error);
    return null;
  }
};

// -----------------------------------------------------
// ⭐ Fetch a single email by ID (On-Demand Retrieval)
// -----------------------------------------------------
export const getEmailById = async (
  userId: number,
  emailId: string
): Promise<EmailData | null> => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: "v1", auth });

    // 🛑 STEP 1: SAFETY CHECK (Metadata Fetch)
    // Fetch headers and size estimate.
    const metaRes = await gmail.users.messages.get({
      userId: "me",
      id: emailId,
      format: "metadata",
    });

    const sizeEstimate = metaRes.data.sizeEstimate;
    // If size is undefined, assume it's risky and cap at standard max
    const safeSize = sizeEstimate ?? 99999999;

    const MAX_SAFE_SIZE = 5 * 1024 * 1024; // 5MB Limit

    logger.info(`[EmailService] Checking email ${emailId}: Estimate=${sizeEstimate} bytes`);

    if (safeSize > MAX_SAFE_SIZE) {
      logger.warn(`[EmailService] ⚠️ Skipping massive email ${emailId} (Size: ${(safeSize / 1024 / 1024).toFixed(2)}MB). Limit is 5MB.`);
      return null;
    }

    // 🛑 STEP 2: FULL DATA FETCH (Safe now)
    const response = await gmail.users.messages.get({
      userId: "me",
      id: emailId,
      format: "full",
    });

    const payload = response.data.payload;
    const headers = payload?.headers || [];

    let bodyData = "";
    if (payload?.parts) {
      bodyData = findPlainText(payload.parts) || "";
    } else if (payload?.body?.data) {
      bodyData = payload.body.data;
    }

    // 🛑 OPTIMIZATION 1: Check Raw Base64 Length
    const MAX_BASE64_LENGTH = 200000;
    if (bodyData && bodyData.length > MAX_BASE64_LENGTH) {
      logger.warn(`[EmailService] Truncating massive Base64 body for ${emailId} (${bodyData.length} chars)`);
      bodyData = bodyData.substring(0, MAX_BASE64_LENGTH);
    }

    const content = bodyData
      ? Buffer.from(bodyData, "base64").toString("utf-8")
      : response.data.snippet || "";

    // 🛑 OPTIMIZATION 2: Secondary Content Check
    const MAX_CONTENT_LENGTH = 100000;
    const truncatedContent = content.length > MAX_CONTENT_LENGTH
      ? content.substring(0, MAX_CONTENT_LENGTH)
      : content;

    const timestamp = response.data.internalDate
      ? new Date(Number(response.data.internalDate)).toISOString()
      : new Date().toISOString();

    // Extract basic fields
    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const to = getHeader(headers, "To");
    const messageId = getHeader(headers, "Message-ID");
    const threadId = response.data.threadId || response.data.id!;
    const isUnread = response.data.labelIds?.includes('UNREAD') || false;

    // Clean content for embedding
    const cleanedContent = cleanEmailContent(truncatedContent);

    // Extract extended metadata
    const extendedMeta = extractFullMetadata(from, subject, truncatedContent, timestamp);

    return {
      id: response.data.id!,
      messageId,
      threadId,
      content: truncatedContent,
      cleanedContent,
      subject,
      from,
      to,
      timestamp,
      fromDomain: extendedMeta.fromDomain,
      date: extendedMeta.date,
      month: extendedMeta.month,
      emailType: extendedMeta.emailType,
      vendor: extendedMeta.vendor,
      isInvoice: extendedMeta.isInvoice,
      isUnread,
      currency: extendedMeta.currency,
      amount: extendedMeta.amount,
    };
  } catch (error) {
    logger.error(`Failed to fetch specific email ${emailId}:`, error);
    return null;
  }
};

