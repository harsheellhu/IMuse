import db from '../db.js';

export const SerendipityService = {
  getLeap: async (userId, currentContentId, level = 'unexpected') => {
    // 1. Get current content context
    const source = db.prepare('SELECT * FROM content WHERE id = ?').get(currentContentId);
    if (!source) throw new Error('Source not found');
    
    const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(currentContentId).map(t => t.tag);
    const sourceMetadata = source.metadata ? JSON.parse(source.metadata) : {};

    // Base query logic
    let target;
    let explanation;
    
    // We penalize exact match types if we want unexpected.
    // If gentle: same type, related tags.
    // If unexpected: different type, related tags.
    // If wild: totally random with just 1 distant connection (like same year or single obscure tag).

    if (level === 'wild') {
      // Find a completely different medium, random tag overlap
      target = db.prepare(`
        SELECT c.*, ct.tag as shared_tag
        FROM content c
        JOIN content_tags ct ON c.id = ct.content_id
        WHERE c.type != ? AND ct.tag IN (${tags.map(()=>'?').join(',')})
        ORDER BY RANDOM()
        LIMIT 1
      `).get(source.type, ...tags);

      if (target) {
        explanation = `You were looking at ${source.type}s. This ${target.type} appeared because it unexpectedly shares the concept of "${target.shared_tag}".`;
      } else {
        // Fallback to random
        target = db.prepare('SELECT * FROM content WHERE id != ? ORDER BY RANDOM() LIMIT 1').get(source.id);
        explanation = `A wild leap into the unknown.`;
      }

    } else if (level === 'unexpected') {
      // Find a different medium, but strong shared tags or creator
      target = db.prepare(`
        SELECT c.*, ct.tag as shared_tag
        FROM content c
        JOIN content_tags ct ON c.id = ct.content_id
        WHERE c.type != ? AND ct.tag IN (${tags.map(()=>'?').join(',')})
        ORDER BY RANDOM()
        LIMIT 1
      `).get(source.type, ...tags);

      if (target) {
        explanation = `A serendipitous connection across mediums, linked by "${target.shared_tag}".`;
      } else {
        target = db.prepare('SELECT * FROM content WHERE id != ? ORDER BY RANDOM() LIMIT 1').get(source.id);
        explanation = `Sometimes, the universe just provides.`;
      }
    } else {
      // Gentle: Same medium or similar category
      target = db.prepare(`
        SELECT c.*, ct.tag as shared_tag
        FROM content c
        JOIN content_tags ct ON c.id = ct.content_id
        WHERE c.type = ? AND ct.tag IN (${tags.map(()=>'?').join(',')}) AND c.id != ?
        ORDER BY RANDOM()
        LIMIT 1
      `).get(source.type, ...tags, source.id);

      if (target) {
        explanation = `Gently related through a shared focus on "${target.shared_tag}".`;
      } else {
        target = db.prepare('SELECT * FROM content WHERE type = ? AND id != ? ORDER BY RANDOM() LIMIT 1').get(source.type, source.id);
        explanation = `Another ${source.type} you might enjoy.`;
      }
    }

    if (target && target.metadata) {
      try { target.metadata = JSON.parse(target.metadata); } catch(e){}
    }
    if (source.metadata && typeof source.metadata === 'string') {
      try { source.metadata = JSON.parse(source.metadata); } catch(e){}
    }

    return {
      source,
      target,
      explanation,
      level
    };
  },

  saveHistory: async (userId, thread) => {
    // A thread could just be saved as a new Collection called "Serendipity Trail: [Date]"
    const title = `Serendipity Trail: ${new Date().toLocaleDateString()}`;
    const id = 'col_' + Date.now();
    
    db.prepare(`
      INSERT INTO collections (id, user_id, title, description, is_private)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, title, "A rabbit hole discovered via Serendipity Mode.", 1);

    const stmt = db.prepare('INSERT INTO collection_items (collection_id, content_id) VALUES (?, ?)');
    for (const item of thread) {
      try {
        stmt.run(id, item.id);
      } catch (err) {
        // ignore unique constraint if duplicate in thread
      }
    }

    return { success: true, collectionId: id };
  }
};
