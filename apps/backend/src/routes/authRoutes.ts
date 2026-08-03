import { Router } from 'express';
import passport from 'passport';
import { signup, login, getGoogleAuthUrl, handleGoogleCallback } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../schemas/index.js';

const router = Router();

// Public auth routes with brute-force protection + input validation
router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);

// Google OAuth flow
router.get('/google/url', authMiddleware, getGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);

export default router;