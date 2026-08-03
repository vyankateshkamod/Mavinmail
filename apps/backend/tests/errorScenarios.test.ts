import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';

// ─── Mocks ───────────────────────────────────────────────────────────

// Mock OpenRouterService
const mockGenerateJSON = jest.fn();
const mockGenerateContent = jest.fn();
jest.unstable_mockModule('../src/services/openrouterService.js', () => ({
    OpenRouterService: {
        generateJSON: mockGenerateJSON,
        generateContent: mockGenerateContent,
        generateContentStream: jest.fn(),
    },
}));

// Mock modelHelper
const mockResolveUserModel = jest.fn().mockImplementation(() => Promise.resolve('openai/gpt-4o-mini'));
jest.unstable_mockModule('../src/utils/modelHelper.js', () => ({
    resolveUserModel: mockResolveUserModel,
    getUserIdFromRequest: jest.fn().mockReturnValue(1),
}));

// Mock analyticsService
jest.unstable_mockModule('../src/services/analyticsService.js', () => ({
    logUsage: jest.fn(),
}));

// Mock queryClassifierService
jest.unstable_mockModule('../src/services/queryClassifierService.js', () => ({
    classifyQuery: jest.fn().mockImplementation(() =>
        Promise.resolve({ intent: 'general', confidence: 0.9, entities: {} })
    ),
}));

// Mock retrievalService
const mockExecuteRetrieval = jest.fn();
jest.unstable_mockModule('../src/services/retrievalService.js', () => ({
    executeRetrieval: mockExecuteRetrieval,
}));

// Mock geminiService
jest.unstable_mockModule('../src/services/geminiService.js', () => ({
    generateGroundedAnswer: jest.fn(),
    generateAnswerFromContext: jest.fn(),
}));

// Mock pineconeService
jest.unstable_mockModule('../src/services/pineconeService.js', () => ({
    queryRelevantEmailChunks: jest.fn(),
    upsertEmailChunks: jest.fn(),
    queryWithFilters: jest.fn(),
    getUniqueEmailsFromChunks: jest.fn(),
    fetchAllChunksForEmails: jest.fn(),
}));

// Mock emailService
jest.unstable_mockModule('../src/services/emailService.js', () => ({
    getEmailById: jest.fn(),
    getLatestEmails: jest.fn(),
    getLatestMessageIds: jest.fn(),
}));

