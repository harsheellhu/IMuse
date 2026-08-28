import db from '../db.js';

export class UserActivityService {
  /**
   * Retrieves recurring themes (patterns) based on user's actual activity.
   */
  static getRecurringThemes(userId) {
    try {
      // Analyze tags and categories from saved items, collections, and experiences
      const rows = db.prepare(`
        SELECT tag as theme, count(DISTINCT c.id) as count, 'tag' as type
        FROM content_tags t
        JOIN content c ON t.content_id = c.id
        LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
        LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
        LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
        WHERE s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL
        GROUP BY tag
        HAVING count >= 3
        
        UNION ALL
        
        SELECT category as theme, count(DISTINCT c.id) as count, 'category' as type
        FROM content c
        LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
        LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
        LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
        WHERE c.category IS NOT NULL AND c.category != '' AND (s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL)
        GROUP BY category
        HAVING count >= 3
        
        ORDER BY count DESC
        LIMIT 10
      `).all(userId, userId, userId, userId, userId, userId);

      // Enhance with detailed counts per media type
      const patterns = rows.map(row => {
        let contentBreakdown = [];
        if (row.type === 'tag') {
          contentBreakdown = db.prepare(`
            SELECT c.type, count(DISTINCT c.id) as type_count
            FROM content_tags t
            JOIN content c ON t.content_id = c.id
            LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
            LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
            LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
            WHERE t.tag = ? AND (s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL)
            GROUP BY c.type
          `).all(userId, userId, userId, row.theme);
        } else {
          contentBreakdown = db.prepare(`
            SELECT c.type, count(DISTINCT c.id) as type_count
            FROM content c
            LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
            LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
            LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
            WHERE c.category = ? AND (s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL)
            GROUP BY c.type
          `).all(userId, userId, userId, row.theme);
        }

        const breakdown = {
          books: 0,
          films: 0,
          tv_shows: 0,
          places: 0,
          images: 0,
          songs: 0
        };

        contentBreakdown.forEach(b => {
          if (b.type === 'book') breakdown.books = b.type_count;
          else if (b.type === 'film') breakdown.films = b.type_count;
          else if (b.type === 'tv_show' || b.type === 'tv-show') breakdown.tv_shows += b.type_count;
          else if (b.type === 'place') breakdown.places = b.type_count;
          else if (b.type === 'song' || b.type === 'audio') breakdown.songs += b.type_count;
          else breakdown.images += b.type_count;
        });

        const sampleCoversQuery = row.type === 'tag' ? `
          SELECT c.image_url FROM content c 
          JOIN content_tags t ON t.content_id = c.id
          LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
          LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
          LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
          WHERE t.tag = ? AND c.image_url IS NOT NULL AND (s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL)
          LIMIT 4
        ` : `
          SELECT c.image_url FROM content c 
          LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
          LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
          LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
          WHERE c.category = ? AND c.image_url IS NOT NULL AND (s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL)
          LIMIT 4
        `;
        
        const covers = db.prepare(sampleCoversQuery).all(userId, userId, userId, row.theme).map(c => c.image_url);

        return {
          id: Buffer.from(row.theme).toString('base64'),
          theme: row.theme,
          totalCount: row.count,
          breakdown,
          covers,
          reason: \`This appeared because you interacted with \${row.count} \${row.theme} items across your experiences and collections.\`
        };
      });

      return patterns;
    } catch (error) {
      console.error('[UserActivityService] getRecurringThemes error:', error);
      throw error;
    }
  }

  static getPatternThread(userId, encodedTheme) {
    try {
      const theme = Buffer.from(encodedTheme, 'base64').toString('ascii');
      
      const contents = db.prepare(`
        SELECT DISTINCT c.*,
               CASE WHEN s.user_id IS NOT NULL THEN s.saved_at ELSE COALESCE(e.event_at, ci.added_at) END as interaction_date,
               CASE WHEN s.user_id IS NOT NULL THEN 'saved' 
                    WHEN e.id IS NOT NULL THEN 'experienced'
                    WHEN ci.collection_id IS NOT NULL THEN 'collected'
               END as interaction_type
        FROM content c
        LEFT JOIN content_tags t ON t.content_id = c.id
        LEFT JOIN saved_items s ON s.content_id = c.id AND s.user_id = ?
        LEFT JOIN collection_items ci ON ci.content_id = c.id AND ci.collection_id IN (SELECT id FROM collections WHERE user_id = ?)
        LEFT JOIN experience_events e ON e.content_id = c.id AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
        WHERE (t.tag = ? OR c.category = ?) AND (s.user_id IS NOT NULL OR ci.collection_id IS NOT NULL OR e.id IS NOT NULL)
        ORDER BY interaction_date DESC
      `).all(userId, userId, userId, theme, theme);

      return {
        theme,
        items: contents
      };
    } catch (error) {
      console.error('[UserActivityService] getPatternThread error:', error);
      throw error;
    }
  }

  static getCulturalReplay(userId, year) {
    try {
      const startDate = \`\${year}-01-01T00:00:00.000Z\`;
      const endDate = \`\${year}-12-31T23:59:59.999Z\`;

      const metrics = db.prepare(`
        SELECT 
          COUNT(CASE WHEN c.type = 'film' THEN 1 END) as films,
          COUNT(CASE WHEN c.type = 'book' THEN 1 END) as books,
          COUNT(CASE WHEN c.type = 'tv_show' OR c.type = 'tv-show' THEN 1 END) as tv,
          COUNT(CASE WHEN c.type = 'place' THEN 1 END) as places
        FROM experience_events e
        JOIN content c ON e.content_id = c.id
        WHERE e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
        AND e.event_at BETWEEN ? AND ?
      `).get(userId, startDate, endDate);
      
      const savedCount = db.prepare(`
        SELECT COUNT(*) as count FROM saved_items 
        WHERE user_id = ? AND saved_at BETWEEN ? AND ?
      `).get(userId, startDate, endDate).count;
      
      metrics.savedImages = savedCount;

      const events = db.prepare(`
        SELECT e.event_at, e.event_type, c.title, c.image_url, c.type as content_type, strftime('%m', e.event_at) as month
        FROM experience_events e
        JOIN content c ON e.content_id = c.id
        WHERE e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
        AND e.event_at BETWEEN ? AND ?
        ORDER BY e.event_at ASC
      `).all(userId, startDate, endDate);

      const timelineByMonth = {};
      events.forEach(ev => {
        const m = parseInt(ev.month, 10);
        if (!timelineByMonth[m]) timelineByMonth[m] = { monthIndex: m, events: [], types: new Set() };
        timelineByMonth[m].events.push(ev);
        timelineByMonth[m].types.add(ev.content_type);
      });

      const timeline = Object.values(timelineByMonth).map(monthData => {
        const typesArr = Array.from(monthData.types);
        let shiftDesc = "";
        if (typesArr.length > 0) {
          shiftDesc = "Mostly " + typesArr.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' + ');
        }
        return {
          month: monthData.monthIndex,
          shift: shiftDesc,
          items: monthData.events
        };
      });

      const themes = db.prepare(`
        SELECT tag as theme, count(c.id) as count
        FROM content_tags t
        JOIN content c ON t.content_id = c.id
        JOIN experience_events e ON e.content_id = c.id
        WHERE e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
        AND e.event_at BETWEEN ? AND ?
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 4
      `).all(userId, startDate, endDate);

      return {
        year,
        metrics,
        timeline,
        topThemes: themes.map(t => t.theme)
      };
    } catch (error) {
      console.error('[UserActivityService] getCulturalReplay error:', error);
      throw error;
    }
  }
}
