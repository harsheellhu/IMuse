import db from '../server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { seedPurpleRain } from './seed-purple-rain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Seeding database...');

// 1. Seed Users (including demo user)
const users = [
  {
    id: 'u-demo',
    username: 'demo',
    email: 'demo@imuse.app',
    password: 'demo',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    bio: 'Demo account — explore everything iMuse has to offer.'
  },
  {
    id: 'u1',
    username: 'arivera',
    email: 'arivera@example.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    bio: 'Curating architecture, design, and visual culture.'
  },
  {
    id: 'u2',
    username: 'erostova',
    email: 'erostova@example.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=webp&fit=crop&q=80&w=150',
    bio: 'Photographer and film enthusiast.'
  }
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, email, password_hash, avatar_url, bio)
  VALUES (?, ?, ?, ?, ?, ?)
`);

users.forEach(u => {
  const hash = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.id, u.username, u.email, hash, u.avatar_url, u.bio);
});

// 2. Seed Discovery Worlds
const worlds = [
  { id: 'w1', slug: 'architecture', name: 'Architecture', description: 'Brutalist, modern, and classical structures.', category: 'Visual' },
  { id: 'w2', slug: 'cinema', name: 'Cinema', description: 'Cinematography stills and film history.', category: 'Film' },
  { id: 'w100', slug: 'films', name: 'Films', description: 'Curated selection of classic and modern cinema.', category: 'Film' },
  { id: 'w3', slug: 'typography', name: 'Typography', description: 'Editorial and experimental type.', category: 'Visual' },
  { id: 'w4', slug: 'sci-fi', name: 'Sci-Fi', description: 'Futuristic interfaces and concept art.', category: 'Concept' },
  { id: 'w5', slug: 'nature', name: 'Nature', description: 'Landscapes and organic forms.', category: 'Visual' },
  { id: 'w6', slug: 'tv-shows', name: 'TV Shows', description: 'Iconic television series and their visual worlds.', category: 'TV' },
  { id: 'w7', slug: 'places', name: 'Places', description: 'Destinations, streets, and hidden corners around the world.', category: 'Travel' },
  { id: 'w8', slug: 'shops', name: 'Shops', description: 'Storefronts, markets, and retail experiences.', category: 'Lifestyle' },
  { id: 'w9', slug: 'books', name: 'Books', description: 'Literature, novels, and non-fiction.', category: 'Literature' },
  { id: 'w10', slug: 'art', name: 'Art', description: 'Paintings, sculptures, and digital art.', category: 'Visual' },
  { id: 'w11', slug: 'design', name: 'Design', description: 'Industrial design and objects.', category: 'Visual' },
  { id: 'w12', slug: 'music', name: 'Music', description: 'Album covers, artists, and live performances.', category: 'Music' },
  { id: 'w13', slug: 'photography', name: 'Photography', description: 'Editorial, portrait, and street photography.', category: 'Visual' },
  { id: 'w14', slug: 'fashion', name: 'Fashion', description: 'Avant-garde fashion and runway photography.', category: 'Visual' }
];

const insertWorld = db.prepare(`
  INSERT OR IGNORE INTO discovery_worlds (id, slug, name, description, category)
  VALUES (?, ?, ?, ?, ?)
`);

worlds.forEach(w => {
  insertWorld.run(w.id, w.slug, w.name, w.description, w.category);
});

// 3. Seed Content from JSON packs
const insertContent = db.prepare(`
  INSERT OR IGNORE INTO content (id, type, title, description, creator, image_url, category, world_id, metadata)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTag = db.prepare(`
  INSERT OR IGNORE INTO content_tags (content_id, tag)
  VALUES (?, ?)
`);

