import { apiClient } from './client';
import { SettingsState } from '../store/useSettingsStore';

export const preferencesApi = {
  get: () => apiClient<Partial<SettingsState>>('/api/preferences'),
  
  update: (data: Partial<SettingsState>) => apiClient<Partial<SettingsState>>('/api/preferences', {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
};
