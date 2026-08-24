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
  director: string;
  posterImage: string;
  backdropImage: string;
  releaseYear: number;
  genres: string[];
  runtime: number;
  synopsis: string;
  averageRating: number;
}
