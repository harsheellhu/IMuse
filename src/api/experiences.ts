import { apiClient } from './client';
import { Experience, ExperienceEvent, ExperienceLink } from '../types';

export const experiencesApi = {
  getAll: () => apiClient<Experience[]>('/api/me/experiences'),
  
  getById: (id: string) => apiClient<Experience>(`/api/me/experiences/${id}`),
  
  getByContentId: (contentId: string) => apiClient<Experience[]>(`/api/me/experiences/by-content/${contentId}`),
  
  create: (data: { title?: string; description?: string }) => 
    apiClient<{ id: string; title: string; description: string }>('/api/me/experiences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id: string, data: { title?: string; description?: string }) => 
    apiClient<{ success: boolean }>(`/api/me/experiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: (id: string) => 
    apiClient<{ success: boolean }>(`/api/me/experiences/${id}`, {
      method: 'DELETE',
    }),
    
  logEvent: (experienceId: string, data: Partial<ExperienceEvent>) => 
    apiClient<{ id: string; experienceId: string; newExperienceCreated?: boolean }>(`/api/me/experiences/${experienceId}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateEvent: (experienceId: string, eventId: string, data: Partial<ExperienceEvent>) => 
    apiClient<{ success: boolean }>(`/api/me/experiences/${experienceId}/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  deleteEvent: (experienceId: string, eventId: string) => 
    apiClient<{ success: boolean; experienceDeleted?: boolean }>(`/api/me/experiences/${experienceId}/events/${eventId}`, {
      method: 'DELETE',
    }),
};
