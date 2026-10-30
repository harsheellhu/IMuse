/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unified Discovery Engine for iMuse
 * Unifies Atmosphere Search and Color Search into a single cohesive pipeline
 * with tunable balance, category filtering, scope management, sorting,
 * and search history persistence.
 */

import { 
  AtmosphereConcept, 
  extractQueryAtmosphereConcepts, 
  evaluateArtifactAtmosphere, 
  ALL_CONCEPTS 
} from './atmosphereSearch';
import { 
  ColorMatchMode, 
  ColorMatchResult, 
  matchPalette, 
  extractArtifactColors, 
  findClosestColorFamily 
} from './colorSearch';
import { Post, Book, Film, Collection, TvShow, Place, Song } from '../types';

export type DiscoveryArtifactType = 'post' | 'book' | 'film' | 'tv_show' | 'place' | 'song' | 'collection';

export interface UnifiedArtifact {
  id: string;
  type: DiscoveryArtifactType;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  creator?: string;
  category?: string;
  tags?: string[];
  palette?: string[];
  isSaved?: boolean;
  rawData: Post | Book | Film | Collection | TvShow | Place | Song | any;
}

export interface DiscoverySearchResult {
  artifact: UnifiedArtifact;
  atmosphereScore: number;
  colorScore: number;
  combinedScore: number;
  isAtmosphereMatch: boolean;
  isColorMatch: boolean;
  reasons: string[];
  closestColor?: string;
}

export interface DiscoverySearchOptions {
  query?: string;
  selectedConcepts?: string[]; // Concept IDs
  colors?: string[]; // Hex colors
  colorMatchMode?: ColorMatchMode;
  colorThreshold?: number; // 0.1 to 0.5 (default 0.28)
  colorWeight?: number; // 0.0 (100% atmosphere) to 1.0 (100% color), default 0.5
  category?: DiscoveryArtifactType | 'all';
  scope?: 'all' | 'library';
  savedIds?: string[];
  sortBy?: 'relevance' | 'newest' | 'title';
  limit?: number;
}

export interface DiscoveryHistoryEntry {
  id: string;
  timestamp: number;
  query: string;
  selectedConcepts: string[];
  colors: string[];
}

const HISTORY_STORAGE_KEY = 'imuse_discovery_history';

/**
 * Normalizes different catalog item models into a clean UnifiedArtifact
 */
