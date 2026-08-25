import db from '../server/db.js';

console.log('Running database migrations...');

// 1. Users Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 1.5. Auth Identities
db.exec(`
  CREATE TABLE IF NOT EXISTS auth_identities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 2. User Preferences (Settings)
db.exec(`
  CREATE TABLE IF NOT EXISTS preferences (
    user_id TEXT PRIMARY KEY,
    appearance TEXT DEFAULT 'default',
    landing_style TEXT DEFAULT 'minimal',
    tron_intensity TEXT DEFAULT 'balanced',
    motion TEXT DEFAULT 'smooth',
    ambient_mode TEXT DEFAULT 'balanced',
    feed_density TEXT DEFAULT 'balanced',
    image_style TEXT DEFAULT 'original',
    typography TEXT DEFAULT 'neutral',
    shape_language TEXT DEFAULT 'rounded',
    texture TEXT DEFAULT 'none',
    nav_style TEXT DEFAULT 'floating',
    home_layout TEXT DEFAULT 'masonry',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 3. Discovery Worlds
db.exec(`
  CREATE TABLE IF NOT EXISTS discovery_worlds (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    category TEXT
  );
`);

// 4. Content Table (Posts, Books, Films)
db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'post', 'book', 'film'
    title TEXT NOT NULL,
    description TEXT,
    creator TEXT,      -- Source author or director
    image_url TEXT,
    source_url TEXT,
    category TEXT,
    metadata JSON,     -- Flexible for runtime, ratings, year, etc.
    world_id TEXT,     -- To link to discovery world
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (world_id) REFERENCES discovery_worlds(id) ON DELETE SET NULL
  );
`);

// 5. Content Tags
db.exec(`
  CREATE TABLE IF NOT EXISTS content_tags (
    content_id TEXT,
    tag TEXT,
    PRIMARY KEY (content_id, tag),
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
  );
`);

// 6. Collections
db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_private INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 7. Collection Items
db.exec(`
  CREATE TABLE IF NOT EXISTS collection_items (
    collection_id TEXT,
    content_id TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, content_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
  );
`);

// 8. Saved Items
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_items (
    user_id TEXT,
    content_id TEXT,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, content_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
  );
`);

// 9. Recent Views
db.exec(`
  CREATE TABLE IF NOT EXISTS recent_views (
    user_id TEXT,
    content_id TEXT,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, content_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
  );
`);

// 10. Background Jobs
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, running, paused, completed, failed
    progress INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    current_step TEXT,
    error TEXT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 11. Performance Indices
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
  CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
  CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
  CREATE INDEX IF NOT EXISTS idx_recent_views_user ON recent_views(user_id);
`);

console.log('Database migrations completed successfully.');
