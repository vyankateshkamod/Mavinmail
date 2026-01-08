import { Router } from 'express';
import { syncEmails } from '../controllers/syncController.js'; // Your controller is named syncEmails
// --- THIS IS THE FIX ---
// Import the NEW middleware function, not the old one.
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Use the NEW 'authenticateToken' middleware for this route.
router.post('/emails', authMiddleware, syncEmails); 
// -----------------------

export default router;