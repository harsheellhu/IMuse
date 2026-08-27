import express from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { ExperienceLinkService } from '../services/experienceLinkService.js';

const router = express.Router();

// GET all experiences for the user
router.get('/', requireAuth, (req, res) => {
  try {
    const experiences = db.prepare(`
      SELECT * FROM experiences 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `).all(req.user.id);
    
    // For each experience, optionally fetch its events and content imagery (so we can build the cover)
    for (const exp of experiences) {
      exp.events = db.prepare(`
        SELECT e.*, c.title as content_title, c.image_url, c.type as content_type 
        FROM experience_events e
        JOIN content c ON e.content_id = c.id
        WHERE e.experience_id = ?
        ORDER BY e.event_at ASC
      `).all(exp.id);
    }

    res.json(experiences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch experiences' } });
  }
});

// GET single experience details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const exp = db.prepare(`SELECT * FROM experiences WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);
    if (!exp) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Experience not found' } });
    
    exp.events = db.prepare(`
      SELECT e.*, c.title as content_title, c.image_url, c.type as content_type, c.category as content_category, c.creator
      FROM experience_events e
      JOIN content c ON e.content_id = c.id
      WHERE e.experience_id = ?
      ORDER BY e.event_at ASC
    `).all(exp.id);
    
    // Also fetch possible suggestions
    exp.suggestions = db.prepare(`
      SELECT l.*, c.title as source_title, c2.title as target_title, c2.image_url as target_image, c2.id as target_id
      FROM experience_links l
      JOIN content c ON l.source_content_id = c.id
      JOIN content c2 ON l.target_content_id = c2.id
      WHERE l.experience_id = ? AND l.confidence = 'possible'
    `).all(exp.id);

    res.json(exp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch experience' } });
  }
});

// GET experiences by contentId
router.get('/by-content/:contentId', requireAuth, (req, res) => {
  try {
    const { contentId } = req.params;
    const experiences = db.prepare(`
      SELECT DISTINCT exp.*
      FROM experiences exp
      JOIN experience_events ev ON exp.id = ev.experience_id
      WHERE ev.content_id = ? AND exp.user_id = ?
    `).all(contentId, req.user.id);
    
    // Attach events for teaser rendering
    for (const exp of experiences) {
      exp.events = db.prepare(`
        SELECT e.*, c.title as content_title, c.image_url, c.type as content_type, c.category as content_category
        FROM experience_events e
        JOIN content c ON e.content_id = c.id
        WHERE e.experience_id = ?
        ORDER BY e.event_at ASC
      `).all(exp.id);
    }

    res.json(experiences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch experiences by content' } });
  }
});

// CREATE manual experience (usually done automatically, but this supports manual creation or logging isolated events)
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, description } = req.body;
    const id = crypto.randomUUID();
    
    db.prepare(`
      INSERT INTO experiences (id, user_id, title, description)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, title || 'New Experience', description || '');
    
    res.status(201).json({ id, title, description });
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create experience' } });
  }
});

// UPDATE experience title/description
router.patch('/:id', requireAuth, (req, res) => {
  try {
    const { title, description } = req.body;
    db.prepare(`
      UPDATE experiences SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(title, description, req.params.id, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update experience' } });
  }
});

// DELETE experience
router.delete('/:id', requireAuth, (req, res) => {
  try {
    db.prepare(`DELETE FROM experiences WHERE id = ? AND user_id = ?`).run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete experience' } });
  }
});

// LOG an event to an experience
router.post('/:id/events', requireAuth, async (req, res) => {
  try {
    // If id is 'new', we create a new standalone experience for this event first
    let expId = req.params.id;
    let newExperienceCreated = false;
    
    if (expId === 'new') {
      expId = crypto.randomUUID();
      const content = db.prepare('SELECT title FROM content WHERE id = ?').get(req.body.contentId);
      db.prepare(`
        INSERT INTO experiences (id, user_id, title)
        VALUES (?, ?, ?)
      `).run(expId, req.user.id, content ? content.title : 'My Experience');
      newExperienceCreated = true;
    } else {
      // Verify ownership
      const exp = db.prepare(`SELECT id FROM experiences WHERE id = ? AND user_id = ?`).get(expId, req.user.id);
      if (!exp) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Experience not found' } });
    }

    const { contentId, eventType, eventAt, datePrecision, locationName, city, country, note } = req.body;
    const eventId = crypto.randomUUID();
    
    db.prepare(`
      INSERT INTO experience_events (id, experience_id, content_id, event_type, event_at, date_precision, location_name, city, country, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(eventId, expId, contentId, eventType, eventAt || new Date().toISOString(), datePrecision || 'exact', locationName, city, country, note);
    
    db.prepare(`UPDATE experiences SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(expId);

    // Run auto-detection
    await ExperienceLinkService.detectConnections(req.user.id, eventId);

    res.status(201).json({ id: eventId, experienceId: expId, newExperienceCreated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to log event' } });
  }
});

// UPDATE event
router.patch('/:id/events/:eventId', requireAuth, (req, res) => {
  try {
    // Verify ownership
    const exp = db.prepare(`SELECT id FROM experiences WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);
    if (!exp) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Experience not found' } });

    const { eventType, eventAt, datePrecision, locationName, city, country, note } = req.body;
    
    db.prepare(`
      UPDATE experience_events 
      SET event_type = COALESCE(?, event_type),
          event_at = COALESCE(?, event_at),
          date_precision = COALESCE(?, date_precision),
          location_name = ?,
          city = ?,
          country = ?,
          note = ?
      WHERE id = ? AND experience_id = ?
    `).run(eventType, eventAt, datePrecision, locationName || null, city || null, country || null, note || null, req.params.eventId, exp.id);
    
    db.prepare(`UPDATE experiences SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(exp.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update event' } });
  }
});

// DELETE event
router.delete('/:id/events/:eventId', requireAuth, (req, res) => {
  try {
    const exp = db.prepare(`SELECT id FROM experiences WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);
    if (!exp) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Experience not found' } });

    db.prepare(`DELETE FROM experience_events WHERE id = ? AND experience_id = ?`).run(req.params.eventId, exp.id);
    
    // If experience has no events left, maybe we should delete it, or just leave it empty.
    const count = db.prepare(`SELECT count(*) as c FROM experience_events WHERE experience_id = ?`).get(exp.id);
    if (count.c === 0) {
      db.prepare(`DELETE FROM experiences WHERE id = ?`).run(exp.id);
    } else {
      db.prepare(`UPDATE experiences SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(exp.id);
    }
    
    res.json({ success: true, experienceDeleted: count.c === 0 });
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete event' } });
  }
});

export default router;
