import { OpenRouterService } from "./openrouterService.js";

/**
 * Takes an array of email contents and generates a single, cohesive "Daily Digest".
 * @param emailContents An array of strings, where each string contains an email's details.
 * @param model Optional model ID to use for generation.
 * @returns The generated digest as a single formatted string.
 */
// Define interface for structured email input
interface EmailInput {
  id: string;
  category: string;
  content: string;
}

/**
 * Takes an array of email objects and generates a cohesive "Daily Digest".
 * @param emailData Array of email objects with id, category, and content.
 * @param model Optional model ID to use for generation.
 * @returns The generated digest as a single formatted string.
 */
export const summarizeEmailBatch = async (emailData: EmailInput[], model?: string): Promise<string> => {
  if (!emailData || emailData.length === 0) {
    throw new Error("No emails provided for summarization.");
  }

  console.log(`[AI Service] Processing ${emailData.length} emails in a single batch...`);

  // Format inputs with IDs to enforce 1:1 mapping
  const formattedInput = emailData.map(e =>
    `--- EMAIL START ---\nID: ${e.id}\nCATEGORY: ${e.category}\n${e.content}\n--- EMAIL END ---`
  ).join('\n\n');

  const totalEmails = emailData.length;

  const prompt = `
You must return ONLY valid JSON that matches the schema below. No other text.

{
  "title": "Daily Digest",
  "sections": [
    {
      "title": "Section Title (e.g., 'Primary', 'Social', 'Promotions', 'Updates' or 'Overview')",
      "items": [
        {
          "id": "Exact ID from input",
          "category": "Primary | Social | Promotions | Updates",
          "email_title": "Short Email Title",
          "sender": "Sender Name",
          "summary": "Detailed summary (MINIMUM 3-5 sentences) covering all key points.",
          "action_items": ["Task 1", "Task 2"],
          "important_details": ["Date: ...", "Deadline: ..."],
          "intent": "Request | Informational | Urgent | Meeting | Other",
          "sentiment": "Positive | Neutral | Negative | Urgent"
        }
      ]
    }
  ]
}

EMAILS INPUT:
${formattedInput}

Instructions:
- **STRICT EMAIL COUNT**: There are exactly ${totalEmails} emails in the input. You MUST return exactly ${totalEmails} summary items. Do NOT skip any.
- **ID MATCHING**: The "id" field in your JSON output MUST match the "ID:" provided in the input exactly.
- **CATEGORY**: Use the "CATEGORY:" provided in the input for the "category" field.
- **SENDER**: Extract the sender's real name from the "From:" line. If format is "Name <email>", use "Name".
- **SUMMARY LENGTH**: The summary MUST be at least 3-5 sentences long. Do NOT be brief. Include specific details.
- **Action Items**: Return [] if empty.
  `;

  try {
    console.log(`[AI Service] Sending batch request to OpenRouter (${totalEmails} emails)...`);

    // Use generateJSON from OpenRouterService which handles parsing and cleaning
    const digestJson = await OpenRouterService.generateJSON(prompt, model);

    // Verify count
    let generatedCount = 0;
    if (digestJson.sections && Array.isArray(digestJson.sections)) {
      digestJson.sections.forEach((section: any) => {
        if (Array.isArray(section.items)) {
          generatedCount += section.items.length;
        }
      });
    }

    if (generatedCount !== totalEmails) {
      console.warn(`[AI Service WARNING] Mismatch: Sent ${totalEmails} emails, received ${generatedCount} summaries.`);
    } else {
      console.log(`[AI Service] Successfully verified 1:1 mapping (${generatedCount} items).`);
    }

    return JSON.stringify(digestJson);

  } catch (error: any) {
    console.error("[AI Service] Error generating digest:", error);
    const errorMessage = error?.message || "Failed to generate summary from the AI service.";
    throw new Error(errorMessage);
  }
};