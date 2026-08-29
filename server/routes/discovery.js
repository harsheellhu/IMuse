import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/worlds', (req, res) => {
  try {
    const worlds = db.prepare('SELECT * FROM discovery_worlds').all();
    res.json(worlds);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.get('/worlds/:slug', (req, res) => {
  try {
    const world = db.prepare('SELECT * FROM discovery_worlds WHERE slug = ?').get(req.params.slug);
    if (!world) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'World not found' } });
    }
    res.json(world);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.get('/worlds/:slug/content', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  try {
    const world = db.prepare('SELECT id FROM discovery_worlds WHERE slug = ?').get(req.params.slug);
    if (!world) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'World not found' } });
    }
    
    const rows = db.prepare('SELECT * FROM content WHERE world_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(world.id, limit, offset);
    if (rows.length === 0) {
      return res.json([]);
    }
      
    const contentIds = rows.map(r => r.id);
    const placeholders = contentIds.map(() => '?').join(',');
    const allTags = db.prepare(`SELECT content_id, tag FROM content_tags WHERE content_id IN (${placeholders})`).all(...contentIds);
    
    const tagMap = new Map();
    for (const t of allTags) {
      if (!tagMap.has(t.content_id)) tagMap.set(t.content_id, []);
      tagMap.get(t.content_id).push(t.tag);
    }

    const content = rows.map(row => {
      let meta = null;
      if (row.metadata) {
        try { meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata; } catch(e){}
      }
      return {
        ...row,
        metadata: meta,
        tags: tagMap.get(row.id) || []
      };
    });
    
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
