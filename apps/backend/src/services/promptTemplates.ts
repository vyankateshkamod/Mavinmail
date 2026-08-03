/**
 * Centralized AI Prompt Templates.
 *
 * All LLM prompts live here — controllers call these functions instead of
 * embedding giant template-literal prompts inline. This makes prompts:
 *   1. Testable in isolation
 *   2. Reviewable by non-engineers
 *   3. Easy to A/B test or version
 */

// ─── Email Summarization ─────────────────────────────

export const summarizeEmailPrompt = (text: string): string => `
You are an intelligent email summarization assistant. Your goal is to extract key information and return it in a structured JSON format.

Input Email:
---
${text}
---

Instructions:
1. Analyze the email content.
2. Extract the following fields:
   - "email_title": A short, clear title for the email.
   - "sender": The name or email address of the sender (inferred from context if not explicitly stated, otherwise "Unknown").
   - "summary": A concise 2-3 sentence summary of the main point.
   - "action_items": A list of specific actionable tasks or requests (strings). If none, use an empty list.
   - "important_details": A list of key facts, dates, or deadlines (strings).
   - "intent": One of "Request", "Informational", "Urgent", "Meeting", "Follow-up", "Other".
   - "sentiment": One of "Positive", "Neutral", "Negative", "Urgent".

3. Return ONLY valid JSON matching this structure.
{
  "email_title": "...",
  "sender": "...",
  "summary": "...",
  "action_items": ["...", "..."],
  "important_details": ["...", "..."],
  "intent": "...",
  "sentiment": "..."
}
`;

// ─── Autocomplete ────────────────────────────────────

export const autocompletePrompt = (text: string): string =>
    `You are an AI assistant helping a user write. Your task is to provide a short, single-sentence completion for the text they have started. Do not repeat the user's text in your response. Only provide the new, autocompleted part. Be concise.\n\nUser's text:\n---\n${text}\n---`;

// ─── Text Enhancement ────────────────────────────────

const enhanceInstructions: Record<string, string> = {
    professional: 'Rewrite the following text to be more formal and professional.',
    formal: 'Rewrite the following text to be more formal and professional.',
    casual: 'Rewrite the following text to be more casual and friendly.',
    concise: 'Rewrite the following text to be more concise and to the point.',
    elaborate: 'Expand on the following text, adding more detail and context.',
    clarity: 'Rewrite the following text to improve clarity and flow.',
};

export const enhanceTextPrompt = (text: string, type?: string): string => {
    const instruction = (type && enhanceInstructions[type])
        || 'Improve the writing of the following text.';
    return `${instruction}\n\nText:\n---\n${text}\n---\n\nReturn only the enhanced text, nothing else.`;
};

// ─── Draft Reply ─────────────────────────────────────

export const draftReplyPrompt = (emailContent: string, userPrompt?: string): string => `
You are a professional email assistant.
Context (The email thread):
---
${emailContent}
---

User Instruction:
${userPrompt || "Draft a suitable reply based on the context."}

Draft a professional and polite reply to the above email.
`;
