import { Router } from 'express';
import { summarizeEmail, getAutocomplete, askQuestionAboutEmails, enhanceText, draftReply } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// This entire route is protected. A user must be logged in to use AI features.
router.use(authMiddleware);

// POST /api/ai/summarize
router.post('/summarize', summarizeEmail);

router.post('/autocomplete', getAutocomplete);

router.post('/ask', askQuestionAboutEmails);

router.post('/enhance', enhanceText); // <-- New Text Enhancement Route

router.post('/draft-reply', draftReply);


export default router;