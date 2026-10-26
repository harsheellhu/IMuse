import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = path.resolve(__dirname, '../imuse.db');
const db = new Database(dbPath, { 
  // verbose: console.log // uncomment to debug SQL queries
});

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Safe theme & custom palette migrations
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_palettes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      base_theme_id TEXT,
      is_dark INTEGER DEFAULT 1,
      colors TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
} catch (e) {}

try {
  db.exec(`ALTER TABLE preferences ADD COLUMN custom_palettes TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE preferences ADD COLUMN favorite_palettes TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE preferences ADD COLUMN recent_palettes TEXT DEFAULT '[]'`);
} catch (e) {}

// Smart Collections schema additions
try { db.exec(`ALTER TABLE collections ADD COLUMN type TEXT DEFAULT 'manual'`); } catch (e) {}
try { db.exec(`ALTER TABLE collections ADD COLUMN match_operator TEXT DEFAULT 'all'`); } catch (e) {}
try { db.exec(`ALTER TABLE collections ADD COLUMN rules TEXT DEFAULT '[]'`); } catch (e) {}
try { db.exec(`ALTER TABLE collections ADD COLUMN pinned_ids TEXT DEFAULT '[]'`); } catch (e) {}
try { db.exec(`ALTER TABLE collections ADD COLUMN excluded_ids TEXT DEFAULT '[]'`); } catch (e) {}
try { db.exec(`ALTER TABLE collections ADD COLUMN manual_order TEXT DEFAULT '[]'`); } catch (e) {}
try { db.exec(`ALTER TABLE collections ADD COLUMN layout TEXT DEFAULT 'grid'`); } catch (e) {}

// Cultural Trails tables
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trails (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      theme TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
} catch (e) {}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trail_steps (
      id TEXT PRIMARY KEY,
      trail_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      annotation TEXT,
      connection_type TEXT DEFAULT 'leads_to',
      connection_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
    );
  `);
} catch (e) {}

try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trail_steps_trail ON trail_steps(trail_id, step_order);
    CREATE INDEX IF NOT EXISTS idx_trails_user ON trails(user_id);
    CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(type);
  `);
} catch (e) {}

export default db;
