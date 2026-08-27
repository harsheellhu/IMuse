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

        // Fetch collections and saves in the background without blocking the shell
        Promise.all([
          collectionsApi.getAll().catch(e => { console.error(e); return []; }),
          contentApi.getSaved().catch(e => { console.error(e); return []; })
        ]).then(([collections, saves]) => {
          useStore.setState({ collections });
          useStore.setState(state => {
            const existingIds = new Set(state.posts.map(p => p.id));
            const newPosts = saves.filter(s => !existingIds.has(s.id));
            return {
              savedPostIds: saves.map(s => s.id),
              posts: [...state.posts, ...newPosts] as any
            };
          });
        });

      } catch (e) {
        // Not logged in or error
        useStore.setState({ isAuthenticated: false });
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  return isInitializing;
};
