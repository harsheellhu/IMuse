import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { UserActivityService } from '../services/userActivityService.js';

const router = express.Router();

// GET cultural replay for a specific year
router.get('/:year', requireAuth, (req, res) => {
  try {
    const replay = UserActivityService.getCulturalReplay(req.user.id, req.params.year);
    if (!replay) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Replay not found' } });
    res.json(replay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch cultural replay' } });
  }
});

export default router;
