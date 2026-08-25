import db from '../server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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

// 2. Seed Discovery Worlds (expanded with new categories)
const worlds = [
  { id: 'w1', slug: 'architecture', name: 'Architecture', description: 'Brutalist, modern, and classical structures.', category: 'Visual' },
  { id: 'w2', slug: 'cinema', name: 'Cinema', description: 'Cinematography stills and film history.', category: 'Film' },
  { id: 'w3', slug: 'typography', name: 'Typography', description: 'Editorial and experimental type.', category: 'Visual' },
  { id: 'w4', slug: 'sci-fi', name: 'Sci-Fi', description: 'Futuristic interfaces and concept art.', category: 'Concept' },
  { id: 'w5', slug: 'nature', name: 'Nature', description: 'Landscapes and organic forms.', category: 'Visual' },
  { id: 'w6', slug: 'tv-shows', name: 'TV Shows', description: 'Iconic television series and their visual worlds.', category: 'TV' },
  { id: 'w7', slug: 'places', name: 'Places', description: 'Destinations, streets, and hidden corners around the world.', category: 'Travel' },
  { id: 'w8', slug: 'shops', name: 'Shops', description: 'Storefronts, markets, and retail experiences.', category: 'Lifestyle' },
];

const insertWorld = db.prepare(`
  INSERT OR IGNORE INTO discovery_worlds (id, slug, name, description, category)
  VALUES (?, ?, ?, ?, ?)
`);

worlds.forEach(w => {
  insertWorld.run(w.id, w.slug, w.name, w.description, w.category);
});

// 3. Seed Content from JSON packs (existing)
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
    if (!world) continue;
    
    const data = JSON.parse(fs.readFileSync(path.join(packsDir, file), 'utf-8'));
    data.forEach(item => {
      insertContent.run(
        item.id,
        'post',
        item.title,
        item.description || null,
        item.creatorId,
        item.imageUrl,
        item.category,
        world.id,
        null
      );
      if (item.tags) {
        item.tags.forEach(tag => {
          insertTag.run(item.id, tag);
        });
      }
    });
  }
}

// 4. Seed inline content for new categories: TV Shows, Places, Shops

const tvShows = [
  { id: 'tv-0', title: 'Breaking Bad', desc: 'A high school chemistry teacher turns to manufacturing methamphetamine.', img: 'https://picsum.photos/id/1005/800/1000', tags: ['drama', 'thriller'] },
  { id: 'tv-1', title: 'Stranger Things', desc: 'A group of kids uncover supernatural mysteries in their small town.', img: 'https://picsum.photos/id/1010/800/1000', tags: ['sci-fi', 'horror'] },
  { id: 'tv-2', title: 'The Crown', desc: 'The reign of Queen Elizabeth II and the events that shaped the second half of the twentieth century.', img: 'https://picsum.photos/id/1015/800/1000', tags: ['drama', 'history'] },
  { id: 'tv-3', title: 'Dark', desc: 'A missing child sets four families on a frantic hunt for answers across three generations.', img: 'https://picsum.photos/id/1018/800/1000', tags: ['sci-fi', 'mystery'] },
  { id: 'tv-4', title: 'Chernobyl', desc: 'The story of the 1986 nuclear disaster and the sacrifices made to contain it.', img: 'https://picsum.photos/id/1020/800/1000', tags: ['drama', 'history'] },
  { id: 'tv-5', title: 'Fleabag', desc: 'A dry-witted woman navigates life and love in London.', img: 'https://picsum.photos/id/1024/800/1000', tags: ['comedy', 'drama'] },
  { id: 'tv-6', title: 'Severance', desc: 'Employees of a mysterious corporation agree to a surgical memory procedure.', img: 'https://picsum.photos/id/1031/800/1000', tags: ['sci-fi', 'thriller'] },
  { id: 'tv-7', title: 'The Bear', desc: 'A young chef returns to Chicago to run his family sandwich shop.', img: 'https://picsum.photos/id/1033/800/1000', tags: ['drama', 'comedy'] },
  { id: 'tv-8', title: 'Shogun', desc: 'A feudal epic set in 1600s Japan.', img: 'https://picsum.photos/id/1035/800/1000', tags: ['drama', 'history'] },
  { id: 'tv-9', title: 'Succession', desc: 'The Roy family fights for control of a global media empire.', img: 'https://picsum.photos/id/1036/800/1000', tags: ['drama', 'comedy'] },
  { id: 'tv-10', title: 'True Detective', desc: 'Anthology series exploring the nature of crime and justice.', img: 'https://picsum.photos/id/1038/800/1000', tags: ['crime', 'drama'] },
  { id: 'tv-11', title: 'Arcane', desc: 'Set in the utopian Piltover and the oppressed underground of Zaun.', img: 'https://picsum.photos/id/1040/800/1000', tags: ['animation', 'action'] },
  { id: 'tv-12', title: 'Fargo', desc: 'An anthology of stories rooted in deception, violence, and small-town crime.', img: 'https://picsum.photos/id/1041/800/1000', tags: ['crime', 'thriller'] },
  { id: 'tv-13', title: 'Better Call Saul', desc: 'The journey of small-time lawyer Jimmy McGill to criminal lawyer Saul Goodman.', img: 'https://picsum.photos/id/1042/800/1000', tags: ['drama', 'crime'] },
  { id: 'tv-14', title: 'Mr. Robot', desc: 'A hacker with social anxiety disorder joins a revolutionary group.', img: 'https://picsum.photos/id/1043/800/1000', tags: ['thriller', 'tech'] },
];

