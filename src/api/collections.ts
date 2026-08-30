import { apiClient } from './client';
import { Collection } from '../types';

export const collectionsApi = {
  getAll: () => apiClient<Collection[]>('/api/me/collections'),
  
  create: (data: {title: string, description?: string, is_private?: boolean}) => 
    apiClient<Collection>('/api/me/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  delete: (id: string) => apiClient<{success: boolean}>(`/api/me/collections/${id}`, { method: 'DELETE' }),
  
  update: (id: string, data: any) =>
    apiClient<Collection>(`/api/me/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  addItem: (id: string, contentId: string) => 
    apiClient<{success: boolean}>(`/api/me/collections/${id}/items/${contentId}`, { method: 'POST' }),

  removeItem: (id: string, contentId: string) =>
    apiClient<{success: boolean}>(`/api/me/collections/${id}/items/${contentId}`, { method: 'DELETE' })
};
