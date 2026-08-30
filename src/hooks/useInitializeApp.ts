import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { authApi } from '../api/auth';
import { preferencesApi } from '../api/preferences';
import { collectionsApi } from '../api/collections';
import { contentApi } from '../api/content';

export const useInitializeApp = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Attempt to fetch current user
        const user = await authApi.me();
        
        // Setup initial user state
        useStore.setState({ isAuthenticated: true, currentUser: user });
        
        // Fetch preferences
        try {
          const prefs = await preferencesApi.get();
          if (prefs) {
            useSettingsStore.setState(prefs);
          }
        } catch (e) {
          console.error("Failed to load preferences", e);
        }

      } catch (e) {
        // Not logged in or guest mode
        useStore.setState({ isAuthenticated: false });
      } finally {
        // Load collections and saves for both authenticated and demo guest session
        Promise.all([
          collectionsApi.getAll().catch(() => []),
          contentApi.getSaved().catch(() => [])
        ]).then(([collections, saves]) => {
          if (collections && collections.length > 0) {
            useStore.setState({ collections });
          }
          if (saves && saves.length > 0) {
            useStore.setState(state => {
              const existingIds = new Set(state.posts.map(p => p.id));
              const newPosts = saves.filter(s => !existingIds.has(s.id));
              return {
                savedPostIds: saves.map(s => s.id),
                posts: [...state.posts, ...newPosts] as any
              };
            });
          }
        });

        setIsInitializing(false);

        // Background Idle Prefetch: Warm cache and store silently without blocking the UI
        if (typeof window !== 'undefined') {
          const runIdle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 200));
          runIdle(() => {
            Promise.all([
              contentApi.getAll('post', 50).catch(() => []),
              contentApi.getAll('book', 50).catch(() => []),
              contentApi.getAll('film', 50).catch(() => []),
              contentApi.getAll('tv_show', 50).catch(() => []),
              contentApi.getAll('place', 50).catch(() => []),
              contentApi.getDiscoveryWorlds().catch(() => [])
            ]).then(([posts, books, films, tvShows, places]) => {
              useStore.setState(state => ({
                posts: state.posts.length > 0 ? state.posts : posts as any,
                books: state.books.length > 0 ? state.books : books as any,
                films: state.films.length > 0 ? state.films : films as any,
                tvShows: state.tvShows.length > 0 ? state.tvShows : tvShows as any,
                places: state.places.length > 0 ? state.places : places as any
              }));
            });
          });
        }
      }
    };

    initialize();
  }, []);

  return isInitializing;
};