const places = [
  { id: 'place-0', title: 'Santorini, Greece', desc: 'White-washed buildings overlooking the caldera.', img: 'https://picsum.photos/id/1044/800/1000', tags: ['mediterranean', 'island'] },
  { id: 'place-1', title: 'Kyoto, Japan', desc: 'Ancient temples, bamboo groves, and traditional tea houses.', img: 'https://picsum.photos/id/1047/800/1000', tags: ['asia', 'temple'] },
  { id: 'place-2', title: 'Amalfi Coast, Italy', desc: 'Dramatic coastline with colorful cliffside villages.', img: 'https://picsum.photos/id/1049/800/1000', tags: ['coast', 'europe'] },
  { id: 'place-3', title: 'Hallstatt, Austria', desc: 'A fairytale lakeside village nestled in the Alps.', img: 'https://picsum.photos/id/1051/800/1000', tags: ['alps', 'lake'] },
  { id: 'place-4', title: 'Marrakech, Morocco', desc: 'Vibrant souks, riads, and the bustling Jemaa el-Fnaa.', img: 'https://picsum.photos/id/1052/800/1000', tags: ['africa', 'market'] },
  { id: 'place-5', title: 'Banff, Canada', desc: 'Turquoise lakes and towering peaks in the Canadian Rockies.', img: 'https://picsum.photos/id/1053/800/1000', tags: ['mountain', 'nature'] },
  { id: 'place-6', title: 'Reykjavik, Iceland', desc: 'Northern lights, geysers, and stark volcanic landscapes.', img: 'https://picsum.photos/id/1054/800/1000', tags: ['nordic', 'nature'] },
  { id: 'place-7', title: 'Lisbon, Portugal', desc: 'Pastel-colored buildings, tram lines, and viewpoints.', img: 'https://picsum.photos/id/1055/800/1000', tags: ['europe', 'city'] },
  { id: 'place-8', title: 'Petra, Jordan', desc: 'Ancient city carved into rose-red cliff faces.', img: 'https://picsum.photos/id/1056/800/1000', tags: ['ancient', 'desert'] },
  { id: 'place-9', title: 'Dubrovnik, Croatia', desc: 'Medieval old town surrounded by massive stone walls.', img: 'https://picsum.photos/id/1057/800/1000', tags: ['europe', 'historic'] },
  { id: 'place-10', title: 'Patagonia, Argentina', desc: 'Glaciers, granite peaks, and endless steppe.', img: 'https://picsum.photos/id/1058/800/1000', tags: ['nature', 'wilderness'] },
  { id: 'place-11', title: 'Chefchaouen, Morocco', desc: 'The blue city in the Rif Mountains.', img: 'https://picsum.photos/id/1059/800/1000', tags: ['africa', 'color'] },
  { id: 'place-12', title: 'Bruges, Belgium', desc: 'Medieval canals and cobblestone streets.', img: 'https://picsum.photos/id/1060/800/1000', tags: ['europe', 'canal'] },
  { id: 'place-13', title: 'Cappadocia, Turkey', desc: 'Hot air balloons over fairy chimneys and cave dwellings.', img: 'https://picsum.photos/id/1062/800/1000', tags: ['asia', 'landscape'] },
  { id: 'place-14', title: 'Cinque Terre, Italy', desc: 'Five colorful fishing villages along the Italian Riviera.', img: 'https://picsum.photos/id/1063/800/1000', tags: ['coast', 'europe'] },
];

