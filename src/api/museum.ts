import { apiClient } from './client';

export interface Museum {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_image: string | null;
}

export interface MuseumRoom {
  id: string;
  museum_id: string;
  collection_id: string;
  room_order: number;
  curator_note: string | null;
  collection_title: string;
  collection_desc: string;
  collection_cover: string;
  items: any[];
}

export const museumApi = {
  getMuseum: async (): Promise<Museum> => {
    return apiClient<Museum>('/api/me/museum');
  },
  updateMuseum: async (data: Partial<Museum>): Promise<Museum> => {
    return apiClient<Museum>('/api/me/museum', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  getRooms: async (): Promise<MuseumRoom[]> => {
    return apiClient<MuseumRoom[]>('/api/me/museum/rooms');
  },
  saveRoomCanvas: async (collectionId: string, items: any[]): Promise<void> => {
    await apiClient<void>(`/api/me/museum/rooms/${collectionId}/canvas`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  }
};
