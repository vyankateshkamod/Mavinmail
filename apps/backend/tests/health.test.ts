import request from 'supertest';
import app from '../src/app.js';
import { describe, it, expect } from '@jest/globals';

describe('Health Check Endpoint', () => {
    it('should return 200 OK with status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
    });
});
