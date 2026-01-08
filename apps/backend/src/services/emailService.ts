import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleApiService.js';

// -----------------------------------------------------
// ⭐ NEW EmailData interface with full metadata
// -----------------------------------------------------
export interface EmailData {
  id: string;
  content: string;
  subject: string;
  from: string;
  to: string;
  messageId: string;
  timestamp: string; // ISO formatted
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

  // 3. Retrieve message list
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: count,
    q: "category:primary",
  });

  const messages = listResponse.data.messages;
  if (!messages) return [];

  // 4. Fetch full email bodies
  const emailResponses = await Promise.all(
    messages.map((msg) =>
      gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      })
    )
  );

  // -----------------------------------------------------
  // ⭐ Parse each email into clean EmailData object
  // -----------------------------------------------------
  return emailResponses.map((res) => {
    const payload = res.data.payload;
    const headers = payload?.headers || [];

    // Extract plain text body
    let bodyData = "";

    if (payload?.parts) {
      bodyData = findPlainText(payload.parts) || "";
    } else if (payload?.body?.data) {
      bodyData = payload.body.data;
    }

    // Decode Base64 content → UTF-8
    const content = bodyData
      ? Buffer.from(bodyData, "base64").toString("utf-8")
      : res.data.snippet || "";

    // Parse timestamp
    const timestamp = res.data.internalDate
      ? new Date(Number(res.data.internalDate)).toISOString()
      : new Date().toISOString();

    // Return complete metadata object
    return {
      id: res.data.id!,
      content: content,

      // ⭐ Email metadata (required for Pinecone upsert)
      subject: getHeader(headers, "Subject"),
      from: getHeader(headers, "From"),
      to: getHeader(headers, "To"),
      messageId: getHeader(headers, "Message-ID"),
      timestamp: timestamp,
    };
  });
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

    const content = bodyData
      ? Buffer.from(bodyData, "base64").toString("utf-8")
      : response.data.snippet || "";

    const timestamp = response.data.internalDate
      ? new Date(Number(response.data.internalDate)).toISOString()
      : new Date().toISOString();

    return {
      id: response.data.id!,
      content: content,
      subject: getHeader(headers, "Subject"),
      from: getHeader(headers, "From"),
      to: getHeader(headers, "To"),
      messageId: getHeader(headers, "Message-ID"),
      timestamp: timestamp,
    };
  } catch (error) {
    console.error(`Failed to fetch specific email ${emailId}:`, error);
    return null;
  }
};