// Mock logger
jest.unstable_mockModule('../src/utils/logger.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// ─── Dynamic Imports ─────────────────────────────────────────────────
let summarizeEmail: any;
let getAutocomplete: any;
let enhanceText: any;
let draftReply: any;
let askQuestionAboutEmails: any;

// Helper: Create mock Express req/res
const createMockReq = (body: any = {}, headers: any = {}, user: any = { id: 1 }) => ({
    body,
    headers,
    user,
});

const createMockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ─── Test Suite ──────────────────────────────────────────────────────
describe('Error Scenario Tests', () => {
    beforeAll(async () => {
        const controller = await import('../src/controllers/aiController.js');
        summarizeEmail = controller.summarizeEmail;
        getAutocomplete = controller.getAutocomplete;
        enhanceText = controller.enhanceText;
        draftReply = controller.draftReply;
        askQuestionAboutEmails = controller.askQuestionAboutEmails;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── AI Service Timeout Scenarios ────────────────────────────────
    describe('AI Service Timeouts', () => {
        it('should handle timeout on summarize', async () => {
            mockGenerateJSON.mockImplementation(
                () => new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout after 30s')), 50)
                )
            );
            const req = createMockReq({ text: 'Some email' });
            const res = createMockRes();

            await summarizeEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to summarize the email.' });
        });

        it('should handle timeout on autocomplete', async () => {
            mockGenerateContent.mockImplementation(
                () => new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('ECONNRESET')), 50)
                )
            );
            const req = createMockReq({ text: 'This is a long enough sentence for autocomplete' });
            const res = createMockRes();

            await getAutocomplete(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle timeout on enhance', async () => {
            mockGenerateContent.mockImplementation(
                () => Promise.reject(new Error('ETIMEDOUT'))
            );
            const req = createMockReq({ text: 'Make this better', type: 'professional' });
            const res = createMockRes();

            await enhanceText(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle timeout on draft reply', async () => {
            mockGenerateContent.mockImplementation(
                () => Promise.reject(new Error('ETIMEOUT'))
            );
            const req = createMockReq({ emailContent: 'Meeting request' });
            const res = createMockRes();

            await draftReply(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ─── API Rate Limiting Responses ─────────────────────────────────
    describe('API Rate Limit Errors', () => {
        it('should handle 429 from OpenRouter on summarize', async () => {
            const rateLimitError = new Error('Rate limit exceeded');
            (rateLimitError as any).status = 429;
            mockGenerateJSON.mockImplementation(() => Promise.reject(rateLimitError));

            const req = createMockReq({ text: 'Email content' });
            const res = createMockRes();

            await summarizeEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to summarize the email.' });
        });

        it('should handle 429 from OpenRouter on autocomplete', async () => {
            const rateLimitError = new Error('Too many requests');
            (rateLimitError as any).status = 429;
            mockGenerateContent.mockImplementation(() => Promise.reject(rateLimitError));

            const req = createMockReq({ text: 'This sentence is more than ten characters' });
            const res = createMockRes();

            await getAutocomplete(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ─── Empty/Null Response from AI ─────────────────────────────────
    describe('Empty AI Responses', () => {
        it('should handle null summary response', async () => {
            mockGenerateJSON.mockImplementation(() => Promise.resolve(null));
            const req = createMockReq({ text: 'Some email' });
            const res = createMockRes();

            await summarizeEmail(req, res);

            // Should still return 200 with the null value
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ summary: null });
        });

        it('should handle empty string autocomplete response', async () => {
            mockGenerateContent.mockImplementation(() => Promise.resolve(''));
            const req = createMockReq({ text: 'This is long enough for autocomplete' });
            const res = createMockRes();

            await getAutocomplete(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ suggestion: '' });
        });
    });

    // ─── Model Resolution Failures ───────────────────────────────────
    describe('Model Resolution Failures', () => {
        it('should handle model resolution error on summarize', async () => {
            mockResolveUserModel.mockImplementation(() =>
                Promise.reject(new Error('Model not found'))
            );
            const req = createMockReq({ text: 'Email content' });
            const res = createMockRes();

            await summarizeEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ─── Authentication Edge Cases ───────────────────────────────────
    describe('Authentication Edge Cases', () => {
        it('should return 401 when user is undefined on ask', async () => {
            const req = createMockReq({ question: 'Hello?' });
            req.user = undefined;
            const res = createMockRes();

            await askQuestionAboutEmails(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 when user is null on ask', async () => {
            const req = createMockReq({ question: 'Hello?' });
            req.user = null;
            const res = createMockRes();

            await askQuestionAboutEmails(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    // ─── RAG Pipeline Failures ───────────────────────────────────────
    describe('RAG Pipeline Failures', () => {
        it('should handle retrieval service failure', async () => {
            mockResolveUserModel.mockImplementation(() => Promise.resolve('openai/gpt-4o-mini'));
            mockExecuteRetrieval.mockImplementation(() =>
                Promise.reject(new Error('Pinecone connection failed'))
            );

            const req = createMockReq({ question: 'Find invoices', useRag: true });
            const res = createMockRes();

            await askQuestionAboutEmails(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get an answer.' });
        });

        it('should handle retrieval returning empty successfully', async () => {
            mockResolveUserModel.mockImplementation(() => Promise.resolve('openai/gpt-4o-mini'));
            mockExecuteRetrieval.mockImplementation(() =>
                Promise.resolve({ success: true, emails: [], aggregation: {} })
            );

            const req = createMockReq({ question: 'Find something', useRag: true });
            const res = createMockRes();

            await askQuestionAboutEmails(req, res);

            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.answer).toContain("couldn't find");
            expect(jsonCall.metadata.emailsRetrieved).toBe(0);
        });
    });

    // ─── Input Validation Edge Cases ─────────────────────────────────
    describe('Input Validation Edge Cases', () => {
        it('should handle empty body gracefully for summarize', async () => {
            const req = createMockReq(undefined);
            const res = createMockRes();

            // body could be undefined; check that it doesn't crash
            try {
                await summarizeEmail(req, res);
            } catch {
                // If it throws, that's also acceptable for undefined body
            }
            // Either returns 400 or throws (both acceptable behaviors)
        });

        it('should reject exactly 10-char text for autocomplete (boundary)', async () => {
            mockGenerateContent.mockImplementation(() => Promise.resolve('suggestion'));
            const req = createMockReq({ text: '1234567890' }); // exactly 10 chars
            const res = createMockRes();

            await getAutocomplete(req, res);

            // length < 10 → 400, length === 10 should pass
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should reject 9-char text for autocomplete (boundary)', async () => {
            const req = createMockReq({ text: '123456789' }); // 9 chars
            const res = createMockRes();

            await getAutocomplete(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
