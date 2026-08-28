import db from '../server/db.js';

console.log('Running v2 database migrations...');

// 1. Alter collection_items to add metadata JSON for canvas position/scale
try {
  db.exec(`ALTER TABLE collection_items ADD COLUMN metadata JSON;`);
  console.log('Added metadata to collection_items');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('metadata column already exists in collection_items');
  } else {
    console.error('Error altering collection_items:', e);
  }
}

// 2. Museums Table
db.exec(`
  CREATE TABLE IF NOT EXISTS museums (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 3. Museum Rooms Table
db.exec(`
  CREATE TABLE IF NOT EXISTS museum_rooms (
    id TEXT PRIMARY KEY,
    museum_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    room_order INTEGER DEFAULT 0,
    curator_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );
`);

// 4. Cultural DNA Profiles (Cache)
db.exec(`
  CREATE TABLE IF NOT EXISTS cultural_dna (
    user_id TEXT PRIMARY KEY,
    cache_data JSON NOT NULL,
    last_computed DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('v2 Database migrations completed successfully.');
