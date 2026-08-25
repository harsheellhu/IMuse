import { apiClient } from './client';
import { Post, Book, Film } from '../types';

export const searchApi = {
  search: (query: string, limit = 30, page = 1) => 
    apiClient<(Post | Book | Film)[]>(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`)
};
