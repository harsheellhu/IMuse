import { create } from 'zustand';
import { User, Post, Collection, Book, Film, TvShow, Place } from '../types';
import { authApi } from '../api/auth';
import { contentApi } from '../api/content';

export type Theme = 'light' | 'dark' | 'system';
export type ColorMode = 'neutral' | 'warm' | 'cool';

export interface ActiveViewerItem {
  id: string;
  type: 'post' | 'book' | 'film' | 'collection' | 'tv_show' | 'place';
  data: Post | Book | Film | Collection | TvShow | Place;
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
  
  // Data State
  currentUser: User;
  users: User[];
  posts: Post[];
  collections: Collection[];
  books: Book[];
  films: Film[];
  tvShows: TvShow[];
  places: Place[];
  
  // Save System
  savedPostIds: string[]; // Changed from Set to Array for easier JSON serialization
  toggleSavePost: (postId: string) => void;
  
  // Post Management
  addPost: (post: Post) => void;
  
  // Collection CRUD
  createCollection: (title: string, description: string, isPrivate: boolean) => void;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  addItemsToCollection: (collectionId: string, itemIds: string[]) => void;
  removeItemsFromCollection: (collectionId: string, itemIds: string[]) => void;

  // Viewer State (Not Persisted)
  activeViewerItem: ActiveViewerItem | null;
  openViewer: (item: ActiveViewerItem) => void;
  closeViewer: () => void;
  
  // Auth State
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isCreateCollectionOpen: boolean;
  pendingAction: (() => void) | null;
  setAuthModalOpen: (isOpen: boolean) => void;
  setCreateCollectionOpen: (isOpen: boolean) => void;
  interceptAction: (action: () => void) => void;
  login: () => void;
  logout: () => void;

  // Search State (Not Persisted)
  isSearchOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Customization State
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Theme & Color Mode
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  colorMode: 'neutral',
  setColorMode: (colorMode) => set({ colorMode }),
  bgGradient: null,
  setBgGradient: (bgGradient) => set({ bgGradient }),
  
  // Data State
  currentUser: null as unknown as User, // Will be set on init
  users: [],
  posts: [],
  collections: [],
  books: [],
  films: [],
  tvShows: [],
  places: [],
  
  // Save System
  savedPostIds: [],
  toggleSavePost: async (postId) => {
    // Optimistic update
    set((state) => {
      const saved = state.savedPostIds;
      if (saved.includes(postId)) {
        return { savedPostIds: saved.filter(id => id !== postId) };
      } else {
        return { savedPostIds: [...saved, postId] };
      }
    });
    
    // API call
    try {
      const state = get();
      if (state.savedPostIds.includes(postId)) {
        await contentApi.saveContent(postId);
      } else {
        await contentApi.unsaveContent(postId);
      }
    } catch (err) {
      console.error(err);
      // Optional: rollback on error
    }
  },
  
  // Post Management
  addPost: (post) => set((state) => ({
    posts: [post, ...state.posts]
  })),

  // Collection CRUD - Will be wired to backend via API client
  createCollection: (title, description, isPrivate) => {},
  deleteCollection: (id) => {},
  updateCollection: (id, updates) => {},
  addItemsToCollection: (collectionId, itemIds) => {},
  removeItemsFromCollection: (collectionId, itemIds) => {},

  // Viewer
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
  
  // Auth Implementation
  isAuthenticated: false,
  isAuthModalOpen: false,
  isCreateCollectionOpen: false,
  pendingAction: null,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen, pendingAction: isOpen ? get().pendingAction : null }),
  setCreateCollectionOpen: (isOpen) => set({ isCreateCollectionOpen: isOpen }),
  interceptAction: (action) => {
    if (get().isAuthenticated) {
      action();
    } else {
      set({ isAuthModalOpen: true, pendingAction: action });
    }
  },
  login: () => {
    set({ isAuthenticated: true, isAuthModalOpen: false });
    const pending = get().pendingAction;
    if (pending) {
      pending();
      set({ pendingAction: null });
    }
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    set({ isAuthenticated: false, savedPostIds: [], currentUser: null as unknown as User });
  },

  // Search Implementation
  isSearchOpen: false,
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen, searchQuery: '' }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Customization Implementation
  preferences: { visualDensity: 'comfortable', motionIntensity: 'normal' },
  setPreferences: (prefs) => set((state) => ({
    preferences: { ...state.preferences, ...prefs }
  })),
}));
