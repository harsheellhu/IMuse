import db from '../db.js';

// Fallback nice colors if missing
const VIBRANT_PALETTES = [
  { primary: 'rgb(41, 128, 185)', secondary: 'rgb(243, 156, 18)', accent: 'rgb(231, 76, 60)', background: 'rgb(10, 30, 45)' }, // Deep Blue & Orange
  { primary: 'rgb(39, 174, 96)', secondary: 'rgb(142, 68, 173)', accent: 'rgb(241, 196, 15)', background: 'rgb(10, 45, 25)' },  // Muted Green & Purple
  { primary: 'rgb(192, 57, 43)', secondary: 'rgb(44, 62, 80)', accent: 'rgb(189, 195, 199)', background: 'rgb(45, 10, 10)' },  // Crimson & Navy
  { primary: 'rgb(211, 84, 0)', secondary: 'rgb(52, 73, 94)', accent: 'rgb(26, 188, 156)', background: 'rgb(45, 20, 10)' },    // Burnt Orange & Teal
  { primary: 'rgb(245, 245, 220)', secondary: 'rgb(101, 67, 33)', accent: 'rgb(139, 69, 19)', background: 'rgb(250, 250, 250)' } // Warm Beige & Brown
];

export const ColorMemoryService = {
  getMemory: async (userId, period = 'year') => {
    // We look at user's saved items and map them to their colors over time.
    // In SQLite, we can grab the saved_items + content, group by month (strftime).
    
    // For the sake of the prototype, we assume we fetch all saved_items and assign/read colors.
    const items = db.prepare(`
      SELECT c.*, s.saved_at 
      FROM saved_items s
      JOIN content c ON s.content_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.saved_at ASC
    `).all(userId);

    // Ensure they have colors
    items.forEach((item, index) => {
      if (item.metadata) {
        try { item.metadata = JSON.parse(item.metadata); } catch(e){}
      } else {
        item.metadata = {};
      }

      if (!item.metadata.palette) {
        // Assign a mock palette deterministically based on ID to remain consistent
        const charCode = item.id.charCodeAt(item.id.length - 1);
        item.metadata.palette = VIBRANT_PALETTES[charCode % VIBRANT_PALETTES.length];
      }
    });

    // Group by month
    // month string format: 'YYYY-MM'
    const grouped = {};
    for (const item of items) {
      const d = new Date(item.saved_at);
      const m = d.getMonth() + 1; // 1-12
      const year = d.getFullYear();
      const key = `${year}-${m.toString().padStart(2, '0')}`;

      if (!grouped[key]) {
        grouped[key] = {
          monthKey: key,
          items: [],
          dominantPalette: null,
          colorCounts: {}
        };
      }
      grouped[key].items.push(item);
      
      const pId = item.metadata.palette.primary;
      grouped[key].colorCounts[pId] = (grouped[key].colorCounts[pId] || 0) + 1;
    }

    // Determine dominant color for each month
    const timeline = Object.values(grouped).map((group) => {
      let maxCount = 0;
      let dominantPrimary = null;
      for (const [color, count] of Object.entries(group.colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantPrimary = color;
        }
      }
      
      // Find the full palette for this dominant color
      const domItem = group.items.find(i => i.metadata.palette.primary === dominantPrimary);
      group.dominantPalette = domItem ? domItem.metadata.palette : VIBRANT_PALETTES[0];
      
      return group;
    });

    // Find overall recurring palettes
    const overallCounts = {};
    items.forEach(item => {
      const p = item.metadata.palette;
      const key = p.primary;
      if (!overallCounts[key]) {
        overallCounts[key] = { palette: p, count: 0, items: [] };
      }
      overallCounts[key].count++;
      overallCounts[key].items.push(item);
    });

    const topPalettes = Object.values(overallCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      timeline,
      topPalettes,
      totalItems: items.length
    };
  }
};
