import express from 'express';
import { CulturalDNAService } from '../services/culturalDNAService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/me/dna
router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    const profile = CulturalDNAService.getProfile(userId);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Cultural DNA' });
  }
});

export default router;
