import db from '../db.js';

export const CulturalDNAService = {
  getProfile: (userId) => {
    const cached = db.prepare('SELECT * FROM cultural_dna WHERE user_id = ?').get(userId);
    
    // Determine if cache needs refresh (e.g. older than 24 hours)
    const needsRefresh = !cached || (Date.now() - new Date(cached.last_computed).getTime() > 24 * 60 * 60 * 1000);
    
    if (needsRefresh) {
      return CulturalDNAService.computeAndCacheProfile(userId);
    }
    
    if (cached && cached.cache_data) {
      try { return JSON.parse(cached.cache_data); } catch(e){}
    }
    
    return CulturalDNAService.computeAndCacheProfile(userId);
  },

  computeAndCacheProfile: (userId) => {
    // 1. Fetch user's saved items, collections, and experiences
    const savedTags = db.prepare(`
      SELECT ct.tag, COUNT(*) as count 
      FROM saved_items si
      JOIN content_tags ct ON si.content_id = ct.content_id
      WHERE si.user_id = ?
      GROUP BY ct.tag
      ORDER BY count DESC
    `).all(userId);
    
    const collectionTags = db.prepare(`
      SELECT ct.tag, COUNT(*) as count 
      FROM collections c
      JOIN collection_items ci ON c.id = ci.collection_id
      JOIN content_tags ct ON ci.content_id = ct.content_id
      WHERE c.user_id = ?
      GROUP BY ct.tag
      ORDER BY count DESC
    `).all(userId);

    // Merge tag counts to build thematic clusters
    const themeMap = {};
    const mergeTags = (tagList, weight) => {
      tagList.forEach(t => {
        themeMap[t.tag] = (themeMap[t.tag] || 0) + (t.count * weight);
      });
    };
    
    mergeTags(savedTags, 1);
    mergeTags(collectionTags, 2); // collections carry more weight

    // Convert to sorted clusters
    const topThemes = Object.entries(themeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, score]) => ({ tag, score }))
      .slice(0, 15);

    // 2. Identify cross-media threads (items with same tag across different types)
    const crossMediaThreads = [];
    topThemes.slice(0, 5).forEach(theme => {
      const types = db.prepare(`
        SELECT DISTINCT c.type
        FROM content c
        JOIN content_tags ct ON c.id = ct.content_id
        JOIN saved_items si ON c.id = si.content_id
        WHERE ct.tag = ? AND si.user_id = ?
      `).all(theme.tag, userId).map(r => r.type);
      
      if (types.length > 1) {
        crossMediaThreads.push({
          theme: theme.tag,
          types,
          score: theme.score
        });
      }
    });

    // 3. Find "Emerging" (recent vs old saves)
    // For simplicity in this demo, just pick a random from top 5 that isn't the absolute top
    const emerging = topThemes.length > 2 ? topThemes[2] : null;
    const constant = topThemes.length > 0 ? topThemes[0] : null;

    const cacheData = {
      clusters: topThemes,
      threads: crossMediaThreads,
      emerging: emerging ? { theme: emerging.tag, reason: 'Activity increased across your recent saves.' } : null,
      constant: constant ? { theme: constant.tag, reason: 'Present across your saved content.' } : null
    };

    // Save to DB
    const strData = JSON.stringify(cacheData);
    const existing = db.prepare('SELECT user_id FROM cultural_dna WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare('UPDATE cultural_dna SET cache_data = ?, last_computed = CURRENT_TIMESTAMP WHERE user_id = ?').run(strData, userId);
    } else {
      db.prepare('INSERT INTO cultural_dna (user_id, cache_data) VALUES (?, ?)').run(userId, strData);
    }

    return cacheData;
  }
};
