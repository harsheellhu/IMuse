export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
}

export interface Post {
  id: string;
  type: 'image' | 'book' | 'film' | 'link' | 'text' | 'tv-show' | 'tv_show' | 'place' | 'collection' | string;
  title?: string;
  description?: string;
  imageUrl?: string;
  creatorId: string;
  source?: string;
  tags: string[];
  category: string;
  collectionId?: string;
  likes: number;
  saves: number;
  comments: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  creatorId: string;
  itemCount: number;
  followers: number;
  isPrivate: boolean;
  tags: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  publicationYear: number;
  description: string;
  categories: string[];
  averageRating: number;
  ratingsCount: number;
}

export interface Film {
  id: string;
  title: string;
  director?: string;
  posterImage?: string;
  backdropImage?: string;
  imageUrl?: string;
  releaseYear?: number;
  genres?: string[];
  tags?: string[];
  runtime?: number;
  synopsis?: string;
  averageRating?: number;
}

export interface TvShow {
  id: string;
  title: string;
  creator?: string;
  posterImage?: string;
  backdropImage?: string;
  imageUrl?: string;
  releaseYear?: number;
  genres?: string[];
  tags?: string[];
  synopsis?: string;
  averageRating?: number;
}

export interface Place {
  id: string;
  title: string;
  name?: string;
  location?: string;
  country?: string;
  coverImage?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  duration: number;
  artworkUrl?: string;
  addedAt: string;
  playCount: number;
  lastPlayed?: string;
  isFavorite: boolean;
  blobId?: string; // Reference to the actual audio blob in IndexedDB
  lyrics?: { time: number; text: string }[];
}

export interface LocalTrack extends Song {
  file: File;
  addedAt: string;
  isFavorite: boolean;
  blobId?: string; // Reference to the actual audio blob in IndexedDB
  lyrics?: { time: number; text: string }[];
}

export interface LandingFeature {
  id: string;
  title: string;
  category: string;
  description?: string;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  image: {
    thumbnailUrl: string;
    previewUrl: string;
    fullUrl: string;
    mobileUrl?: string;
    width: number;
    height: number;
    alt: string;
    source?: string;
  };
}

export interface ExperienceEvent {
  id: string;
  experienceId: string;
  contentId: string;
  eventType: string; // 'Read', 'Watched', 'Visited', 'Listened', 'Started Reading', etc.
  eventAt: string; // ISO date string
  datePrecision: 'year' | 'month' | 'day' | 'exact';
  locationName?: string;
  city?: string;
  country?: string;
  note?: string;
  // joined fields
  contentTitle?: string;
  contentType?: string;
  contentCategory?: string;
  creator?: string;
  imageUrl?: string;
}

export interface ExperienceLink {
  id: string;
  experienceId: string;
  sourceContentId: string;
  targetContentId: string;
  relationshipType: string;
  confidence: 'exact' | 'strong' | 'possible';
  sourceTitle?: string;
  targetTitle?: string;
  targetImage?: string;
  targetId?: string;
}

export interface Experience {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'suggested' | 'archived';
  events?: ExperienceEvent[];
  suggestions?: ExperienceLink[];
  updatedAt: string;
}

