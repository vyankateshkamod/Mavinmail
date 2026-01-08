import { OpenRouterService } from "./openrouterService.js";

/**
 * Generates an AI-grounded answer using the given context.
 * Ensures Gemini (via OpenRouter) only uses provided context — no hallucination.
 * @param question The user's question.
 * @param context The relevant email chunks.
 * @param model Optional model ID.
 */
export const generateAnswerFromContext = async (question: string, context: string, model?: string): Promise<string> => {
  try {
    const prompt = `
You are an intelligent email assistant designed to help users find information in their emails.
Use ONLY the information provided in the context below to answer the question.
If you cannot find an answer, respond exactly with: "I couldn't find relevant information in your emails."

IMPORTANT FORMATTING RULES:
1. Structure your response with clear sections using these headers:
   📌 **Summary** - A brief 2-4 sentence answer
   📧 **Source Email(s)** - Which email(s) contained this information (include sender and subject)
   📋 **Key Details** - Important specifics like dates, amounts, names, etc.
   ⚡ **Action Items** - Any tasks or follow-ups mentioned (or "None" if not applicable)

2. Use bullet points (•) for lists
3. Bold important keywords and values using **text**
4. Keep the response concise but comprehensive
5. If multiple emails are relevant, summarize each briefly

Context (Email Data):
${context}

User Question: ${question}

Provide a well-formatted, professional response:
`;

    return await OpenRouterService.generateContent(prompt, model);
  } catch (error) {
    console.error('Error in generateAnswerFromContext:', error);
    throw new Error('Failed to generate answer from AI service.');
  }
};
