import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upgradeToPro, topUpCredits } from '../controllers/upgradeController.js';

const router = Router();

// Require login for all upgrade actions
router.use(authMiddleware);

router.post('/pro', upgradeToPro);
router.post('/top-up', topUpCredits);

export default router;
