import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import {
    getActiveModels,
    getAllModelsAdmin,
    createModel,
    updateModel,
    deleteModel,
    setDefaultModel,
    getOllamaModels,
} from '../controllers/modelController.js';

const router = Router();

// ============================================================================
// PUBLIC ROUTES - Authenticated users can view active models
// ============================================================================

// GET /api/models - List all active models for selection
router.get('/', authMiddleware, getActiveModels);

// ============================================================================
// ADMIN ROUTES - Model management (ADMIN or SUPER_ADMIN)
// ============================================================================

// GET /api/models/admin/ollama - List local Ollama models (if available)
router.get('/admin/ollama', authMiddleware, requireAdmin, getOllamaModels);

// GET /api/models/admin - List all models with full metadata
router.get('/admin', authMiddleware, requireAdmin, getAllModelsAdmin);

// POST /api/models/admin - Create a new model
router.post('/admin', authMiddleware, requireAdmin, createModel);

// PUT /api/models/admin/:id - Update a model
router.put('/admin/:id', authMiddleware, requireAdmin, updateModel);

// DELETE /api/models/admin/:id - Delete a model
router.delete('/admin/:id', authMiddleware, requireAdmin, deleteModel);

// PUT /api/models/admin/:id/set-default - Set model as default
router.put('/admin/:id/set-default', authMiddleware, requireAdmin, setDefaultModel);

export default router;
