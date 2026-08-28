import { apiClient } from './client';

export interface PatternBreakdown {
  books: number;
  films: number;
  tv_shows: number;
  places: number;
  images: number;
  songs: number;
}

export interface Pattern {
  id: string;
  theme: string;
  totalCount: number;
  breakdown: PatternBreakdown;
  covers: string[];
  reason: string;
}

export interface ReplayMetrics {
  films: number;
  books: number;
  tv: number;
  places: number;
  savedImages: number;
}

export interface ReplayEvent {
  event_at: string;
  event_type: string;
  title: string;
  image_url: string;
  content_type: string;
}

export interface ReplayTimelineMonth {
  month: number;
  shift: string;
  items: ReplayEvent[];
}

export interface CulturalReplay {
  year: string;
  metrics: ReplayMetrics;
  timeline: ReplayTimelineMonth[];
  topThemes: string[];
}

export const activityApi = {
  getPatterns: async (): Promise<Pattern[]> => {
    return apiClient<Pattern[]>('/api/me/patterns');
  },

  getPatternThread: async (id: string) => {
    return apiClient<any>(`/api/me/patterns/${id}`);
  },

  getCulturalReplay: async (year: string): Promise<CulturalReplay> => {
    return apiClient<CulturalReplay>(`/api/me/replay/${year}`);
  }
};
