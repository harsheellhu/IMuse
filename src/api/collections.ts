import { apiClient } from './client';
import { Collection, SmartRule, CollectionMatchOperator } from '../types';

export const collectionsApi = {
  getAll: () => apiClient<Collection[]>('/api/me/collections'),
  
  getById: (id: string) => apiClient<Collection>(`/api/me/collections/${id}`),

  getItems: (id: string) => apiClient<any[]>(`/api/me/collections/${id}/items`),

  create: (data: {
    title: string;
    description?: string;
    cover_image?: string;
    is_private?: boolean;
    type?: 'manual' | 'smart' | 'hybrid';
    match_operator?: CollectionMatchOperator;
    rules?: SmartRule[];
    pinned_ids?: string[];
    excluded_ids?: string[];
    manual_order?: string[];
    layout?: string;
  }) => 
    apiClient<Collection>('/api/me/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  delete: (id: string) => apiClient<{ success: boolean }>(`/api/me/collections/${id}`, { method: 'DELETE' }),
  
  update: (id: string, data: Partial<Collection> & Record<string, any>) =>
    apiClient<Collection>(`/api/me/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  duplicate: (id: string) =>
    apiClient<Collection>(`/api/me/collections/${id}/duplicate`, {
      method: 'POST'
    }),

  previewRules: (data: {
    rules: SmartRule[];
    matchOperator?: CollectionMatchOperator;
    pinnedIds?: string[];
    excludedIds?: string[];
  }) =>
    apiClient<{ matchCount: number; items: any[] }>('/api/me/collections/preview-rules', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  addItem: (id: string, contentId: string) => 
    apiClient<{ success: boolean; pinned?: boolean }>(`/api/me/collections/${id}/items/${contentId}`, { method: 'POST' }),

  removeItem: (id: string, contentId: string) =>
    apiClient<{ success: boolean; excluded?: boolean }>(`/api/me/collections/${id}/items/${contentId}`, { method: 'DELETE' }),

  pinItem: (id: string, contentId: string) =>
    apiClient<{ success: boolean; pinned: boolean }>(`/api/me/collections/${id}/pin/${contentId}`, { method: 'POST' }),

  unpinItem: (id: string, contentId: string) =>
    apiClient<{ success: boolean; pinned: boolean }>(`/api/me/collections/${id}/pin/${contentId}`, { method: 'DELETE' }),

  excludeItem: (id: string, contentId: string) =>
    apiClient<{ success: boolean; excluded: boolean }>(`/api/me/collections/${id}/exclude/${contentId}`, { method: 'POST' }),

  unexcludeItem: (id: string, contentId: string) =>
    apiClient<{ success: boolean; excluded: boolean }>(`/api/me/collections/${id}/exclude/${contentId}`, { method: 'DELETE' })
};