const packsDir = path.resolve(__dirname, '../public/packs');
if (fs.existsSync(packsDir)) {
  const files = fs.readdirSync(packsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace('.json', '');
    const world = worlds.find(w => w.slug === slug);
    if (!world) {
      console.warn(`No world found for pack ${slug}, skipping...`);
      continue;
    }
    
    console.log(`Seeding pack ${slug}...`);
    const data = JSON.parse(fs.readFileSync(path.join(packsDir, file), 'utf-8'));
    data.forEach(item => {
      // Resolve content type based on the pack item or fallback
      let type = item.type || 'post';
      if (item.tags && item.tags.includes('film')) type = 'film';
      if (item.tags && item.tags.includes('tv_show')) type = 'tv_show';
      if (item.tags && item.tags.includes('book')) type = 'book';
      if (item.tags && item.tags.includes('place')) type = 'place';
      if (item.tags && item.tags.includes('music')) type = 'music';

      insertContent.run(
        item.id,
        type,
        item.title,
        item.description || null,
        item.creatorId || 'discovery-bot',
        item.imageUrl || item.img, // fallback to old format if necessary
        item.category || world.category,
        world.id,
        item.metadata ? JSON.stringify(item.metadata) : null
      );
      
      if (item.tags) {
        item.tags.forEach(tag => {
          insertTag.run(item.id, tag);
        });
      }
    });
  }
}

// 4. Seed Demo Collections for the demo user
const insertCollection = db.prepare(`
  INSERT OR IGNORE INTO collections (id, user_id, title, description, cover_image, is_private)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertCollectionItem = db.prepare(`
  INSERT OR IGNORE INTO collection_items (collection_id, content_id)
  VALUES (?, ?)
`);

const demoCollections = [
  {
    id: 'col-1',
    title: 'Architectural Marvels',
    description: 'A curated selection of brutalist and modern architecture from around the globe.',
    cover_image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2000&auto=format&fit=crop',
    items: ['architecture-0', 'architecture-3', 'architecture-7', 'architecture-13', 'architecture-20', 'architecture-40']
  },
  {
    id: 'col-2',
    title: 'Hidden Destinations',
    description: 'Off-the-beaten-path places that inspire wanderlust.',
    cover_image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2000&auto=format&fit=crop',
    items: ['places-0', 'places-3', 'places-6', 'places-8', 'places-11', 'places-25']
  },
  {
    id: 'col-3',
    title: 'Late Night Cinema',
    description: 'Films that stay with you long after the credits roll.',
    cover_image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2000&auto=format&fit=crop',
    items: ['films-0', 'films-3', 'films-6', 'films-9', 'films-14']
  },
  {
    id: 'col-4',
    title: 'Books for Winter',
    description: 'Literature to get lost in during the cold months.',
    cover_image: 'https://images.unsplash.com/photo-1455390582262-044cdead27d2?q=80&w=2000&auto=format&fit=crop',
    items: ['books-1', 'books-4', 'books-9', 'books-12', 'books-18']
  },
  {
    id: 'col-5',
    title: 'Quiet Landscapes',
    description: 'Natural landscapes captured in extraordinary light.',
    cover_image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2000&auto=format&fit=crop',
    items: ['nature-0', 'nature-5', 'nature-10', 'nature-15', 'nature-20']
  },
  {
    id: 'col-6',
    title: 'Great Typography',
    description: 'Inspiring letterforms and editorial design.',
    cover_image: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2000&auto=format&fit=crop',
    items: ['typography-0', 'typography-5', 'typography-10', 'typography-15', 'typography-20']
  },
  {
    id: 'col-7',
    title: 'Future Objects',
    description: 'Sci-Fi concepts and industrial design.',
    cover_image: 'https://images.unsplash.com/photo-1541359927273-d76820fc43f9?q=80&w=2000&auto=format&fit=crop',
    items: ['sci-fi-0', 'sci-fi-3', 'sci-fi-8', 'sci-fi-12', 'sci-fi-20']
  }
];

demoCollections.forEach(col => {
  insertCollection.run(col.id, 'u-demo', col.title, col.description, col.cover_image, 0);
  col.items.forEach(itemId => {
    insertCollectionItem.run(col.id, itemId);
  });
});

// 5. Seed some saved items for demo user
const insertSaved = db.prepare(`INSERT OR IGNORE INTO saved_items (user_id, content_id) VALUES (?, ?)`);
['architecture-0', 'architecture-7', 'films-0', 'films-6', 'places-0', 'places-3', 'photography-1', 'photography-4'].forEach(id => {
  insertSaved.run('u-demo', id);
});

// 6. Seed demo user preferences
db.prepare(`INSERT OR IGNORE INTO preferences (user_id) VALUES (?)`).run('u-demo');

// 7. Seed Purple Rain (2017 Remaster) Local Album and Tracks
seedPurpleRain();

console.log('Database seeding completed successfully.');
