import db from '../server/db.js';
import crypto from 'crypto';

console.log('Seeding Connected Experiences for demo user...');

const demoUserId = 'u-demo';

// Clear existing experiences for demo user to ensure idempotency
db.prepare(`DELETE FROM experiences WHERE user_id = ?`).run(demoUserId);

// Helper function to seed an experience
function seedExperience(title, description, events) {
  const expId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO experiences (id, user_id, title, description)
    VALUES (?, ?, ?, ?)
  `).run(expId, demoUserId, title, description);
  
  events.forEach((ev) => {
    const eventId = crypto.randomUUID();
    
    // Check if content exists, if not, mock it
    const contentExists = db.prepare(`SELECT id FROM content WHERE id = ?`).get(ev.contentId);
    if (!contentExists) {
      db.prepare(`
        INSERT INTO content (id, type, title, creator, category, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ev.contentId, ev.mock.type, ev.mock.title, ev.mock.creator, ev.mock.category, ev.mock.imageUrl);
    }

    db.prepare(`
      INSERT INTO experience_events (id, experience_id, content_id, event_type, event_at, location_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(eventId, expId, ev.contentId, ev.eventType, ev.eventAt, ev.locationName || null);
  });
  
  console.log(`Seeded: ${title}`);
}

// 1. The Odyssey
seedExperience(
  'The Odyssey',
  'An epic journey across literature, cinema, and the ancient world.',
  [
    {
      contentId: 'odyssey-book',
      eventType: 'Read',
      eventAt: '2026-01-12T22:43:00Z',
      mock: { type: 'book', title: 'The Odyssey', creator: 'Homer', category: 'Literature', imageUrl: 'https://images.unsplash.com/photo-1544716278-e513176f20b5' }
    },
    {
      contentId: 'odyssey-film',
      eventType: 'Watched',
      eventAt: '2026-01-18T20:15:00Z',
      mock: { type: 'film', title: 'The Odyssey', creator: 'Andrei Konchalovsky', category: 'Cinema', imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728' }
    },
    {
      contentId: 'athens-place',
      eventType: 'Visited',
      eventAt: '2026-02-24T16:32:00Z',
      locationName: 'Athens, Greece',
      mock: { type: 'place', title: 'Athens', creator: 'History', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235' }
    }
  ]
);

// 2. Dune
seedExperience(
  'Dune',
  'The spice must flow. Exploring the world of Arrakis.',
  [
    {
      contentId: 'dune-book',
      eventType: 'Read',
      eventAt: '2025-11-05T10:00:00Z',
      mock: { type: 'book', title: 'Dune', creator: 'Frank Herbert', category: 'Sci-Fi', imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2' }
    },
    {
      contentId: 'dune-film',
      eventType: 'Watched',
      eventAt: '2025-11-20T21:30:00Z',
      mock: { type: 'film', title: 'Dune: Part One', creator: 'Denis Villeneuve', category: 'Cinema', imageUrl: 'https://images.unsplash.com/photo-1547234935-80b7145b0d58' }
    },
    {
      contentId: 'wadi-rum-place',
      eventType: 'Visited',
      eventAt: '2026-03-10T14:00:00Z',
      locationName: 'Wadi Rum, Jordan',
      mock: { type: 'place', title: 'Wadi Rum', creator: 'Nature', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1550935515-58589a117b35' }
    }
  ]
);

// 3. Before Sunrise
seedExperience(
  'Before Sunrise',
  'A romantic walk through the streets of Vienna.',
  [
    {
      contentId: 'before-sunrise-film',
      eventType: 'Watched',
      eventAt: '2024-06-14T20:00:00Z',
      mock: { type: 'film', title: 'Before Sunrise', creator: 'Richard Linklater', category: 'Cinema', imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26' }
    },
    {
      contentId: 'vienna-place',
      eventType: 'Visited',
      eventAt: '2024-08-02T18:45:00Z',
      locationName: 'Vienna, Austria',
      mock: { type: 'place', title: 'Vienna', creator: 'History', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af' }
    }
  ]
);

// 4. Tokyo Through Design
seedExperience(
  'Tokyo Through Design',
  'Minimalist aesthetics and urban exploration.',
  [
    {
      contentId: 'japanese-design',
      eventType: 'Discovered',
      eventAt: '2025-02-10T09:15:00Z',
      mock: { type: 'post', title: 'Japanese Minimalism', creator: 'Kenya Hara', category: 'Design', imageUrl: 'https://images.unsplash.com/photo-1490196294797-1563721389e6' }
    },
    {
      contentId: 'tokyo-architecture',
      eventType: 'Explored',
      eventAt: '2025-05-15T11:30:00Z',
      mock: { type: 'post', title: 'Tokyo Architecture', creator: 'Tadao Ando', category: 'Architecture', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf' }
    },
    {
      contentId: 'tokyo-place',
      eventType: 'Visited',
      eventAt: '2025-10-05T20:00:00Z',
      locationName: 'Tokyo, Japan',
      mock: { type: 'place', title: 'Tokyo', creator: 'Urban', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26' }
    }
  ]
);

// 5. A Night in New York
seedExperience(
  'A Night in New York',
  'Jazz, streets, and the city that never sleeps.',
  [
    {
      contentId: 'jazz-album',
      eventType: 'Listened',
      eventAt: '2023-11-20T22:00:00Z',
      mock: { type: 'music', title: 'Kind of Blue', creator: 'Miles Davis', category: 'Music', imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629' }
    },
    {
      contentId: 'nyc-place',
      eventType: 'Visited',
      eventAt: '2023-12-15T19:30:00Z',
      locationName: 'New York, USA',
      mock: { type: 'place', title: 'New York', creator: 'Urban', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9' }
    }
  ]
);

// 6. Paris / Art Trail
seedExperience(
  'Paris / Art Trail',
  'Following the brushstrokes of the Impressionists.',
  [
    {
      contentId: 'monet-artwork',
      eventType: 'Discovered',
      eventAt: '2025-04-10T14:20:00Z',
      mock: { type: 'post', title: 'Water Lilies', creator: 'Claude Monet', category: 'Art', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5' }
    },
    {
      contentId: 'louvre-museum',
      eventType: 'Visited',
      eventAt: '2025-06-20T10:00:00Z',
      locationName: 'The Louvre, Paris',
      mock: { type: 'place', title: 'The Louvre', creator: 'History', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a' }
    },
    {
      contentId: 'paris-place',
      eventType: 'Visited',
      eventAt: '2025-06-22T16:45:00Z',
      locationName: 'Paris, France',
      mock: { type: 'place', title: 'Paris', creator: 'Urban', category: 'Place', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e907a5ea82c' }
    }
  ]
);

console.log('Connected Experiences seeded successfully.');
