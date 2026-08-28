import { apiClient } from './client';

export interface CulturalDNAProfile {
  clusters: { tag: string; score: number }[];
  threads: { theme: string; types: string[]; score: number }[];
  emerging: { theme: string; reason: string } | null;
  constant: { theme: string; reason: string } | null;
}

export const dnaApi = {
  getProfile: async (): Promise<CulturalDNAProfile> => {
    return apiClient<CulturalDNAProfile>('/api/me/dna');
  }
};
