import { Router } from 'express';
import { summarizeEmail, getAutocomplete, askQuestionAboutEmails, enhanceText, draftReply, askQuestionStream } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiLimiter, aiStreamLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { checkCredits, FEATURE_COSTS } from '../middleware/checkCredits.js';
import { summarizeSchema, autocompleteSchema, askQuestionSchema, enhanceTextSchema, draftReplySchema } from '../schemas/index.js';

const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

// Apply standard AI rate limit to all routes
router.use(aiLimiter);

router.post('/summarize', checkCredits(FEATURE_COSTS.SUMMARIZE_EMAIL), validate(summarizeSchema), summarizeEmail);
router.post('/autocomplete', checkCredits(FEATURE_COSTS.AUTOCOMPLETE), validate(autocompleteSchema), getAutocomplete);
router.post('/ask', checkCredits(FEATURE_COSTS.ASK_QUESTION), validate(askQuestionSchema), askQuestionAboutEmails);
router.post('/ask/stream', aiStreamLimiter, checkCredits(FEATURE_COSTS.ASK_QUESTION), validate(askQuestionSchema), askQuestionStream);
router.post('/enhance', checkCredits(FEATURE_COSTS.ENHANCE_TEXT), validate(enhanceTextSchema), enhanceText);
router.post('/draft-reply', checkCredits(FEATURE_COSTS.DRAFT_REPLY), validate(draftReplySchema), draftReply);

export default router;