export function normalizeCatalogItem(
  item: any, 
  type: DiscoveryArtifactType, 
  savedIds: string[] = []
): UnifiedArtifact {
  let title = '';
  let subtitle = '';
  let image = '';
  let description = '';
  let creator = '';
  let category = '';
  let tags: string[] = [];
  let palette: string[] = [];

  const isSaved = savedIds.includes(item.id);

  if (type === 'post') {
    const post = item as Post;
    title = post.title || 'Untitled Visual';
    image = post.imageUrl || (post as any).image_url || '';
    category = post.category || 'Visual';
    creator = (post as any).author?.name || (post as any).creator || '';
    description = post.description || (post as any).caption || '';
    tags = post.tags || [];
    subtitle = `${category}${tags.length > 0 ? ` · ${tags[0]}` : ''}`;
    palette = extractArtifactColors((post as any).metadata?.palette || (post as any).palette);
  } else if (type === 'book') {
    const book = item as Book;
    title = book.title;
    image = book.coverImage || (book as any).image_url || '';
    creator = book.author;
    category = 'Literature';
    description = book.description || (book as any).synopsis || '';
    tags = book.categories || (book as any).genres || [];
    subtitle = `Book by ${book.author}`;
    palette = extractArtifactColors((book as any).metadata?.palette || (book as any).palette);
  } else if (type === 'film') {
    const film = item as Film;
    title = film.title;
    image = film.posterImage || film.imageUrl || (film as any).image_url || '';
    creator = film.director || '';
    category = 'Cinema';
    description = film.synopsis || (film as any).description || '';
    tags = film.genres || film.tags || [];
    subtitle = `Film by ${film.director || 'Unknown'}${film.releaseYear ? ` (${film.releaseYear})` : ''}`;
    palette = extractArtifactColors((film as any).metadata?.palette || (film as any).palette);
  } else if (type === 'tv_show') {
    const show = item as TvShow;
    title = show.title;
    image = show.posterImage || show.imageUrl || (show as any).image_url || '';
    creator = show.creator || '';
    category = 'Television';
    description = show.synopsis || (show as any).description || '';
    tags = show.tags || show.genres || [];
    subtitle = `Series${show.creator ? ` · ${show.creator}` : ''}`;
    palette = extractArtifactColors((show as any).metadata?.palette || (show as any).palette);
  } else if (type === 'place') {
    const place = item as Place;
    title = place.name || place.title || 'Place';
    image = place.coverImage || place.imageUrl || (place as any).image_url || '';
    creator = place.location || (place as any).metadata?.location || '';
    category = 'Space';
    description = place.description || '';
    tags = place.tags || [];
    subtitle = place.location ? `Space in ${place.location}` : 'Space';
    palette = extractArtifactColors((place as any).metadata?.palette || (place as any).palette);
  } else if (type === 'song') {
    const song = item as Song;
    title = song.title;
    image = song.artworkUrl || '';
    creator = song.artist;
    category = 'Music';
    description = song.album ? `Album: ${song.album}` : (song.genre || '');
    tags = song.genre ? [song.genre] : [];
    subtitle = `Music · ${song.artist}`;
    palette = extractArtifactColors((song as any).palette);
  } else if (type === 'collection') {
    const col = item as Collection;
    title = col.title;
    image = col.coverImage || (col as any).imageUrl || '';
    creator = (col as any).author?.name || col.creatorId || '';
    category = 'Collection';
    description = col.description || '';
    subtitle = `Collection · ${col.itemCount || 0} items`;
    palette = extractArtifactColors((col as any).palette);
  }

  return {
    id: item.id,
    type,
    title,
    subtitle,
    image,
    description,
    creator,
    category,
    tags,
    palette,
    isSaved,
    rawData: item
  };
}

/**
 * Main Unified Discovery Search Function
 */
