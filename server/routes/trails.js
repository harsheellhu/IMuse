import express from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const generateId = (prefix = 't') => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const ALLOWED_CONNECTION_TYPES = [
  'inspired_by',
  'created_by',
  'adaptation_of',
  'set_in',
  'related_to',
  'similar_atmosphere',
  'personal_association',
  'leads_to',
  'custom'
];

function formatStep(step) {
  let meta = {};
  if (step.metadata) {
    try { meta = typeof step.metadata === 'string' ? JSON.parse(step.metadata) : step.metadata; } catch (e) {}
  }
  const tags = step.tags_concat ? step.tags_concat.split('|||').filter(Boolean) : [];

  return {
    id: step.step_id || step.id,
    trailId: step.trail_id,
    contentId: step.content_id,
    stepOrder: step.step_order,
    annotation: step.annotation || '',
    connectionType: step.connection_type || 'leads_to',
    connectionText: step.connection_text || '',
    createdAt: step.created_at,
    artifact: {
      id: step.content_id,
      type: step.type,
      title: step.title,
      description: step.description,
      creator: step.creator,
      imageUrl: step.image_url,
      category: step.category,
      metadata: meta,
      tags
    }
  };
}

// GET all trails for the user
router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'u-demo';
    let trails = db.prepare(`
      SELECT t.*, 
        COUNT(ts.id) as step_count,
        (SELECT c.image_url FROM trail_steps ts2 JOIN content c ON ts2.content_id = c.id WHERE ts2.trail_id = t.id ORDER BY ts2.step_order ASC LIMIT 1) as first_step_image
      FROM trails t
      LEFT JOIN trail_steps ts ON t.id = ts.trail_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.updated_at DESC
    `).all(userId);

    // If demo user has no trails yet, create default showcase trails
    if (trails.length === 0) {
      seedDefaultTrails(userId);
      trails = db.prepare(`
        SELECT t.*, 
          COUNT(ts.id) as step_count,
          (SELECT c.image_url FROM trail_steps ts2 JOIN content c ON ts2.content_id = c.id WHERE ts2.trail_id = t.id ORDER BY ts2.step_order ASC LIMIT 1) as first_step_image
        FROM trails t
        LEFT JOIN trail_steps ts ON t.id = ts.trail_id
        WHERE t.user_id = ?
        GROUP BY t.id
        ORDER BY t.updated_at DESC
      `).all(userId);
    }

    const formatted = trails.map(t => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      description: t.description || '',
      coverImage: t.cover_image || t.first_step_image || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
      theme: t.theme || 'cinematic',
      status: t.status || 'draft', // 'draft' | 'completed'
      stepCount: t.step_count || 0,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching trails:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// GET single trail with full steps and joined artifacts
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const trail = db.prepare('SELECT * FROM trails WHERE id = ?').get(req.params.id);
    if (!trail) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trail not found' } });
    }

    const stepsRaw = db.prepare(`
      SELECT 
        ts.id as step_id, ts.trail_id, ts.content_id, ts.step_order, 
        ts.annotation, ts.connection_type, ts.connection_text, ts.created_at as step_created_at,
        c.type, c.title, c.description, c.creator, c.image_url, c.category, c.metadata,
        GROUP_CONCAT(ct.tag, '|||') as tags_concat
      FROM trail_steps ts
      JOIN content c ON ts.content_id = c.id
      LEFT JOIN content_tags ct ON c.id = ct.content_id
      WHERE ts.trail_id = ?
      GROUP BY ts.id
      ORDER BY ts.step_order ASC
    `).all(req.params.id);

    const steps = stepsRaw.map(formatStep);

    res.json({
      id: trail.id,
      userId: trail.user_id,
      title: trail.title,
      description: trail.description || '',
      coverImage: trail.cover_image || (steps[0]?.artifact?.imageUrl) || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
      theme: trail.theme || 'cinematic',
      status: trail.status || 'draft',
      steps,
      createdAt: trail.created_at,
      updatedAt: trail.updated_at
    });
  } catch (err) {
    console.error('Error fetching trail:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// POST create new trail
router.post('/', optionalAuth, (req, res) => {
  const { title, description, coverImage, theme, status = 'draft', steps = [] } = req.body;
  if (!title || !title.trim()) {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Title is required' } });
  }

  const userId = req.user ? req.user.id : 'u-demo';
  const trailId = generateId('t');

  try {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO trails (id, user_id, title, description, cover_image, theme, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(trailId, userId, title.trim(), description || null, coverImage || null, theme || 'cinematic', status);

      const insertStep = db.prepare(`
        INSERT INTO trail_steps (id, trail_id, content_id, step_order, annotation, connection_type, connection_text)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      steps.forEach((step, idx) => {
        if (!step.contentId) return;
        const stepId = step.id || generateId('ts');
        const connType = ALLOWED_CONNECTION_TYPES.includes(step.connectionType) ? step.connectionType : 'leads_to';
        insertStep.run(
          stepId,
          trailId,
          step.contentId,
          idx,
          step.annotation || '',
          connType,
          step.connectionText || null
        );
      });
    })();

    const created = db.prepare('SELECT * FROM trails WHERE id = ?').get(trailId);
    res.status(201).json({
      id: created.id,
      userId: created.user_id,
      title: created.title,
      description: created.description || '',
      coverImage: created.cover_image,
      theme: created.theme,
      status: created.status,
      stepCount: steps.length,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    });
  } catch (err) {
    console.error('Error creating trail:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// PATCH / PUT update trail and atomic step synchronization
router.patch('/:id', optionalAuth, (req, res) => {
  const trailId = req.params.id;
  const { title, description, coverImage, theme, status, steps } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM trails WHERE id = ?').get(trailId);
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trail not found' } });
    }

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDesc = description !== undefined ? description : existing.description;
    const newCover = coverImage !== undefined ? coverImage : existing.cover_image;
    const newTheme = theme !== undefined ? theme : existing.theme;
    const newStatus = status !== undefined ? status : existing.status;

    db.transaction(() => {
      db.prepare(`
        UPDATE trails SET
          title = ?,
          description = ?,
          cover_image = ?,
          theme = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newTitle, newDesc, newCover, newTheme, newStatus, trailId);

      // If steps array is provided, sync steps atomically
      if (Array.isArray(steps)) {
        db.prepare('DELETE FROM trail_steps WHERE trail_id = ?').run(trailId);

        const insertStep = db.prepare(`
          INSERT INTO trail_steps (id, trail_id, content_id, step_order, annotation, connection_type, connection_text)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        steps.forEach((step, idx) => {
          const contentId = step.contentId || step.artifact?.id;
          if (!contentId) return;
          const stepId = step.id || generateId('ts');
          const connType = ALLOWED_CONNECTION_TYPES.includes(step.connectionType) ? step.connectionType : 'leads_to';
          insertStep.run(
            stepId,
            trailId,
            contentId,
            idx,
            step.annotation || '',
            connType,
            step.connectionText || null
          );
        });
      }
    })();

    res.json({ success: true, id: trailId });
  } catch (err) {
    console.error('Error updating trail:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// POST add a single step to a trail
router.post('/:id/steps', optionalAuth, (req, res) => {
  const trailId = req.params.id;
  const { contentId, annotation = '', connectionType = 'leads_to', connectionText = '' } = req.body;

  if (!contentId) {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'contentId is required' } });
  }

  try {
    const trail = db.prepare('SELECT id FROM trails WHERE id = ?').get(trailId);
    if (!trail) return res.status(404).json({ error: { code: 'NOT_FOUND' } });

    const maxOrderRow = db.prepare('SELECT MAX(step_order) as maxOrder FROM trail_steps WHERE trail_id = ?').get(trailId);
    const nextOrder = (maxOrderRow?.maxOrder !== null && maxOrderRow?.maxOrder !== undefined) ? maxOrderRow.maxOrder + 1 : 0;

    const stepId = generateId('ts');
    const safeConn = ALLOWED_CONNECTION_TYPES.includes(connectionType) ? connectionType : 'leads_to';

    db.prepare(`
      INSERT INTO trail_steps (id, trail_id, content_id, step_order, annotation, connection_type, connection_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(stepId, trailId, contentId, nextOrder, annotation, safeConn, connectionText || null);

    db.prepare('UPDATE trails SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(trailId);

    res.status(201).json({ success: true, stepId, stepOrder: nextOrder });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// POST duplicate trail
router.post('/:id/duplicate', optionalAuth, (req, res) => {
  const trailId = req.params.id;
  const userId = req.user ? req.user.id : 'u-demo';

  try {
    const original = db.prepare('SELECT * FROM trails WHERE id = ?').get(trailId);
    if (!original) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trail not found' } });
    }

    const steps = db.prepare('SELECT * FROM trail_steps WHERE trail_id = ? ORDER BY step_order ASC').all(trailId);
    const newId = generateId('t');
    const newTitle = `${original.title} (Copy)`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO trails (id, user_id, title, description, cover_image, theme, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(newId, userId, newTitle, original.description, original.cover_image, original.theme);

      const insertStep = db.prepare(`
        INSERT INTO trail_steps (id, trail_id, content_id, step_order, annotation, connection_type, connection_text)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      steps.forEach((s, idx) => {
        insertStep.run(
          generateId('ts'),
          newId,
          s.content_id,
          idx,
          s.annotation,
          s.connection_type,
          s.connection_text
        );
      });
    })();

    res.status(201).json({ success: true, id: newId, title: newTitle });
  } catch (err) {
    console.error('Error duplicating trail:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// DELETE trail
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM trails WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trail not found' } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Helper to seed showcase trails with real artifacts from the library
function seedDefaultTrails(userId) {
  try {
    // 1. "Tokyo After Dark" trail
    const tokyoItems = [
      db.prepare("SELECT id FROM content WHERE type = 'place' AND title LIKE '%Kyoto%' OR title LIKE '%Japan%' LIMIT 1").get(),
      db.prepare("SELECT id FROM content WHERE type = 'post' AND (category = 'Visual' OR category = 'Architecture') LIMIT 1").get(),
      db.prepare("SELECT id FROM content WHERE type = 'film' AND title LIKE '%Blade Runner%' LIMIT 1").get(),
      db.prepare("SELECT id FROM content WHERE type = 'book' AND title LIKE '%1984%' OR title LIKE '%Dune%' LIMIT 1").get(),
    ].filter(Boolean);

    if (tokyoItems.length >= 3) {
      const trail1Id = 'trail-tokyo-after-dark';
      db.prepare(`
        INSERT OR IGNORE INTO trails (id, user_id, title, description, cover_image, theme, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        trail1Id,
        userId,
        'Tokyo After Dark',
        'A journey through midnight neon, brutalist architecture, cinematic dystopias, and contemplative isolation.',
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
        'midnight',
        'completed'
      );

      const connMap = [
        { type: 'leads_to', note: 'Begins with the ancient quiet streets before descending into the neon metropolis.', text: 'Transition from historic calm to modern density' },
        { type: 'inspired_by', note: 'The towering concrete forms mirror the angular architecture of Japanese metabolists.', text: 'Echoes of structural brutalism' },
        { type: 'similar_atmosphere', note: 'Dense shadows, continuous rain, and ambient synth hum evoke pure urban isolation.', text: 'Cinematic visual parallel' },
        { type: 'related_to', note: 'The literary realization of solitary life within high-density technological society.', text: 'Thematic literary closure' }
      ];

      tokyoItems.forEach((it, idx) => {
        const c = connMap[idx] || { type: 'leads_to', note: 'A thoughtful step forward.', text: 'Leads to' };
        db.prepare(`
          INSERT OR IGNORE INTO trail_steps (id, trail_id, content_id, step_order, annotation, connection_type, connection_text)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`step-tokyo-${idx}`, trail1Id, it.id, idx, c.note, c.type, c.text);
      });
    }

    // 2. "The Architecture of Science Fiction" trail
    const sciFiItems = [
      db.prepare("SELECT id FROM content WHERE type = 'post' AND title LIKE '%Brutalism%' OR category = 'Architecture' LIMIT 1").get(),
      db.prepare("SELECT id FROM content WHERE type = 'film' AND title LIKE '%2001%' OR title LIKE '%Matrix%' OR title LIKE '%Interstellar%' LIMIT 1").get(),
      db.prepare("SELECT id FROM content WHERE type = 'book' AND title LIKE '%Dune%' LIMIT 1").get()
    ].filter(Boolean);

    if (sciFiItems.length >= 2) {
      const trail2Id = 'trail-scifi-architecture';
      db.prepare(`
        INSERT OR IGNORE INTO trails (id, user_id, title, description, cover_image, theme, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        trail2Id,
        userId,
        'The Architecture of Science Fiction',
        'How concrete monuments inspired futuristic monoliths, cinematic spacecraft, and planetary worldbuilding.',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
        'architectural',
        'completed'
      );

      const connMap2 = [
        { type: 'leads_to', note: 'Raw monumental forms that redefined postwar imagination.', text: 'Monuments of concrete' },
        { type: 'inspired_by', note: 'Monolithic symmetry directly influenced spacecraft and space station geometry.', text: 'Symmetry translated into space' },
        { type: 'adaptation_of', note: 'The harsh desert architecture where monumental form protects against brutal ecology.', text: 'Planetary scale structures' }
      ];

      sciFiItems.forEach((it, idx) => {
        const c = connMap2[idx] || { type: 'leads_to', note: 'Next chapter.', text: 'Leads to' };
        db.prepare(`
          INSERT OR IGNORE INTO trail_steps (id, trail_id, content_id, step_order, annotation, connection_type, connection_text)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`step-scifi-${idx}`, trail2Id, it.id, idx, c.note, c.type, c.text);
      });
    }
  } catch (e) {
    console.warn('Could not seed default trails:', e);
  }
}

export default router;
