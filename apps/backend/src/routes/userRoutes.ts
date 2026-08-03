import { Router } from 'express';
import {
    getConnectionStatus,
    disconnectGoogleAccount,
    getPreferences,
    updatePreferences,
    getProfile,
    updateProfile,
    changePassword,
    getCredits,
    getGoogleCredentials,
    updateGoogleCredentials
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, updateProfileSchema } from '../schemas/index.js';

const router = Router();

// All routes in this file are protected and require a valid token
router.use(authMiddleware);

// GET /api/user/connection-status
router.get('/connection-status', getConnectionStatus);

// DELETE /api/user/connections/google
router.delete('/connections/google', disconnectGoogleAccount);

// ====================================================================
// =====> Routes for Custom Google OAuth <=====
// ====================================================================

// GET /api/user/google-credentials
router.get('/google-credentials', getGoogleCredentials);

// PUT /api/user/google-credentials
router.put('/google-credentials', updateGoogleCredentials);

// ====================================================================
// =====> Routes for User Preferences <=====
// ====================================================================

// GET /api/user/preferences
router.get('/preferences', getPreferences);

// PUT /api/user/preferences
router.put('/preferences', updatePreferences);

// ====================================================================
// =====> Routes for User Profile <=====
// ====================================================================

// GET /api/user/profile - Fetch user profile
router.get('/profile', getProfile);

// PUT /api/user/profile - Update user profile (secure email change)
router.put('/profile', validate(updateProfileSchema), updateProfile);

// PUT /api/user/password - Change account password
router.put('/password', validate(changePasswordSchema), changePassword);

// ====================================================================
// =====&gt; Routes for Credit System &lt;=====
// ====================================================================

// GET /api/user/credits - Get credit balance and plan
router.get('/credits', getCredits);

export default router;
