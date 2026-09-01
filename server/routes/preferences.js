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
    
    // Parse JSON columns safely
    const response = { ...prefs };
    if (response.custom_palettes) {
      try { response.customPalettes = JSON.parse(response.custom_palettes); } catch { response.customPalettes = []; }
    }
    if (response.favorite_palettes) {
      try { response.favoritePalettes = JSON.parse(response.favorite_palettes); } catch { response.favoritePalettes = []; }
    }
    if (response.recent_palettes) {
      try { response.recentPalettes = JSON.parse(response.recent_palettes); } catch { response.recentPalettes = []; }
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.patch('/', requireAuth, (req, res) => {
  try {
    const validKeys = [
      'appearance', 'landing_style', 'tron_intensity', 'motion',
      'ambient_mode', 'feed_density', 'image_style', 'typography',
      'shape_language', 'texture', 'nav_style', 'home_layout',
      'custom_palettes', 'favorite_palettes', 'recent_palettes'
    ];
    
    const body = { ...req.body };
    if (body.customPalettes !== undefined) {
      body.custom_palettes = JSON.stringify(body.customPalettes);
    }
    if (body.favoritePalettes !== undefined) {
      body.favorite_palettes = JSON.stringify(body.favoritePalettes);
    }
    if (body.recentPalettes !== undefined) {
      body.recent_palettes = JSON.stringify(body.recentPalettes);
    }

    const updates = [];
    const values = [];
    
    for (const key of validKeys) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key]);
      }
    }
    
    if (updates.length > 0) {
      values.push(req.user.id);
      db.prepare(`UPDATE preferences SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    }
    
    const prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(req.user.id);
    const response = { ...prefs };
    if (response.custom_palettes) {
      try { response.customPalettes = JSON.parse(response.custom_palettes); } catch { response.customPalettes = []; }
    }
    if (response.favorite_palettes) {
      try { response.favoritePalettes = JSON.parse(response.favorite_palettes); } catch { response.favoritePalettes = []; }
    }
    if (response.recent_palettes) {
      try { response.recentPalettes = JSON.parse(response.recent_palettes); } catch { response.recentPalettes = []; }
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
