import { apiClient } from './client';
import { User } from '../types';

export const authApi = {
  me: () => apiClient<User>('/api/auth/me'),
  login: (credentials: any) => apiClient<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  register: (data: any) => apiClient<{id: string, username: string, email: string}>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  logout: () => apiClient<{success: boolean}>('/api/auth/logout', {
    method: 'POST'
  })
};
