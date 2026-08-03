import { z } from 'zod';

const actionTypeSchema = z.enum([
    'summarize',
    'draft',
    'enhance',
    'rag_query',
    'digest',
    'thread_summary',
    'autocomplete',
]);

// ─── Auth Schemas ────────────────────────────────────

export const signupSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// ─── AI Schemas ──────────────────────────────────────

export const summarizeSchema = z.object({
    text: z.string().min(1, 'Text is required').max(50000, 'Text too long'),
});

export const autocompleteSchema = z.object({
    text: z.string().min(1, 'Text is required').max(10000, 'Text too long'),
});

export const askQuestionSchema = z.object({
    question: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
    useRag: z.boolean().optional().default(true),
});

export const enhanceTextSchema = z.object({
    text: z.string().min(1, 'Text is required').max(10000, 'Text too long'),
    type: z.enum(['professional', 'casual', 'formal', 'concise', 'elaborate']).optional(),
});

export const draftReplySchema = z.object({
    emailContent: z.string().min(1, 'Email content is required').max(50000, 'Content too long'),
    userPrompt: z.string().max(2000, 'Prompt too long').optional(),
});

// ─── User Schemas ────────────────────────────────────

export const updatePreferencesSchema = z.object({
    preferredModel: z.string().nullable().optional(),
});

export const updateProfileSchema = z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional(),
    currentPassword: z.string().optional(),
});

const strongPasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number');

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
});

// ─── Support Schemas ─────────────────────────────────

export const createTicketSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    source: z.string().max(100).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
});

export const updateTicketSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    adminNotes: z.string().max(5000).optional(),
});

// ─── Admin Schemas ───────────────────────────────────

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional().default('USER'),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
});

export const updateRoleSchema = z.object({
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});

export const banUserSchema = z.object({
    reason: z.string().min(1, 'Ban reason is required').max(500),
});

// ─── Task Schemas ────────────────────────────────────

export const createTaskSchema = z.object({
    type: z.enum(['morning_briefing', 'check_reply']),
    frequency: z.string().min(1),
    time: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});

export const logUsageSchema = z.object({
    action: actionTypeSchema,
    metadata: z.record(z.string(), z.unknown()).optional(),
    success: z.boolean().optional(),
});

// ─── Common Param Schemas ────────────────────────────

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});
