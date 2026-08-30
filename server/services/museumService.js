import db from '../db.js';

export const MuseumService = {
  getMuseum: (userId) => {
    let museum = db.prepare('SELECT * FROM museums WHERE user_id = ?').get(userId);
    
    // Auto-create a museum if one doesn't exist
    if (!museum) {
      const museumId = 'mus_' + Date.now();
      db.prepare(`
        INSERT INTO museums (id, user_id, title, description) 
        VALUES (?, ?, 'My Museum', 'A personal curation of culture.')
      `).run(museumId, userId);
      
      museum = db.prepare('SELECT * FROM museums WHERE id = ?').get(museumId);
      
      // Auto-create initial rooms from existing collections for demo
      let collections = db.prepare('SELECT * FROM collections WHERE user_id = ?').all(userId);
      if (collections.length === 0) {
        collections = db.prepare('SELECT * FROM collections LIMIT 5').all();
      }
      collections.forEach((col, idx) => {
        const roomId = 'room_' + Date.now() + idx;
        db.prepare(`
          INSERT INTO museum_rooms (id, museum_id, collection_id, room_order)
          VALUES (?, ?, ?, ?)
        `).run(roomId, museumId, col.id, idx);
      });
    }

    return museum;
  },

  updateMuseum: (userId, data) => {
    const museum = MuseumService.getMuseum(userId);
    db.prepare(`
      UPDATE museums SET title = ?, description = ?, cover_image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.title || museum.title, data.description || museum.description, data.cover_image || museum.cover_image, museum.id);
    
    return db.prepare('SELECT * FROM museums WHERE id = ?').get(museum.id);
  },

  getRooms: (museumId) => {
    let rooms = db.prepare(`
      SELECT r.*, c.title as collection_title, c.description as collection_desc, c.cover_image as collection_cover 
      FROM museum_rooms r
      JOIN collections c ON r.collection_id = c.id
      WHERE r.museum_id = ?
      ORDER BY r.room_order ASC
    `).all(museumId);

    // If museum has no rooms yet, create them from available collections
    if (rooms.length === 0) {
      const collections = db.prepare('SELECT * FROM collections LIMIT 5').all();
      collections.forEach((col, idx) => {
        const roomId = 'room_' + Date.now() + idx;
        db.prepare(`
          INSERT OR IGNORE INTO museum_rooms (id, museum_id, collection_id, room_order)
          VALUES (?, ?, ?, ?)
        `).run(roomId, museumId, col.id, idx);
      });

      rooms = db.prepare(`
        SELECT r.*, c.title as collection_title, c.description as collection_desc, c.cover_image as collection_cover 
        FROM museum_rooms r
        JOIN collections c ON r.collection_id = c.id
        WHERE r.museum_id = ?
        ORDER BY r.room_order ASC
      `).all(museumId);
    }

    // Fetch items for each room
    rooms.forEach(room => {
      const items = db.prepare(`
        SELECT ci.*, c.*
        FROM collection_items ci
        JOIN content c ON ci.content_id = c.id
        WHERE ci.collection_id = ?
      `).all(room.collection_id);

      room.items = items.map(item => {
        if (item.metadata) {
          try { item.metadata = JSON.parse(item.metadata); } catch(e){}
        }
        return item;
      });
    });

    return rooms;
  },

  saveRoomCanvas: (collectionId, itemsMetadata) => {
    // itemsMetadata is an array of { content_id, metadata: { x, y, scale, rotation, zIndex, note } }
    const stmt = db.prepare(`
      UPDATE collection_items 
      SET metadata = ? 
      WHERE collection_id = ? AND content_id = ?
    `);

    const transaction = db.transaction((updates) => {
      for (const update of updates) {
        stmt.run(JSON.stringify(update.metadata), collectionId, update.content_id);
      }
    });

    transaction(itemsMetadata);
    return { success: true };
  }
};
