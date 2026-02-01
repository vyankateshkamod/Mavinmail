import { Router } from 'express';
import { getPublicSystemStatus } from '../controllers/adminController.js';

const router = Router();

// ============================================================================
// SYSTEM ROUTES (PUBLIC)
// ============================================================================

// GET /api/system/status - Check maintenance mode and system announcements
router.get('/status', getPublicSystemStatus);

export default router;
