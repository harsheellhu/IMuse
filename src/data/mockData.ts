import { User, Post, Collection, Book, Film } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Rivera',
  username: 'arivera',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  bio: 'Curating architecture, design, and visual culture.',
  followers: 1240,
  following: 342,
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Elena Rostova',
    username: 'erostova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=webp&fit=crop&q=80&w=150',
    bio: 'Photographer and film enthusiast.',
    followers: 8900,
    following: 120,
  },
  {
    id: 'u3',
    name: 'Marcus Chen',
    username: 'marcusc',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=webp&fit=crop&q=80&w=150',
    bio: 'Industrial design and typography.',
    followers: 450,
    following: 200,
  },
];

// Curated high-quality Unsplash keywords/IDs to generate a large dataset
const imageCategories = [
  'architecture', 'minimalism', 'brutalism', 'interior', 'furniture', 
  'typography', 'graphic+design', 'editorial', 'fashion', 'abstract',
  'nature', 'landscape', 'cityscape', 'sculpture', 'art', 'film', 
  'texture', 'light', 'shadow', 'geometric'
];

export const mockPosts: Post[] = Array.from({ length: 300 }).map((_, i) => {
  const category = imageCategories[i % imageCategories.length];
  // Varying dimensions for masonry/spatial layout
  const width = 600 + (i % 3) * 200;
  const height = 400 + (i % 4) * 200;
  
  return {
    id: `p${i + 1}`,
    type: 'image',
    title: `${category.replace('+', ' ').toUpperCase()} Study ${i + 1}`,
    creatorId: i % 2 === 0 ? 'u1' : (i % 3 === 0 ? 'u2' : 'u3'),
    imageUrl: `https://source.unsplash.com/random/${width}x${height}/?${category}&sig=${i}`,
    tags: [category, 'inspiration', 'curated'],
    category: category.replace('+', ' '),
    likes: Math.floor(Math.random() * 1000),
    saves: Math.floor(Math.random() * 500),
    comments: Math.floor(Math.random() * 50),
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  };
});

// Since source.unsplash.com is deprecated, we will use specific IDs or reliable keywords
// Actually, images.unsplash.com with random IDs is better.
const curatedImageIds = [
  "1600585154340-be6161a56a0c", "1600210492486-724fe5c67fb0", "1610701596007-11502861dcfa",
  "1542051812871-757500d5a452", "1561070791-2526d30994b5", "1497366216548-37526070297c",
  "1485846234645-a62644f84728", "1516224498413-84ecf3a1e7fc", "1544947950-fa07a98d237f",
  "1589829085413-56de8ae18c73", "1536440136628-849c177e76a1", "1518098268026-4e89f1a2cd8e",
  "1501162943158-75b4dcbd150d", "1479839672679-a4648f62a27b", "1513694203232-719a280e022f"
];

mockPosts.forEach((post, i) => {
  const id = curatedImageIds[i % curatedImageIds.length];
  const aspect = (i % 3 === 0) ? '3/4' : (i % 2 === 0) ? '1/1' : '16/9';
  let w = 800, h = 800;
  if (aspect === '3/4') h = 1066;
  if (aspect === '16/9') h = 450;
  post.imageUrl = `https://images.unsplash.com/photo-${id}?fm=webp&fit=crop&q=80&w=${w}&h=${h}&sig=${i}`;
});


export const mockCollections: Collection[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `c${i + 1}`,
  title: `Curated Space ${i + 1}`,
  description: 'An exploration of visual culture.',
  coverImage: mockPosts[i * 5 % mockPosts.length].imageUrl,
  creatorId: 'u1',
  itemCount: Math.floor(Math.random() * 100) + 10,
  followers: Math.floor(Math.random() * 5000),
  isPrivate: false,
  tags: ['Curated', 'Inspiration'],
}));

export const mockBooks: Book[] = [
  {
    id: 'b1',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?fm=webp&fit=crop&q=80&w=400',
    publicationYear: 1988,
    description: 'A primer on how and why some products satisfy customers while others only frustrate them.',
    categories: ['Design', 'Psychology', 'Technology'],
    averageRating: 4.5,
    ratingsCount: 2431,
  },
  {
    id: 'b2',
    title: 'Ways of Seeing',
    author: 'John Berger',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?fm=webp&fit=crop&q=80&w=400',
    publicationYear: 1972,
    description: 'A revolutionary look at how we view art and the world.',
    categories: ['Art', 'Philosophy', 'Culture'],
    averageRating: 4.7,
    ratingsCount: 5120,
  }
];

// Pad books to have more items
for(let i=3; i<=30; i++) {
  mockBooks.push({
    ...mockBooks[i%2],
    id: `b${i}`,
    title: `Cultural Monograph Vol ${i}`,
    coverImage: mockPosts[(i+10) % mockPosts.length].imageUrl,
  });
}

export const mockFilms: Film[] = [
  {
    id: 'f1',
    title: 'In the Mood for Love',
    director: 'Wong Kar-wai',
    posterImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?fm=webp&fit=crop&q=80&w=400',
    backdropImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?fm=webp&fit=crop&q=80&w=1200',
    releaseYear: 2000,
    genres: ['Romance', 'Drama'],
    runtime: 98,
    synopsis: 'Two neighbors, a woman and a man, form a strong bond after both suspect extramarital activities of their spouses.',
    averageRating: 4.8,
  },
  {
    id: 'f2',
    title: 'Perfect Days',
    director: 'Wim Wenders',
    posterImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?fm=webp&fit=crop&q=80&w=400',
    backdropImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?fm=webp&fit=crop&q=80&w=1200',
    releaseYear: 2023,
    genres: ['Drama'],
    runtime: 124,
    synopsis: 'Hirayama seems utterly content with his simple life as a cleaner of toilets in Tokyo.',
    averageRating: 4.6,
  }
];

// Pad films to have more items
for(let i=3; i<=30; i++) {
  mockFilms.push({
    ...mockFilms[i%2],
    id: `f${i}`,
    title: `Cinema Study ${i}`,
    posterImage: mockPosts[(i+20) % mockPosts.length].imageUrl,
  });
}

