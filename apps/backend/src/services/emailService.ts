import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleApiService.js';
import { extractFullMetadata, EmailType } from './metadataExtractorService.js';
import { cleanEmailContent } from './textCleanerService.js';

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

  console.log("DEBUG: Fetching latest emails...");

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

        console.log(`[EmailService] Checking email ${msg.id}: Estimate=${sizeEstimate} bytes`);

        if (safeSize > MAX_SAFE_SIZE) {
          console.warn(`[EmailService] ⚠️ Skipping massive email ${msg.id} (Size: ${(safeSize / 1024 / 1024).toFixed(2)}MB). Limit is 5MB.`);
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
          console.warn(`[EmailService] Truncating massive Base64 body for ${msg.id} (${bodyData.length} chars)`);
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
        console.warn(`[EmailService] Failed to fetch/parse email ${msg.id}, skipping.`, innerError);
        // Continue to next email, do not crash
      }
    }

    return processedEmails;

  } catch (error) {
    console.error("Error fetching latest emails:", error);
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
    console.error("Error fetching message IDs:", error);
    return [];
  }
};

// -----------------------------------------------------
// ⭐ NEW: Fetch a single email by ID (On-Demand Retrieval)
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

    console.log(`[EmailService] Checking email ${emailId}: Estimate=${sizeEstimate} bytes`);

    if (safeSize > MAX_SAFE_SIZE) {
      console.warn(`[EmailService] ⚠️ Skipping massive email ${emailId} (Size: ${(safeSize / 1024 / 1024).toFixed(2)}MB). Limit is 5MB.`);
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
      console.warn(`[EmailService] Truncating massive Base64 body for ${emailId} (${bodyData.length} chars)`);
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
    console.error(`Failed to fetch specific email ${emailId}:`, error);
    return null;
  }
};

