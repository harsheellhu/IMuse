import { create } from 'zustand';
import { User, Post, Collection, Book, Film } from '../types';
import { currentUser, mockUsers, mockPosts, mockCollections, mockBooks, mockFilms } from '../data/mockData';

export type Theme = 'light' | 'dark' | 'system';
export type ColorMode = 'neutral' | 'warm' | 'cool';

export interface ActiveViewerItem {
  id: string;
  type: 'post' | 'book' | 'film' | 'collection';
  data: Post | Book | Film | Collection;
}

export interface Preferences {
  visualDensity: 'compact' | 'comfortable' | 'spacious';
  motionIntensity: 'reduced' | 'normal';
}

interface StoreState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  bgGradient: string | null;
  setBgGradient: (gradient: string | null) => void;
  currentUser: User;
  users: User[];
  posts: Post[];
  collections: Collection[];
  books: Book[];
  films: Film[];
  savedPostIds: Set<string>;
  toggleSavePost: (postId: string) => void;
  addPost: (post: Post) => void;
  activeViewerItem: ActiveViewerItem | null;
  openViewer: (item: ActiveViewerItem) => void;
  closeViewer: () => void;
  
  // Auth State
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  login: () => void;
  logout: () => void;

  // Search State
  isSearchOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Customization State
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
}

export const useStore = create<StoreState>((set) => {
  // Initialize theme from localStorage or default to system
  const savedTheme = (localStorage.getItem('imuse-theme') as Theme) || 'system';
  const savedColorMode = (localStorage.getItem('imuse-color-mode') as ColorMode) || 'neutral';
  const savedAuth = localStorage.getItem('imuse-auth') === 'true';
  const savedPreferences = localStorage.getItem('imuse-preferences');
  const initialPreferences: Preferences = savedPreferences 
    ? JSON.parse(savedPreferences) 
    : { visualDensity: 'comfortable', motionIntensity: 'normal' };

  return {
    theme: savedTheme,
    setTheme: (theme) => {
      localStorage.setItem('imuse-theme', theme);
      set({ theme });
    },
    colorMode: savedColorMode,
    setColorMode: (colorMode) => {
      localStorage.setItem('imuse-color-mode', colorMode);
      set({ colorMode });
    },
    bgGradient: localStorage.getItem('imuse-bg-gradient') || null,
    setBgGradient: (bgGradient) => {
      if (bgGradient) localStorage.setItem('imuse-bg-gradient', bgGradient);
      else localStorage.removeItem('imuse-bg-gradient');
      set({ bgGradient });
    },
    currentUser,
    users: mockUsers,
    posts: mockPosts,
    collections: mockCollections,
    books: mockBooks,
    films: mockFilms,
    savedPostIds: new Set<string>(),
    activeViewerItem: null,
    
    openViewer: (item) => {
      const url = new URL(window.location.href);
      url.searchParams.set('viewer', item.id);
      window.history.pushState({ viewerOpen: true }, '', url.toString());
      set({ activeViewerItem: item });
    },
    closeViewer: () => {
      set({ activeViewerItem: null });
      const url = new URL(window.location.href);
      if (url.searchParams.has('viewer')) {
        url.searchParams.delete('viewer');
        window.history.pushState({}, '', url.toString());
      }
    },
    
    toggleSavePost: (postId) => set((state) => {
      const newSaved = new Set(state.savedPostIds);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return { savedPostIds: newSaved };
    }),
    
    addPost: (post) => set((state) => ({
      posts: [post, ...state.posts]
    })),

    // Auth Implementation
    isAuthenticated: savedAuth,
    isAuthModalOpen: false,
    setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
    login: () => {
      localStorage.setItem('imuse-auth', 'true');
      set({ isAuthenticated: true, isAuthModalOpen: false });
    },
    logout: () => {
      localStorage.removeItem('imuse-auth');
      set({ isAuthenticated: false });
    },

    // Search Implementation
    isSearchOpen: false,
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen, searchQuery: '' }),
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Customization Implementation
    preferences: initialPreferences,
    setPreferences: (prefs) => set((state) => {
      const newPrefs = { ...state.preferences, ...prefs };
      localStorage.setItem('imuse-preferences', JSON.stringify(newPrefs));
      return { preferences: newPrefs };
    }),
  };
});
