import express from 'express';
import { DiscoveryGraphService } from '../services/discoveryGraphService.js';
import { SerendipityService } from '../services/serendipityService.js';
import { ColorMemoryService } from '../services/colorMemoryService.js';
import { requireAuth } from '../middleware/auth.js';

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
router.get('/serendipity', requireAuth, async (req, res) => {
  try {
    const { from, level } = req.query;
    if (!from) {
      return res.status(400).json({ error: { message: 'Missing "from" content ID query parameter' } });
    }
    const leap = await SerendipityService.getLeap(req.user.id, from, level || 'unexpected');
    res.json(leap);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.post('/serendipity/save', requireAuth, async (req, res) => {
  try {
    const { thread } = req.body;
    const result = await SerendipityService.saveHistory(req.user.id, thread);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 3. Color Memory
router.get('/color-memory', requireAuth, async (req, res) => {
  try {
    const { period } = req.query;
    const memory = await ColorMemoryService.getMemory(req.user.id, period);
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
