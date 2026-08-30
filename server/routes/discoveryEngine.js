import express from 'express';
import { DiscoveryGraphService } from '../services/discoveryGraphService.js';
import { SerendipityService } from '../services/serendipityService.js';
import { ColorMemoryService } from '../services/colorMemoryService.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. One Image -> Entire Universe
router.get('/universe/:id', async (req, res) => {
  try {
    const universe = await DiscoveryGraphService.getUniverse(req.params.id);
    res.json(universe);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 2. Serendipity Mode
router.get('/serendipity', optionalAuth, async (req, res) => {
  try {
    const { from, level } = req.query;
    if (!from) {
      return res.status(400).json({ error: { message: 'Missing "from" content ID query parameter' } });
    }
    const userId = req.user ? req.user.id : 'u-demo';
    const leap = await SerendipityService.getLeap(userId, from, level || 'unexpected');
    res.json(leap);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.post('/serendipity/save', optionalAuth, async (req, res) => {
  try {
    const { thread } = req.body;
    const userId = req.user ? req.user.id : 'u-demo';
    const result = await SerendipityService.saveHistory(userId, thread);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 3. Color Memory
router.get('/color-memory', optionalAuth, async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user ? req.user.id : 'u-demo';
    const memory = await ColorMemoryService.getMemory(userId, period);
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
