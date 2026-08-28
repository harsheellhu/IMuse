import db from '../db.js';

export const DiscoveryGraphService = {
  getUniverse: async (contentId) => {
    // Return a spatial graph data structure (nodes and edges)
    // 1. Get the center node
    const centerNode = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    if (!centerNode) {
      throw new Error('Content not found');
    }

    if (centerNode.metadata) {
      try { centerNode.metadata = JSON.parse(centerNode.metadata); } catch(e){}
    }

    const nodes = [centerNode];
    const edges = [];
    const addedIds = new Set([contentId]);

    const addRelated = (content, label) => {
      if (!addedIds.has(content.id) && nodes.length <= 8) {
        if (content.metadata && typeof content.metadata === 'string') {
          try { content.metadata = JSON.parse(content.metadata); } catch(e){}
        }
        nodes.push(content);
        edges.push({ source: contentId, target: content.id, label });
        addedIds.add(content.id);
      }
    };

    // Rule 1: Created By / Same Creator
    if (centerNode.creator) {
      const sameCreator = db.prepare('SELECT * FROM content WHERE creator = ? AND id != ? LIMIT 2').all(centerNode.creator, contentId);
      for (const item of sameCreator) {
        addRelated(item, 'same creator');
      }
    }

    // Rule 2: Shared Tags (Same subject, same place, same world)
    const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(contentId).map(t => t.tag);
    if (tags.length > 0) {
      const placeholders = tags.map(() => '?').join(',');
      const relatedByTag = db.prepare(`
        SELECT c.*, ct.tag as shared_tag
        FROM content c
        JOIN content_tags ct ON c.id = ct.content_id
        WHERE ct.tag IN (${placeholders}) AND c.id != ?
        ORDER BY RANDOM()
        LIMIT 4
      `).all(...tags, contentId);

      for (const item of relatedByTag) {
        // Label logic
        let label = 'related subject';
        if (['tokyo', 'paris', 'new york', 'los angeles', 'greece', 'athens'].includes(item.shared_tag.toLowerCase())) {
          label = 'same place';
        } else if (item.shared_tag.toLowerCase().includes('punk') || item.shared_tag.toLowerCase().includes('world')) {
          label = 'same world';
        } else if (item.shared_tag.toLowerCase().includes('architecture')) {
          label = 'related architecture';
        } else {
          label = `shared: ${item.shared_tag}`;
        }
        addRelated(item, label);
      }
    }

    // Rule 3: Cross-media references (Books to Films = adaptations)
    if (centerNode.type === 'book') {
      const adaptations = db.prepare('SELECT * FROM content WHERE type = "film" AND title LIKE ? AND id != ? LIMIT 1').all(`%${centerNode.title}%`, contentId);
      for (const item of adaptations) {
        addRelated(item, 'adaptation of');
      }
    } else if (centerNode.type === 'film') {
      const source = db.prepare('SELECT * FROM content WHERE type = "book" AND title LIKE ? AND id != ? LIMIT 1').all(`%${centerNode.title}%`, contentId);
      for (const item of source) {
        addRelated(item, 'adapted from');
      }
    }

    // Rule 4: Same Category Fallback
    if (nodes.length < 5 && centerNode.category) {
      const sameCat = db.prepare('SELECT * FROM content WHERE category = ? AND id != ? ORDER BY RANDOM() LIMIT 2').all(centerNode.category, contentId);
      for (const item of sameCat) {
        addRelated(item, 'same category');
      }
    }

    // Add explicit experience links if any
    const expLinks = db.prepare(`
      SELECT c.* 
      FROM experience_links el
      JOIN experience_events ee ON el.experience_id = ee.experience_id
      JOIN content c ON ee.content_id = c.id
      WHERE el.source_content_id = ? AND c.id != ?
      LIMIT 2
    `).all(contentId, contentId);

    for (const item of expLinks) {
      addRelated(item, 'part of experience');
    }

    return { nodes, edges };
  }
};
