import { Router } from 'express';
import { getConnectionStatus, disconnectGoogleAccount } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this file are protected and require a valid token
router.use(authMiddleware);

// GET /api/user/connection-status
router.get('/connection-status', getConnectionStatus);

// DELETE /api/user/connections/google
router.delete('/connections/google', disconnectGoogleAccount);

// ====================================================================
// =====> NEW: Routes for User Preferences <=====
// ====================================================================
import { getPreferences, updatePreferences } from '../controllers/userController.js';

// GET /api/user/preferences
router.get('/preferences', getPreferences);

// PUT /api/user/preferences
router.put('/preferences', updatePreferences);

export default router;