// aiController.ts – used in F5 feature

import { Request, Response } from 'express';
import { OpenRouterService } from '../services/openrouterService.js';
import { queryRelevantEmailChunks } from '../services/pineconeService.js';
import { getEmailById, EmailData } from '../services/emailService.js';
import { generateAnswerFromContext } from '../services/geminiService.js';
import { PrismaClient } from '@prisma/client';
import { logUsage } from '../services/analyticsService.js';
import { resolveUserModel, getUserIdFromRequest } from '../utils/modelHelper.js';

const prisma = new PrismaClient();

export const summarizeEmail = async (req: Request, res: Response) => {
  const { text } = req.body;
  // @ts-ignore
  const userId = getUserIdFromRequest(req);

  if (!text) {
    return res.status(400).json({ error: 'Email text is required.' });
  }

  try {
    // Resolve model using centralized helper (checks user pref -> DB default -> env)
    const headerOverride = req.headers['x-model-id'] as string | undefined;
    const model = await resolveUserModel(userId, headerOverride);

    console.log('✅ [DEBUG] summarizeEmail - Final Model Used:', model);

    const prompt = `
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

    const summaryData = await OpenRouterService.generateJSON(prompt, model);

    // Log usage for analytics
    if (userId) {
      logUsage({ userId: Number(userId), action: 'summarize', metadata: { model } });
    }

    res.status(200).json({ summary: summaryData });

  } catch (error) {
    console.error('Error summarizing email with AI Service:', error);
    // Log failed attempt
    if (userId) {
      logUsage({ userId: Number(userId), action: 'summarize', success: false });
    }
    res.status(500).json({ error: 'Failed to summarize the email.' });
  }
};


//-------------------------------------------------------------------------

// ai autocomplete 

export const getAutocomplete = async (req: Request, res: Response) => {
  const { text } = req.body;
  // @ts-ignore
  const userId = getUserIdFromRequest(req);

  console.log('✅ 3. aiController: Received request to autocomplete text:', text);

  if (!text || text.length < 10) { // Add a length check on the backend for safety
    return res.status(400).json({ error: 'Text input is too short for autocomplete.' });
  }

  try {
    // Resolve model using centralized helper
    const headerOverride = req.headers['x-model-id'] as string | undefined;
    const model = await resolveUserModel(userId, headerOverride);

    const prompt = `You are an AI assistant helping a user write. Your task is to provide a short, single-sentence completion for the text they have started. Do not repeat the user's text in your response. Only provide the new, autocompleted part. Be concise.\n\nUser's text:\n---\n${text}\n---`;

    const suggestion = await OpenRouterService.generateContent(prompt, model);

    // Log usage for analytics
    if (userId) {
      logUsage({ userId: Number(userId), action: 'autocomplete', metadata: { model } });
    }

    res.status(200).json({ suggestion });
    console.log('✅ 4. aiController: AI API returned raw suggestion:', suggestion);

  } catch (error) {
    console.error('Error getting autocomplete from AI Service:', error);
    res.status(500).json({ error: 'Failed to generate autocomplete suggestion.' });
  }
};


//rag

export const askQuestionAboutEmails = async (req: any, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { question, useRag } = req.body; // Expect useRag boolean
  const userId = getUserIdFromRequest(req);

  // Resolve model using centralized helper
  const headerOverride = req.headers['x-model-id'] as string | undefined;
  const model = await resolveUserModel(userId, headerOverride);

  console.log('✅ [DEBUG] askQuestion Request:', { question, useRag, model });

  if (!question) return res.status(400).json({ message: 'Question is required.' });

  try {
    // ------------------------------------------------------------------
    // MODE 1: GENERAL CHAT (RAG DISABLED)
    // ------------------------------------------------------------------
    if (!useRag) {
      console.log('ℹ️ RAG Disabled. Using General Chat Mode.');
      const prompt = `
You are a helpful AI assistant.
Answer the following question to the best of your ability.

Question: ${question}
`;
      const answer = await OpenRouterService.generateContent(prompt, model);

      // Log usage for analytics (General Chat)
      if (userId) {
        logUsage({ userId: Number(userId), action: 'rag_query', metadata: { query: question, model, useRag: false } });
      }

      return res.json({ answer });
    }

    // ------------------------------------------------------------------
    // MODE 2: RAG ENABLED (Search Inbox)
    // ------------------------------------------------------------------
    console.log('🔍 RAG Enabled. Searching Inbox...');

    // 1️⃣ Retrieve relevant email IDs from Pinecone (Metadata only)
    // Note: queryRelevantEmailChunks now returns objects with { emailId, ... } but NO originalText
    const relevantMatches = await queryRelevantEmailChunks(question, String(userId));

    // Extract unique Email IDs
    const uniqueEmailIds = Array.from(new Set(relevantMatches.map(m => m.metadata?.emailId).filter(Boolean))) as string[];

    console.log(`🔍 Found ${uniqueEmailIds.length} relevant emails in index.`);

    if (uniqueEmailIds.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant emails in your index to answer that question.",
      });
    }

    // 2️⃣ Fetch FULL content from Gmail (Privacy-First: Content is retrieved on-demand)
    // Limit to top 5 to avoid slow fetch/context overflow
    const topEmailIds = uniqueEmailIds.slice(0, 5);
    const emailPromises = topEmailIds.map(id => getEmailById(Number(userId), id));

    // Explicitly type the filter
    const emails = (await Promise.all(emailPromises)).filter((e): e is NonNullable<typeof e> => e !== null);

    // 3️⃣ Build Context
    const context = emails
      .map((e: EmailData) => `
From: ${e.from}
Subject: ${e.subject}
Date: ${e.timestamp}
Content:
${e.content}
--------------------------------------------------
`)
      .join('\n');

    // Safety truncate
    const truncatedContext = context.slice(0, 15000);

    // 4️⃣ Generate grounded answer
    const answer = await generateAnswerFromContext(question, truncatedContext, model);

    // Log usage for analytics
    if (userId) {
      logUsage({ userId: Number(userId), action: 'rag_query', metadata: { query: question, model, useRag: true } });
    }

    res.json({ answer });

  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ message: 'Failed to get an answer.' });
  }
};


export const enhanceText = async (req: Request, res: Response) => {
  const { text, type } = req.body;
  // @ts-ignore
  const userId = getUserIdFromRequest(req);

  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  try {
    // Resolve model using centralized helper
    const headerOverride = req.headers['x-model-id'] as string | undefined;
    const model = await resolveUserModel(userId, headerOverride);

    let instruction = "Improve the writing of the following text.";
    if (type === 'formal') instruction = "Rewrite the following text to be more formal and professional.";
    else if (type === 'concise') instruction = "Rewrite the following text to be more concise and to the point.";
    else if (type === 'casual') instruction = "Rewrite the following text to be more casual and friendly.";
    else if (type === 'clarity') instruction = "Rewrite the following text to improve clarity and flow.";
    else if (type === 'more') instruction = "Expand on the following text, adding more detail and context.";

    const prompt = `${instruction}\n\nText:\n---\n${text}\n---\n\nReturn only the enhanced text, nothing else.`;

    const enhancedText = await OpenRouterService.generateContent(prompt, model);

    // Log usage for analytics
    if (userId) {
      logUsage({ userId: Number(userId), action: 'enhance', metadata: { type, model } });
    }

    res.status(200).json({ enhancedText });
  } catch (error) {
    console.error('Error enhancing text:', error);
    res.status(500).json({ error: 'Failed to enhance text.' });
  }
};

// draft reply
export const draftReply = async (req: Request, res: Response) => {
  const { emailContent, userPrompt } = req.body;
  // @ts-ignore
  const userId = getUserIdFromRequest(req);

  if (!emailContent) {
    return res.status(400).json({ error: 'Email content is required.' });
  }

  try {
    // Resolve model using centralized helper
    const headerOverride = req.headers['x-model-id'] as string | undefined;
    const model = await resolveUserModel(userId, headerOverride);

    const prompt = `
You are a professional email assistant.
Context (The email thread):
---
${emailContent}
---

User Instruction:
${userPrompt || "Draft a suitable reply based on the context."}

Draft a professional and polite reply to the above email.
`;

    const reply = await OpenRouterService.generateContent(prompt, model);

    // Log usage for analytics
    if (userId) {
      logUsage({ userId: Number(userId), action: 'draft', metadata: { model } });
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error in draftReply:', error);
    res.status(500).json({ error: 'Failed to generate draft reply.' });
  }
};
