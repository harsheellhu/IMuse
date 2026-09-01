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

export default db;
