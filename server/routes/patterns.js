import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { UserActivityService } from '../services/userActivityService.js';

const router = express.Router();

// GET all patterns for the user
router.get('/', requireAuth, (req, res) => {
  try {
    const patterns = UserActivityService.getRecurringThemes(req.user.id);
    res.json(patterns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch patterns' } });
  }
});

// GET single pattern thread details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const thread = UserActivityService.getPatternThread(req.user.id, req.params.id);
    if (!thread) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pattern not found' } });
    res.json(thread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch pattern thread' } });
  }
});

export default router;
