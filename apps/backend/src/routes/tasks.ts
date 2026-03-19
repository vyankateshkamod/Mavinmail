import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createTask, getTasks, cancelTask } from '../controllers/tasksController.js';
import { checkCredits, FEATURE_COSTS } from '../middleware/checkCredits.js';

const router = Router();

router.use(authMiddleware);

router.post('/', checkCredits(FEATURE_COSTS.SCHEDULE_TASK), createTask);
router.get('/', getTasks);
router.delete('/:id', cancelTask);

export default router;
