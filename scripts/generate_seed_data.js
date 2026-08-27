import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Real titles for specific categories
const BOOKS = [
  "Dune", "1984", "The Great Gatsby", "To Kill a Mockingbird", "Pride and Prejudice", 
  "The Catcher in the Rye", "Fahrenheit 451", "Brave New World", "The Hobbit", "Moby Dick", 
  "Frankenstein", "Dracula", "The Odyssey", "Jane Eyre", "Wuthering Heights", 
  "Crime and Punishment", "The Brothers Karamazov", "Anna Karenina", "War and Peace", "Les Misérables",
  "The Lord of the Rings", "The Hitchhiker's Guide to the Galaxy", "Neuromancer", "Snow Crash", "Foundation",
  "I, Robot", "The Martian Chronicles", "Slaughterhouse-Five", "Catch-22", "One Hundred Years of Solitude",
  "The Bell Jar", "Beloved", "Invisible Man", "The Color Purple", "The Handmaid's Tale",
  "The Alchemist", "The Little Prince", "The Kite Runner", "Life of Pi", "The Book Thief",
  "The Hunger Games", "Harry Potter and the Sorcerer's Stone", "A Game of Thrones", "Outlander", "The Girl with the Dragon Tattoo",
  "Gone Girl", "The Fault in Our Stars", "The Martian", "Ready Player One", "Sapiens",
  "Thinking, Fast and Slow", "Educated", "Becoming", "Born a Crime", "The Glass Castle"
];

const FILMS = [
  "Blade Runner 2049", "Inception", "Interstellar", "The Matrix", "2001: A Space Odyssey",
  "Pulp Fiction", "The Godfather", "The Dark Knight", "Fight Club", "Forrest Gump",
  "The Shawshank Redemption", "Schindler's List", "Goodfellas", "The Lord of the Rings: The Return of the King", "Star Wars: Episode V - The Empire Strikes Back",
  "Spirited Away", "Parasite", "Gladiator", "The Lion King", "Jurassic Park",
  "Terminator 2: Judgment Day", "Back to the Future", "Raiders of the Lost Ark", "Alien", "The Shining",
  "Apocalypse Now", "Casablanca", "Citizen Kane", "Vertigo", "Psycho",
  "Rear Window", "North by Northwest", "Seven Samurai", "City of God", "The Silence of the Lambs",
  "Se7en", "The Usual Suspects", "Memento", "The Prestige", "The Departed",
  "No Country for Old Men", "There Will Be Blood", "Mad Max: Fury Road", "Arrival", "La La Land",
  "Moonlight", "Get Out", "Spider-Man: Into the Spider-Verse", "Avengers: Endgame", "Joker"
];

const TV_SHOWS = [
  "Breaking Bad", "Stranger Things", "The Crown", "Dark", "Chernobyl",
  "Fleabag", "Severance", "The Bear", "Shogun", "Succession",
  "True Detective", "Arcane", "Fargo", "Better Call Saul", "Mr. Robot",
  "Game of Thrones", "The Wire", "The Sopranos", "Mad Men", "The Office",
  "Parks and Recreation", "Arrested Development", "It's Always Sunny in Philadelphia", "Curb Your Enthusiasm", "Veep",
  "Peaky Blinders", "Black Mirror", "The Twilight Zone", "The X-Files", "Twin Peaks",
  "Lost", "The Leftovers", "Watchmen", "Band of Brothers", "The Pacific",
  "Planet Earth", "Cosmos", "Mindhunter", "Hannibal", "Dexter",
  "The Boys", "Invincible", "Rick and Morty", "BoJack Horseman", "Avatar: The Last Airbender",
  "Cowboy Bebop", "Neon Genesis Evangelion", "Attack on Titan", "Death Note", "Fullmetal Alchemist: Brotherhood"
];

