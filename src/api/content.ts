import { apiClient } from './client';
import { Post, Book, Film } from '../types';

export const contentApi = {
  getAll: (type?: string, limit = 50, offset = 0) => {
    let url = `/api/content?limit=${limit}&offset=${offset}`;
    if (type) url += `&type=${type}`;
    return apiClient<(Post | Book | Film)[]>(url);
  },
  
  getById: (id: string) => apiClient<Post | Book | Film>(`/api/content/${id}`),
  
  getDiscoveryWorlds: () => apiClient<any[]>('/api/discovery/worlds'),
  
  getCollectionItems: (id: string) => apiClient<any[]>(`/api/collections/${id}/items`),
  
  getDiscoveryWorldContent: (slug: string, limit = 50, offset = 0) => 
    apiClient<(Post | Book | Film)[]>(`/api/discovery/worlds/${slug}/content?limit=${limit}&offset=${offset}`),
    
  getSaved: () => apiClient<(Post | Book | Film)[]>('/api/me/saved'),
  
  saveContent: (id: string) => apiClient<{success: boolean}>(`/api/me/saved/${id}`, { method: 'POST' }),
  
  unsaveContent: (id: string) => apiClient<{success: boolean}>(`/api/me/saved/${id}`, { method: 'DELETE' }),
  
  getHistory: (limit = 30) => apiClient<(Post | Book | Film)[]>(`/api/me/history?limit=${limit}`),
  
  recordHistory: (id: string) => apiClient<{success: boolean}>(`/api/me/history/${id}`, { method: 'POST' })
};
