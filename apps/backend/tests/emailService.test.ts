
import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';

// 1. Define Mocks BEFORE imports
const mockGmailClient = {
    users: {
        messages: {
            list: jest.fn(),
            get: jest.fn(),
        },
    },
};

const mockOAuth2Client = {
    setCredentials: jest.fn(),
};

// Mock googleapis
jest.unstable_mockModule('googleapis', () => ({
    google: {
        gmail: jest.fn(() => mockGmailClient),
        auth: {
            OAuth2: jest.fn(() => mockOAuth2Client),
        },
    },
}));

// Mock logger to suppress noise, but allow seeing errors if needed for debugging
jest.unstable_mockModule('../src/utils/logger.js', () => ({
    default: {
        info: jest.fn((msg) => console.log('[MOCK INFO]', msg)),
        warn: jest.fn((msg) => console.warn('[MOCK WARN]', msg)),
        error: jest.fn((msg, err) => console.error('[MOCK ERROR]', msg, err)),
    },
}));

// 2. Dynamic Imports
let emailService: any;
let getLatestEmails: any;
let getLatestMessageIds: any;
let getEmailById: any;
let prisma: any;
let encrypt: any; // Import real encrypt function

describe('Email Service (Gmail Integration)', () => {
    beforeAll(async () => {
        // Import strict dependencies first
        prisma = (await import('../src/utils/prisma.js')).default;
        const encryptionService = await import('../src/services/encryptionService.js');
        encrypt = encryptionService.encrypt;

        // Setup Spies on Real Services with VALID ENCRYPTED TOKENS
        jest.spyOn(prisma.connectedAccount, 'findFirst').mockImplementation(() => Promise.resolve({
            accessToken: encrypt('mock_access_token'),
            refreshToken: encrypt('mock_refresh_token'),
        }));

        emailService = await import('../src/services/emailService.js');
        getLatestEmails = emailService.getLatestEmails;
        getLatestMessageIds = emailService.getLatestMessageIds;
        getEmailById = emailService.getEmailById;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Re-apply usage mocks if cleared
        (mockOAuth2Client.setCredentials as jest.Mock).mockClear();
        (prisma.connectedAccount.findFirst as jest.Mock).mockImplementation(() => Promise.resolve({
            accessToken: encrypt('mock_access_token'),
            refreshToken: encrypt('mock_refresh_token'),
        }));
    });

    describe('getLatestMessageIds', () => {
        it('should return a list of message IDs', async () => {
            // Mock list response
            (mockGmailClient.users.messages.list as any).mockResolvedValue({
                data: {
                    messages: [{ id: 'msg_1' }, { id: 'msg_2' }],
                },
            });

            const result = await getLatestMessageIds(1, 10);
            expect(result).toEqual(['msg_1', 'msg_2']);
            expect(mockGmailClient.users.messages.list).toHaveBeenCalledWith({
                userId: 'me',
                maxResults: 10,
                q: 'category:primary',
            });
        });

        it('should return empty array on API error', async () => {
            (mockGmailClient.users.messages.list as any).mockRejectedValue(new Error('API Fail'));
            const result = await getLatestMessageIds(1, 10);
            expect(result).toEqual([]);
        });
    });

    describe('getEmailById', () => {
        it('should fetch and parse a simplified email', async () => {
            // 1. Mock Metadata Fetch (Safety Check)
            (mockGmailClient.users.messages.get as any).mockImplementationOnce(() => Promise.resolve({
                data: { sizeEstimate: 1000, id: 'msg_123' } // Small size
            }));

            // 2. Mock Full Fetch
            (mockGmailClient.users.messages.get as any).mockImplementationOnce(() => Promise.resolve({
                data: {
                    id: 'msg_123',
                    threadId: 'thread_123',
                    internalDate: '1600000000000',
                    labelIds: ['INBOX'],
                    payload: {
                        headers: [
                            { name: 'Subject', value: 'Test Subject' },
                            { name: 'From', value: 'Sender <sender@example.com>' },
                            { name: 'To', value: 'Me <me@example.com>' },
                            { name: 'Message-ID', value: '<abc@xyz>' },
                        ],
                        body: { data: Buffer.from('Hello World').toString('base64') }, // "Hello World"
                    },
                },
            }));

            const result = await getEmailById(1, 'msg_123');

            expect(result).not.toBeNull();
            expect(result.id).toBe('msg_123');
            expect(result.subject).toBe('Test Subject');
            expect(result.content).toBe('Hello World');
            expect(result.fromDomain).toBe('example.com'); // Tested via real metadataExtractor
        });

        it('should skip massive emails based on size estimate', async () => {
            // Mock Metadata Fetch returning BIG size
            (mockGmailClient.users.messages.get as any).mockResolvedValue({
                data: { sizeEstimate: 10 * 1024 * 1024, id: 'msg_big' } // 10MB
            });

            const result = await getEmailById(1, 'msg_big');
            expect(result).toBeNull(); // Should skip and return null for single fetch

            // Should NOT call full fetch
            expect(mockGmailClient.users.messages.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('getLatestEmails', () => {
        it('should fetch and process multiple emails', async () => {
            // 1. Mock List
            (mockGmailClient.users.messages.list as any).mockResolvedValue({
                data: { messages: [{ id: 'msg_1' }] },
            });

            // 2. Mock Get (Metadata)
            (mockGmailClient.users.messages.get as any).mockImplementationOnce(() => Promise.resolve({
                data: { sizeEstimate: 500, id: 'msg_1' }
            }));

            // 3. Mock Get (Full)
            (mockGmailClient.users.messages.get as any).mockImplementationOnce(() => Promise.resolve({
                data: {
                    id: 'msg_1',
                    snippet: 'Snippet text',
                    payload: {
                        headers: [
                            { name: 'Subject', value: 'Invoice #101' },
                            { name: 'From', value: 'billing@stripe.com' },
                        ],
                        body: { data: Buffer.from('You paid $50.00').toString('base64') },
                    },
                },
            }));

            const results = await getLatestEmails(1, 5);

            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('msg_1');
            expect(results[0].subject).toBe('Invoice #101');
            expect(results[0].fromDomain).toBe('stripe.com');

            // Verify vendor detection (from metadataExtractor)
            // Stripe is in VENDOR_PATTERNS
            expect(results[0].vendor).toBe('stripe');
            expect(results[0].isInvoice).toBe(true);
            expect(results[0].amount).toBe(50);
            expect(results[0].currency).toBe('USD');
        });
    });
});