const PLACES = [
  "Santorini, Greece", "Kyoto, Japan", "Amalfi Coast, Italy", "Hallstatt, Austria", "Marrakech, Morocco",
  "Banff, Canada", "Reykjavik, Iceland", "Lisbon, Portugal", "Petra, Jordan", "Dubrovnik, Croatia",
  "Patagonia, Argentina", "Chefchaouen, Morocco", "Bruges, Belgium", "Cappadocia, Turkey", "Cinque Terre, Italy",
  "Machu Picchu, Peru", "Taj Mahal, India", "Great Wall of China, China", "Colosseum, Italy", "Chichen Itza, Mexico",
  "Angkor Wat, Cambodia", "Acropolis of Athens, Greece", "Stonehenge, UK", "Pyramids of Giza, Egypt", "Eiffel Tower, France",
  "Statue of Liberty, USA", "Sydney Opera House, Australia", "Mount Fuji, Japan", "Grand Canyon, USA", "Yellowstone, USA",
  "Yosemite, USA", "Zion, USA", "Glacier, USA", "Serengeti, Tanzania", "Galapagos Islands, Ecuador",
  "Bora Bora, French Polynesia", "Maldives", "Seychelles", "Maui, USA", "Bali, Indonesia",
  "Phuket, Thailand", "Palawan, Philippines", "Fiji", "Tahiti, French Polynesia", "Kauai, USA",
  "Prague, Czechia", "Vienna, Austria", "Budapest, Hungary", "Amsterdam, Netherlands", "Venice, Italy"
];


const MUSIC_ALBUMS = [
  "Dark Side of the Moon", "Abbey Road", "Thriller", "Rumours", "Led Zeppelin IV",
  "The Wall", "Hotel California", "Back in Black", "Appetite for Destruction", "Nevermind",
  "OK Computer", "The Joshua Tree", "Ten", "Purple Rain", "Born to Run",
  "London Calling", "Blood on the Tracks", "Highway 61 Revisited", "Pet Sounds", "Revolver",
  "Sgt. Pepper's Lonely Hearts Club Band", "The White Album", "Sticky Fingers", "Exile on Main St.", "Let It Bleed",
  "Who's Next", "Tommy", "The Velvet Underground & Nico", "Are You Experienced", "Electric Ladyland",
  "A Love Supreme", "Kind of Blue", "Time Out", "The Shape of Jazz to Come", "Mingus Ah Um",
  "Bitches Brew", "Head Hunters", "Heavy Weather", "The Koln Concert", "Journey in Satchidananda"
];


