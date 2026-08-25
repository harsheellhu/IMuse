import { apiClient } from './client';

export interface JobState {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  processed_count: number;
  total_count: number;
  current_step: string;
  error: string | null;
  metadata: any;
}

export const jobsApi = {
  startDiscoveryImport: (packId: string) => apiClient<{id: string}>('/api/jobs/discovery', {
    method: 'POST',
    body: JSON.stringify({ packId })
  }),
  
  getJob: (id: string) => apiClient<JobState>(`/api/jobs/${id}`),
  
  pauseJob: (id: string) => apiClient<{success: boolean}>(`/api/jobs/${id}/pause`, { method: 'POST' }),
  
  resumeJob: (id: string) => apiClient<{success: boolean}>(`/api/jobs/${id}/resume`, { method: 'POST' }),
  
  cancelJob: (id: string) => apiClient<{success: boolean}>(`/api/jobs/${id}/cancel`, { method: 'POST' })
};
