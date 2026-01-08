import { Router } from 'express';
import { getDailyDigest } from '../controllers/gmailController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
// feauture 1 code

const router = Router();
router.use(authMiddleware);

// Creates the GET /api/gmail/daily-digest endpoint
router.get('/daily-digest', getDailyDigest);

export default router;