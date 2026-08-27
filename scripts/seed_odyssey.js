import db from '../server/db.js';

console.log('Seeding The Odyssey content...');

// Insert user (if not exists)
const defaultUserId = 'u_101'; // Default test user
db.prepare(`
  INSERT OR IGNORE INTO users (id, username, email, password_hash)
  VALUES (?, ?, ?, ?)
`).run(defaultUserId, 'testuser', 'test@example.com', 'hash');

// Insert Book
db.prepare(`
  INSERT OR REPLACE INTO content (id, type, title, description, creator, category, image_url)
  VALUES ('odyssey-book', 'book', 'The Odyssey', 'Epic poem by Homer', 'Homer', 'Literature', 'https://images.unsplash.com/photo-1544716278-e513176f20b5')
`).run();

// Insert Film
db.prepare(`
  INSERT OR REPLACE INTO content (id, type, title, description, creator, category, image_url)
  VALUES ('odyssey-film', 'film', 'The Odyssey', '1997 Television miniseries', 'Andrei Konchalovsky', 'Cinema', 'https://images.unsplash.com/photo-1485846234645-a62644f84728')
`).run();

// Insert Place
db.prepare(`
  INSERT OR REPLACE INTO content (id, type, title, description, creator, category, image_url)
  VALUES ('athens-place', 'place', 'Athens', 'Capital of Greece', 'History', 'Place', 'https://images.unsplash.com/photo-1555993539-1732b0258235')
`).run();

console.log('The Odyssey seed completed.');