const shops = [
  { id: 'shop-0', title: 'Shakespeare & Company', desc: 'Legendary English-language bookshop on the banks of the Seine, Paris.', img: 'https://picsum.photos/id/1064/800/1000', tags: ['bookshop', 'paris'] },
  { id: 'shop-1', title: 'Merci', desc: 'A Parisian concept store with fashion, home goods, and a café.', img: 'https://picsum.photos/id/1065/800/1000', tags: ['concept', 'paris'] },
  { id: 'shop-2', title: 'Tsutaya Books Daikanyama', desc: 'A beautifully designed bookstore and lifestyle complex in Tokyo.', img: 'https://picsum.photos/id/1067/800/1000', tags: ['bookshop', 'tokyo'] },
  { id: 'shop-3', title: 'Dover Street Market', desc: 'Multi-brand fashion retail concept by Comme des Garçons.', img: 'https://picsum.photos/id/1068/800/1000', tags: ['fashion', 'london'] },
  { id: 'shop-4', title: 'Aesop Stores', desc: 'Minimalist skincare boutiques with unique architectural designs.', img: 'https://picsum.photos/id/1069/800/1000', tags: ['skincare', 'minimal'] },
  { id: 'shop-5', title: 'Grand Bazaar, Istanbul', desc: 'One of the oldest and largest covered markets in the world.', img: 'https://picsum.photos/id/1070/800/1000', tags: ['market', 'istanbul'] },
  { id: 'shop-6', title: 'Portobello Road Market', desc: 'Iconic London market with antiques, fashion, and street food.', img: 'https://picsum.photos/id/1071/800/1000', tags: ['market', 'london'] },
  { id: 'shop-7', title: 'The Armoury, Hong Kong', desc: 'Classic menswear and bespoke tailoring in Central.', img: 'https://picsum.photos/id/1072/800/1000', tags: ['fashion', 'bespoke'] },
  { id: 'shop-8', title: 'Daikanyama T-Site', desc: 'A cultural complex blending books, music, and film in Tokyo.', img: 'https://picsum.photos/id/1073/800/1000', tags: ['culture', 'tokyo'] },
  { id: 'shop-9', title: 'Hay House Copenhagen', desc: 'Scandinavian design at its finest — furniture, accessories, and interiors.', img: 'https://picsum.photos/id/1074/800/1000', tags: ['design', 'nordic'] },
  { id: 'shop-10', title: 'Flohmarkt am Mauerpark', desc: 'Berlin flea market with vintage finds and live karaoke.', img: 'https://picsum.photos/id/1075/800/1000', tags: ['vintage', 'berlin'] },
  { id: 'shop-11', title: 'Liberty London', desc: 'Heritage department store in a Tudor Revival building.', img: 'https://picsum.photos/id/1076/800/1000', tags: ['department', 'london'] },
  { id: 'shop-12', title: 'Strand Book Store', desc: '18 miles of books in a New York City institution since 1927.', img: 'https://picsum.photos/id/1077/800/1000', tags: ['bookshop', 'nyc'] },
];

const seedInlineContent = (items, type, category, worldId) => {
  items.forEach(item => {
    // Pack specific metadata like genres, locations, tags etc.
    const metadata = JSON.stringify({
      tags: item.tags,
      ...(type === 'tv_show' && { genres: item.tags, synopsis: item.desc }),
      ...(type === 'place' && { location: item.title.split(',')[0], country: item.title.split(',')[1]?.trim() || '', tags: item.tags })
    });
    
    insertContent.run(item.id, type, item.title, item.desc, 'discovery-bot', item.img, category, worldId, metadata);
    if (item.tags) {
      item.tags.forEach(tag => insertTag.run(item.id, tag));
    }
  });
};

seedInlineContent(tvShows, 'tv_show', 'TV', 'w6');
seedInlineContent(places, 'place', 'Travel', 'w7');
seedInlineContent(shops, 'post', 'Lifestyle', 'w8');

// 5. Seed Demo Collections for the demo user
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
    cover_image: 'https://picsum.photos/id/188/800/600',
    items: ['architecture-0', 'architecture-3', 'architecture-7', 'architecture-13', 'architecture-20']
  },
  {
    id: 'col-2',
    title: 'Hidden Destinations',
    description: 'Off-the-beaten-path places that inspire wanderlust.',
    cover_image: 'https://picsum.photos/id/1051/800/600',
    items: ['place-0', 'place-3', 'place-6', 'place-8', 'place-11']
  },
  {
    id: 'col-3',
    title: 'Must-Watch Shows',
    description: 'TV series that define the golden age of television.',
    cover_image: 'https://picsum.photos/id/1031/800/600',
    items: ['tv-0', 'tv-3', 'tv-6', 'tv-9', 'tv-14']
  },
  {
    id: 'col-4',
    title: 'Design Retail',
    description: 'Shops and storefronts with exceptional design sensibility.',
    cover_image: 'https://picsum.photos/id/1065/800/600',
    items: ['shop-1', 'shop-4', 'shop-9']
  },
  {
    id: 'col-5',
    title: 'Nature & Light',
    description: 'Natural landscapes captured in extraordinary light.',
    cover_image: 'https://picsum.photos/id/1053/800/600',
    items: ['place-5', 'place-10', 'nature-0', 'nature-5', 'nature-10']
  },
];

demoCollections.forEach(col => {
  insertCollection.run(col.id, 'u-demo', col.title, col.description, col.cover_image, 0);
  col.items.forEach(itemId => {
    insertCollectionItem.run(col.id, itemId);
  });
});

// 6. Seed some saved items for demo user
const insertSaved = db.prepare(`INSERT OR IGNORE INTO saved_items (user_id, content_id) VALUES (?, ?)`);
['architecture-0', 'architecture-7', 'tv-0', 'tv-6', 'place-0', 'place-3', 'shop-1', 'shop-4'].forEach(id => {
  insertSaved.run('u-demo', id);
});

// 7. Seed demo user preferences
db.prepare(`INSERT OR IGNORE INTO preferences (user_id) VALUES (?)`).run('u-demo');

console.log('Database seeding completed successfully.');
