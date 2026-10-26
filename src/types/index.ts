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

export type CollectionType = 'manual' | 'smart' | 'hybrid';
export type CollectionMatchOperator = 'all' | 'any';
export type CollectionLayout = 'grid' | 'masonry' | 'editorial' | 'moodboard';

export interface SmartRule {
  id?: string;
  field: 'type' | 'category' | 'tag' | 'text' | 'creator' | 'year' | 'rating' | 'saved' | 'color';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'between' | 'is_saved' | 'is_not_saved' | 'is_not_empty';
  value?: any;
  secondValue?: any;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  creatorId?: string;
  itemCount: number;
  followers?: number;
  isPrivate: boolean;
  tags?: string[];
  type?: CollectionType;
  matchOperator?: CollectionMatchOperator;
  rules?: SmartRule[];
  pinnedIds?: string[];
  excludedIds?: string[];
  manualOrder?: string[];
  layout?: CollectionLayout;
  createdAt?: string;
  updatedAt?: string;
  items?: any[];
}

export type TrailConnectionType = 
  | 'inspired_by'
  | 'created_by'
  | 'adaptation_of'
  | 'set_in'
  | 'related_to'
  | 'similar_atmosphere'
  | 'personal_association'
  | 'leads_to'
  | 'custom';

export interface TrailStep {
  id: string;
  trailId?: string;
  contentId: string;
  stepOrder: number;
  annotation: string;
  connectionType: TrailConnectionType;
  connectionText?: string;
  createdAt?: string;
  artifact?: any;
}

export interface Trail {
  id: string;
  userId?: string;
  title: string;
  description: string;
  coverImage?: string;
  theme?: string;
  status: 'draft' | 'completed';
  stepCount?: number;
  steps?: TrailStep[];
  createdAt?: string;
  updatedAt?: string;
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

