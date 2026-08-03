import { Router } from 'express';
import { syncEmails, syncNewEmails, getSyncStatus } from '../controllers/syncController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/sync/emails — Full sync with count/date params
// Body: { count?: number, afterDate?: string }
router.post('/emails', authMiddleware, syncEmails);

// POST /api/sync/new-emails — Incremental sync (background polling)
router.post('/new-emails', authMiddleware, syncNewEmails);

// GET /api/sync/status — Get current sync state
router.get('/status', authMiddleware, getSyncStatus);

export default router;