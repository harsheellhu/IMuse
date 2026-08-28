import { apiClient } from './client';

export const engineApi = {
  getUniverse: async (contentId: string) => {
    return apiClient<any>(`/api/engine/universe/${contentId}`);
  },

  getSerendipityLeap: async (contentId: string, level: string = 'unexpected') => {
    return apiClient<any>(`/api/engine/serendipity?from=${contentId}&level=${level}`);
  },

  saveSerendipityTrail: async (thread: any[]) => {
    return apiClient<any>('/api/engine/serendipity/save', {
      method: 'POST',
      body: JSON.stringify({ thread })
    });
  },

  getColorMemory: async (period: string = 'year') => {
    return apiClient<any>(`/api/engine/color-memory?period=${period}`);
  }
};