const CATEGORIES = {
  books: { query: 'book cover design', count: 50, type: 'book', world: 'w9', titles: BOOKS, category: 'Literature' },
  films: { query: 'cinematic film still poster', count: 50, type: 'film', world: 'w10', titles: FILMS, category: 'Film' },
  'tv-shows': { query: 'television cinematic', count: 50, type: 'tv_show', world: 'w6', titles: TV_SHOWS, category: 'TV' },
  places: { query: 'travel destination landscape', count: 50, type: 'place', world: 'w7', titles: PLACES, category: 'Travel' },
  architecture: { query: 'modern brutalist architecture building', count: 50, type: 'post', world: 'w1', category: 'Visual' },
  photography: { query: 'editorial portrait street photography', count: 50, type: 'post', world: 'w13', category: 'Visual' },
  art: { query: 'modern contemporary abstract art', count: 50, type: 'post', world: 'w10', category: 'Visual' },
  design: { query: 'industrial product furniture design', count: 50, type: 'post', world: 'w11', category: 'Visual' },
  typography: { query: 'typography poster layout design', count: 30, type: 'post', world: 'w3', category: 'Visual' },
  'sci-fi': { query: 'cyberpunk sci-fi futuristic concept art', count: 30, type: 'post', world: 'w4', category: 'Concept' },
  nature: { query: 'epic nature landscape majestic', count: 30, type: 'post', world: 'w5', category: 'Visual' },
  fashion: { query: 'avant-garde fashion runway editorial', count: 30, type: 'post', world: 'w14', category: 'Visual' },
  music: { query: 'vinyl album cover art music', count: 30, type: 'music', world: 'w12', titles: MUSIC_ALBUMS, category: 'Music' }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchUnsplashImages(query, count) {
  const images = [];
  let page = 1;
  const perPage = 30; // Unsplash NAPI max per page is usually 30
  
  while (images.length < count) {
    try {
      console.log(`Fetching page ${page} for ${query}...`);
      const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`);
      
      if (!res.ok) {
        console.warn(`Failed to fetch page ${page} for ${query}: ${res.status}`);
        break;
      }
      
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        break;
      }
      
      data.results.forEach(img => {
        if (images.length < count) {
          images.push(img);
        }
      });
      
      page++;
      await delay(1500); // polite delay
    } catch (e) {
      console.error(`Error fetching for ${query}:`, e);
      break;
    }
  }
  return images;
}

function generateMetadata(type, title, imgDesc) {
  if (type === 'tv_show') return { genres: ['drama', 'thriller'], synopsis: imgDesc || 'A critically acclaimed television series.' };
  if (type === 'film') return { genres: ['cinema'], director: 'Various', year: 2000 + Math.floor(Math.random() * 20) };
  if (type === 'book') return { author: 'Various Authors', year: 1900 + Math.floor(Math.random() * 120) };
  if (type === 'place') return { location: title.split(',')[0], country: title.split(',')[1]?.trim() || 'Unknown' };
  if (type === 'music') return { artist: 'Various Artists', album: title, year: 1970 + Math.floor(Math.random() * 50) };
  return null;
}

async function main() {
  const outDir = path.resolve(__dirname, '../public/packs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const [slug, config] of Object.entries(CATEGORIES)) {
    console.log(`Generating pack for: ${slug}`);
    
    // Check if file already exists to avoid re-fetching if testing
    // We want to overwrite in this case to ensure full 50+
    const filePath = path.join(outDir, `${slug}.json`);
    
    const unsplashImages = await fetchUnsplashImages(config.query, config.count);
    
    const items = unsplashImages.map((uImg, i) => {
      // Use hardcoded title if available, otherwise generate a clean descriptive title from Unsplash or generic
      let title = config.titles ? (config.titles[i] || `${slug} #${i}`) : (uImg.description || uImg.alt_description || `${slug} ${i + 1}`);
      // Clean title
      title = title ? (title.length > 50 ? title.substring(0, 47) + '...' : title) : `${slug} #${i}`;
      title = title.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' '); // Title case
      
      const desc = uImg.alt_description || uImg.description || `High-quality ${slug} content.`;
      
      return {
        id: `${slug}-${i}`,
        title: title,
        description: desc,
        imageUrl: `${uImg.urls.raw}&q=80&w=2000&auto=format&fit=crop`,
        category: config.category,
        tags: [slug, 'curated', config.type],
        creatorId: 'discovery-bot',
        metadata: generateMetadata(config.type, title, desc),
        likes: Math.floor(Math.random() * 1000),
        saves: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
      };
    });

    // If we didn't get enough images, fill the rest with generic picsum deterministic seed
    let i = items.length;
    while (i < config.count) {
      let title = config.titles ? (config.titles[i] || `${slug} #${i}`) : `${slug.charAt(0).toUpperCase() + slug.slice(1)} ${i + 1}`;
      items.push({
        id: `${slug}-${i}`,
        title: title,
        description: `Curated ${slug} content.`,
        imageUrl: `https://picsum.photos/seed/${slug}-${i}/2000/2500`,
        category: config.category,
        tags: [slug, 'curated', config.type],
        creatorId: 'discovery-bot',
        metadata: generateMetadata(config.type, title, `Curated ${slug} content.`),
        likes: Math.floor(Math.random() * 1000),
        saves: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
      });
      i++;
    }

    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
    console.log(`Saved ${items.length} items to ${filePath}`);
  }
  console.log('Finished generating seed data.');
}

main().catch(console.error);
