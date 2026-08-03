import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';

// ─── Mocks ───────────────────────────────────────────────────────────

// Mock BullMQ Queue + Worker at module level (prevent Redis connection)
const mockQueueAdd = jest.fn().mockImplementation(() => Promise.resolve());
const mockQueueRemoveRepeatableByKey = jest.fn().mockImplementation(() => Promise.resolve());
const mockQueueGetJobs = jest.fn().mockImplementation(() => Promise.resolve([]));

jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: mockQueueAdd,
        removeRepeatableByKey: mockQueueRemoveRepeatableByKey,
        getJobs: mockQueueGetJobs,
    })),
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
    })),
}));

// Mock ioredis (prevent actual connection)
jest.unstable_mockModule('ioredis', () => ({
    Redis: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        disconnect: jest.fn(),
    })),
}));

// Mock Prisma
const mockPrismaScheduledTask = {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
};
jest.unstable_mockModule('../src/utils/prisma.js', () => ({
    __esModule: true,
    default: {
        scheduledTask: mockPrismaScheduledTask,
        usageLog: { create: jest.fn() },
    },
}));

// Mock emailService (imported by scheduler)
jest.unstable_mockModule('../src/services/emailService.js', () => ({
    getLatestEmails: jest.fn(),
    getLatestMessageIds: jest.fn(),
}));

// Mock aiService (imported by scheduler)
jest.unstable_mockModule('../src/services/aiService.js', () => ({
    summarizeEmailBatch: jest.fn(),
}));

// Mock logger
jest.unstable_mockModule('../src/utils/logger.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock pineconeService (transitive dependency from emailService)
jest.unstable_mockModule('../src/services/pineconeService.js', () => ({
    queryRelevantEmailChunks: jest.fn(),
    upsertEmailChunks: jest.fn(),
    queryWithFilters: jest.fn(),
    getUniqueEmailsFromChunks: jest.fn(),
    fetchAllChunksForEmails: jest.fn(),
}));

// ─── Dynamic Imports ─────────────────────────────────────────────────
let createTask: any;
let getTasks: any;
let cancelTask: any;

// Helper: Create mock Express req/res
const createMockReq = (body: any = {}, params: any = {}, user: any = { userId: 1 }) => ({
    body,
    params,
    user,
});

const createMockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ─── Test Suite ──────────────────────────────────────────────────────
describe('Task/Scheduler Controller (Unit Tests)', () => {
    beforeAll(async () => {
        const controller = await import('../src/controllers/tasksController.js');
        createTask = controller.createTask;
        getTasks = controller.getTasks;
        cancelTask = controller.cancelTask;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── createTask ──────────────────────────────────────────────────
    describe('createTask', () => {
        it('should return 400 if required fields are missing', async () => {
            const req = createMockReq({ type: 'morning-briefing' }); // missing frequency, time
            const res = createMockRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
        });

        it('should create a daily scheduled task', async () => {
            const mockTask = {
                id: 1,
                userId: 1,
                type: 'morning-briefing',
                frequency: 'daily',
                time: '08:00',
                config: {},
                status: 'active',
            };
            mockPrismaScheduledTask.create.mockImplementation(() => Promise.resolve(mockTask));

            const req = createMockReq({
                type: 'morning-briefing',
                frequency: 'daily',
                time: '08:00',
                config: {},
            });
            const res = createMockRes();

            await createTask(req, res);

            expect(res.json).toHaveBeenCalledWith(mockTask);
            expect(mockPrismaScheduledTask.create).toHaveBeenCalled();
        });

        it('should return 500 on DB failure', async () => {
            mockPrismaScheduledTask.create.mockImplementation(() =>
                Promise.reject(new Error('DB connection lost'))
            );

            const req = createMockReq({
                type: 'morning-briefing',
                frequency: 'daily',
                time: '08:00',
            });
            const res = createMockRes();

            await createTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create task' });
        });
    });

    // ─── getTasks ────────────────────────────────────────────────────
    describe('getTasks', () => {
        it('should return list of tasks for user', async () => {
            const mockTasks = [
                { id: 1, type: 'morning-briefing', status: 'active' },
                { id: 2, type: 'check-reply', status: 'active' },
            ];
            mockPrismaScheduledTask.findMany.mockImplementation(() => Promise.resolve(mockTasks));

            const req = createMockReq();
            const res = createMockRes();

            await getTasks(req, res);

            expect(res.json).toHaveBeenCalledWith(mockTasks);
        });

        it('should return 500 on fetch failure', async () => {
            mockPrismaScheduledTask.findMany.mockImplementation(() =>
                Promise.reject(new Error('DB timeout'))
            );

            const req = createMockReq();
            const res = createMockRes();

            await getTasks(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ─── cancelTask ──────────────────────────────────────────────────
    describe('cancelTask', () => {
        it('should delete a task successfully', async () => {
            mockPrismaScheduledTask.findUnique.mockImplementation(() =>
                Promise.resolve({ id: 5, type: 'morning-briefing', frequency: 'daily', time: '08:00' })
            );
            mockPrismaScheduledTask.delete.mockImplementation(() => Promise.resolve());

            const req = createMockReq({}, { id: '5' });
            const res = createMockRes();

            await cancelTask(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should return 500 on delete failure', async () => {
            mockPrismaScheduledTask.findUnique.mockImplementation(() =>
                Promise.reject(new Error('connection error'))
            );
            // deleteTask handles findUnique failure gracefully, but delete should throw
            mockPrismaScheduledTask.delete.mockImplementation(() =>
                Promise.reject(new Error('DB error'))
            );

            const req = createMockReq({}, { id: '99' });
            const res = createMockRes();

            await cancelTask(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
