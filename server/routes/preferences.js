import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  try {
    let prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(req.user.id);
    if (!prefs) {
      // Create defaults if not exists
      db.prepare('INSERT INTO preferences (user_id) VALUES (?)').run(req.user.id);
      prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(req.user.id);
    }
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.patch('/', requireAuth, (req, res) => {
  try {
    const validKeys = [
      'appearance', 'landing_style', 'tron_intensity', 'motion',
      'ambient_mode', 'feed_density', 'image_style', 'typography',
      'shape_language', 'texture', 'nav_style', 'home_layout'
    ];
    
    const updates = [];
    const values = [];
    
    for (const key of validKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    
    if (updates.length > 0) {
      values.push(req.user.id);
      db.prepare(`UPDATE preferences SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    }
    
    const prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(req.user.id);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
