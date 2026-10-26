import { apiClient } from './client';
import { Trail, TrailStep } from '../types';

export const trailsApi = {
  getAll: () => apiClient<Trail[]>('/api/me/trails'),

  getById: (id: string) => apiClient<Trail>(`/api/me/trails/${id}`),

  create: (data: {
    title: string;
    description?: string;
    coverImage?: string;
    theme?: string;
    status?: 'draft' | 'completed';
    steps?: Partial<TrailStep>[];
  }) =>
    apiClient<Trail>('/api/me/trails', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id: string, data: Partial<Trail> & { steps?: any[] }) =>
    apiClient<{ success: boolean; id: string }>(`/api/me/trails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/api/me/trails/${id}`, {
      method: 'DELETE'
    }),

  duplicate: (id: string) =>
    apiClient<{ success: boolean; id: string; title: string }>(`/api/me/trails/${id}/duplicate`, {
      method: 'POST'
    }),

  addStep: (trailId: string, data: { contentId: string; annotation?: string; connectionType?: string; connectionText?: string }) =>
    apiClient<{ success: boolean; stepId: string; stepOrder: number }>(`/api/me/trails/${trailId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
