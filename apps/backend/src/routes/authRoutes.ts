import { Router } from 'express';
import { signup, login , getGoogleAuthUrl, handleGoogleCallback} from '../controllers/authController.js';

const router = Router();

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signup);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);



// /backend/src/routes/authRoutes.ts
import passport from 'passport';
import { authMiddleware } from '../middleware/authMiddleware.js'; // We will create this

// --- Google OAuth Flow ---

// Step 1: Frontend requests the Google Auth URL from this SECURE endpoint
router.get('/google/url', authMiddleware, getGoogleAuthUrl);

// Step 2: Google redirects the user here after consent.
// This route is public, but we verify the user via the 'state' param.
router.get('/google/callback', handleGoogleCallback);


export default router;