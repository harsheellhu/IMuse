import db from '../db.js';

export const DiscoveryGraphService = {
  getUniverse: async (contentId) => {
    // 1. Get the center node
    let centerNode = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    
    // Fallback search if not found directly
    if (!centerNode) {
      centerNode = db.prepare('SELECT * FROM content WHERE id LIKE ? OR title LIKE ? LIMIT 1').get(`%${contentId}%`, `%${contentId}%`);
    }

    if (!centerNode) {
      throw new Error('Content not found');
    }

    if (centerNode.metadata && typeof centerNode.metadata === 'string') {
      try { centerNode.metadata = JSON.parse(centerNode.metadata); } catch(e){}
    }

    const nodes = [centerNode];
    const edges = [];
    const addedIds = new Set([centerNode.id]);

    const addRelated = (content, label, relationType, confidence = 0.8, strength = 'secondary') => {
      if (!addedIds.has(content.id) && nodes.length < 10) {
        if (content.metadata && typeof content.metadata === 'string') {
          try { content.metadata = JSON.parse(content.metadata); } catch(e){}
        }
        nodes.push(content);
        edges.push({
          source: centerNode.id,
          target: content.id,
          label: label.toUpperCase(),
          relationType,
          confidence,
          strength // 'primary' | 'secondary' | 'peripheral'
        });
        addedIds.add(content.id);
      }
    };

    // Rule 1: Explicit Experience Links (Highest confidence)
    try {
      const expLinks = db.prepare(`
        SELECT c.*, el.relationship_type 
        FROM experience_links el
        JOIN experience_events ee ON el.experience_id = ee.experience_id
        JOIN content c ON ee.content_id = c.id
        WHERE el.source_content_id = ? AND c.id != ?
        LIMIT 2
      `).all(centerNode.id, centerNode.id);

      for (const item of expLinks) {
        addRelated(item, item.relationship_type || 'Connected Experience', 'experience', 0.95, 'primary');
      }
    } catch (e) {
      // Table may be empty in some setups
    }

    // Rule 2: Created By / Same Creator (Primary)
    if (centerNode.creator && centerNode.creator.trim()) {
      const sameCreator = db.prepare('SELECT * FROM content WHERE creator = ? AND id != ? LIMIT 3').all(centerNode.creator, centerNode.id);
      for (const item of sameCreator) {
        addRelated(item, 'Same Creator', 'creator', 0.92, 'primary');
      }
    }

    // Rule 3: Cross-media references (Books <-> Films adaptations)
    if (centerNode.type === 'book') {
      const cleanTitle = (centerNode.title || '').split(':')[0].trim();
      if (cleanTitle.length > 2) {
        const adaptations = db.prepare("SELECT * FROM content WHERE type = 'film' AND title LIKE ? AND id != ? LIMIT 2").all(`%${cleanTitle}%`, centerNode.id);
        for (const item of adaptations) {
          addRelated(item, 'Adaptation', 'adaptation', 0.90, 'primary');
        }
      }
    } else if (centerNode.type === 'film') {
      const cleanTitle = (centerNode.title || '').split(':')[0].trim();
      if (cleanTitle.length > 2) {
        const source = db.prepare("SELECT * FROM content WHERE type = 'book' AND title LIKE ? AND id != ? LIMIT 2").all(`%${cleanTitle}%`, centerNode.id);
        for (const item of source) {
          addRelated(item, 'Adapted From', 'adaptation', 0.90, 'primary');
        }
      }
    }

    // Rule 4: Shared Tags / Locations / Worlds
    const tags = db.prepare('SELECT tag FROM content_tags WHERE content_id = ?').all(centerNode.id).map(t => t.tag);
    if (tags.length > 0) {
      const placeholders = tags.map(() => '?').join(',');
      const relatedByTag = db.prepare(`
        SELECT c.*, ct.tag as shared_tag
        FROM content c
        JOIN content_tags ct ON c.id = ct.content_id
        WHERE ct.tag IN (${placeholders}) AND c.id != ?
        ORDER BY RANDOM()
        LIMIT 6
      `).all(...tags, centerNode.id);

      for (const item of relatedByTag) {
        const tagLower = (item.shared_tag || '').toLowerCase();
        let label = `Shared: ${tagLower}`;
        let relType = 'tag';
        let conf = 0.78;
        let str = 'secondary';

        if (['tokyo', 'paris', 'new york', 'los angeles', 'greece', 'athens', 'kyoto', 'london', 'venice', 'rome', 'hallstatt', 'austria'].some(p => tagLower.includes(p))) {
          label = 'Same Place';
          relType = 'place';
          conf = 0.88;
          str = 'primary';
        } else if (tagLower.includes('punk') || tagLower.includes('world') || tagLower.includes('cyber') || tagLower.includes('noir') || tagLower.includes('futur')) {
          label = 'Same World';
          relType = 'world';
          conf = 0.84;
          str = 'secondary';
        } else if (tagLower.includes('architecture') || tagLower.includes('brutalism') || tagLower.includes('modernism')) {
          label = 'Same Architecture';
          relType = 'architecture';
          conf = 0.82;
          str = 'secondary';
        }

        addRelated(item, label, relType, conf, str);
      }
    }

    // Rule 5: Same World / Category Fallback if sparse
    if (nodes.length < 6 && centerNode.world_id) {
      const sameWorld = db.prepare('SELECT * FROM content WHERE world_id = ? AND id != ? ORDER BY RANDOM() LIMIT 3').all(centerNode.world_id, centerNode.id);
      for (const item of sameWorld) {
        addRelated(item, 'Same World', 'world', 0.75, 'secondary');
      }
    }

    if (nodes.length < 5 && centerNode.category) {
      const sameCat = db.prepare('SELECT * FROM content WHERE category = ? AND id != ? ORDER BY RANDOM() LIMIT 3').all(centerNode.category, centerNode.id);
      for (const item of sameCat) {
        addRelated(item, 'Same Category', 'category', 0.60, 'peripheral');
      }
    }

    return { nodes, edges };
  }
};