export function searchDiscovery(
  catalog: UnifiedArtifact[],
  options: DiscoverySearchOptions = {}
): DiscoverySearchResult[] {
  const {
    query = '',
    selectedConcepts = [],
    colors = [],
    colorMatchMode = 'any',
    colorThreshold = 0.28,
    colorWeight = 0.5,
    category = 'all',
    scope = 'all',
    savedIds = [],
    sortBy = 'relevance',
    limit = 60
  } = options;

  const cleanQuery = query.trim();
  const hasAtmosphere = cleanQuery.length > 0 || selectedConcepts.length > 0;
  const hasColors = colors.length > 0;

  // If no filters are provided, return empty set (no fake results)
  if (!hasAtmosphere && !hasColors && category === 'all' && scope === 'all') {
    return [];
  }

  // Map concept IDs to canonical concepts
  const explicitConcepts: AtmosphereConcept[] = selectedConcepts
    .map(id => ALL_CONCEPTS.find(c => c.id === id))
    .filter(Boolean) as AtmosphereConcept[];

  const results: DiscoverySearchResult[] = [];

  for (const artifact of catalog) {
    // 1. Scope filter (library vs all)
    if (scope === 'library') {
      const isSaved = artifact.isSaved || savedIds.includes(artifact.id);
      if (!isSaved) continue;
    }

    // 2. Category filter
    if (category !== 'all' && artifact.type !== category) {
      continue;
    }

    let atmoScore = 0;
    let isAtmoMatch = false;
    let atmoReasons: string[] = [];

    // 3. Atmosphere Scoring
    if (hasAtmosphere) {
      const atmoRes = evaluateArtifactAtmosphere(cleanQuery, {
        id: artifact.id,
        type: artifact.type,
        title: artifact.title,
        description: artifact.description,
        tags: artifact.tags,
        category: artifact.category,
        creator: artifact.creator,
        location: artifact.creator,
        metadata: artifact.rawData?.metadata
      }, explicitConcepts);

      atmoScore = atmoRes.score;
      isAtmoMatch = atmoRes.isMatch;
      atmoReasons = atmoRes.reasons;
    }

    // 4. Color Matching
    let colorScore = 0;
    let isColorMatch = false;
    let closestColorHex: string | undefined = undefined;
    const colorReasons: string[] = [];

    if (hasColors) {
      const artifactColors = artifact.palette || [];
      if (artifactColors.length > 0) {
        const colorRes: ColorMatchResult = matchPalette(
          colors, 
          artifactColors, 
          colorMatchMode, 
          colorThreshold
        );

        colorScore = colorRes.score;
        isColorMatch = colorRes.isMatch;
        closestColorHex = colorRes.closestColor;

        if (colorRes.isMatch) {
          const pct = Math.round(colorScore * 100);
          const family = findClosestColorFamily(colorRes.closestColor);
          colorReasons.push(`${pct}% palette match (${family.name})`);
        }
      }
    }

    // 5. Combined Scoring & Filtering Logic
    let combinedScore = 0;
    let shouldInclude = false;

    if (hasAtmosphere && hasColors) {
      // Both modes active
      const wColor = Math.min(1.0, Math.max(0.0, colorWeight));
      const wAtmo = 1.0 - wColor;

      combinedScore = (wAtmo * atmoScore) + (wColor * colorScore);
      // Include if it matches either strongly, or both moderately
      shouldInclude = (isAtmoMatch && isColorMatch) || 
                      (isAtmoMatch && atmoScore >= 0.45) || 
                      (isColorMatch && colorScore >= 0.5);
    } else if (hasAtmosphere) {
      combinedScore = atmoScore;
      shouldInclude = isAtmoMatch || atmoScore >= 0.25;
    } else if (hasColors) {
      combinedScore = colorScore;
      shouldInclude = isColorMatch || colorScore >= 0.35;
    } else {
      // Category or Scope only
      combinedScore = 0.5;
      shouldInclude = true;
    }

    if (shouldInclude) {
      const combinedReasons = [...atmoReasons, ...colorReasons];
      results.push({
        artifact,
        atmosphereScore: atmoScore,
        colorScore,
        combinedScore,
        isAtmosphereMatch: isAtmoMatch,
        isColorMatch,
        reasons: combinedReasons,
        closestColor: closestColorHex
      });
    }
  }

  // 6. Sorting
  if (sortBy === 'relevance') {
    results.sort((a, b) => b.combinedScore - a.combinedScore);
  } else if (sortBy === 'newest') {
    results.sort((a, b) => {
      const timeA = new Date(a.artifact.rawData?.created_at || 0).getTime();
      const timeB = new Date(b.artifact.rawData?.created_at || 0).getTime();
      return timeB - timeA;
    });
  } else if (sortBy === 'title') {
    results.sort((a, b) => a.artifact.title.localeCompare(b.artifact.title));
  }

  return results.slice(0, limit);
}

// ==========================================
// SEARCH HISTORY MANAGEMENT
// ==========================================

export function loadSearchHistory(): DiscoveryHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSearchHistoryEntry(entry: Omit<DiscoveryHistoryEntry, 'id' | 'timestamp'>): void {
  try {
    if (!entry.query && entry.selectedConcepts.length === 0 && entry.colors.length === 0) {
      return;
    }

    const history = loadSearchHistory();
    // Avoid duplicate queries at the top
    const filtered = history.filter(h => 
      h.query !== entry.query || 
      h.colors.join(',') !== entry.colors.join(',')
    );

    const newEntry: DiscoveryHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      ...entry
    };

    const updated = [newEntry, ...filtered].slice(0, 10);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {}
}
