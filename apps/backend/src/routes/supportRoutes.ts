import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
    createTicket,
    getUserTickets,
    getTicketById,
    deleteUserTicket,
} from '../controllers/supportController.js';

const router = Router();

// ============================================================================
// USER SUPPORT ROUTES - Requires authentication
// ============================================================================

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/support/tickets - Create a new support ticket
router.post('/tickets', createTicket);

// GET /api/support/tickets - Get user's own tickets
router.get('/tickets', getUserTickets);

// GET /api/support/tickets/:id - Get a specific ticket
router.get('/tickets/:id', getTicketById);

// DELETE /api/support/tickets/:id - Delete a user's own ticket
router.delete('/tickets/:id', deleteUserTicket);

export default router;

