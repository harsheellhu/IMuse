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
  type: 'image' | 'book' | 'film' | 'link' | 'text';
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
}
