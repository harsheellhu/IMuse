import { create } from 'zustand';
import { User, Post, Collection, Book, Film, TvShow, Place, Trail, TrailStep } from '../types';
import { authApi } from '../api/auth';
import { contentApi } from '../api/content';
import { collectionsApi } from '../api/collections';
import { trailsApi } from '../api/trails';

const DEFAULT_USER: User = {
  id: 'u-demo',
  name: 'Demo Curator',
  username: 'demo',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  bio: 'Curating architecture, design, and visual culture.',
  followers: 248,
  following: 86
};

export type ColorMode = 'neutral' | 'warm' | 'cool';

export type ViewerMode = 'detail' | 'universe' | 'collection';

export interface ActiveViewerItem {
  id: string;
  type: 'post' | 'book' | 'film' | 'collection' | 'tv_show' | 'place';
  data?: Post | Book | Film | Collection | TvShow | Place | any;
  mode?: ViewerMode;
  previousViewerItem?: ActiveViewerItem | null;
}

export interface Preferences {
  visualDensity: 'compact' | 'comfortable' | 'spacious';
  motionIntensity: 'reduced' | 'normal';
}

interface StoreState {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  bgGradient: string | null;
  setBgGradient: (gradient: string | null) => void;
  
  // Data State
  currentUser: User;
  users: User[];
  posts: Post[];
  collections: Collection[];
  trails: Trail[];
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
  loadCollections: () => Promise<void>;
  createCollection: (title: string, description?: string, isPrivate?: boolean, extra?: Partial<Collection>) => Promise<Collection | void>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  duplicateCollection: (id: string) => Promise<Collection | void>;
  pinCollectionItem: (collectionId: string, contentId: string) => Promise<void>;
  excludeCollectionItem: (collectionId: string, contentId: string) => Promise<void>;
  addItemsToCollection: (collectionId: string, itemIds: string[]) => void;
  removeItemsFromCollection: (collectionId: string, itemIds: string[]) => void;

  // Smart Collection Builder Modal
  isSmartBuilderOpen: boolean;
  editingCollection: Collection | null;
  openSmartBuilder: (collection?: Collection | null) => void;
  closeSmartBuilder: () => void;

  // Cultural Trails State & Actions
  activeTrail: Trail | null;
  trailDraft: Partial<Trail> | null;
  isTrailViewerOpen: boolean;
  isTrailEditorOpen: boolean;
  loadTrails: () => Promise<void>;
  openTrailViewer: (trail: Trail | string) => Promise<void>;
  closeTrailViewer: () => void;
  openTrailEditor: (trail?: Trail | Partial<Trail> | null) => void;
  closeTrailEditor: () => void;
  saveTrail: (trailData: Partial<Trail>) => Promise<Trail | void>;
  duplicateTrail: (id: string) => Promise<void>;
  deleteTrail: (id: string) => Promise<void>;
  addStepToTrail: (trailId: string, step: { contentId: string; annotation?: string; connectionType?: string; connectionText?: string }) => Promise<void>;

  // Viewer State (Not Persisted)
  activeViewerItem: ActiveViewerItem | null;
  openViewer: (item: ActiveViewerItem) => void;
  expandToUniverse: (contentId: string, initialData?: any) => void;
  closeViewer: () => void;
  closeAllViewers: () => void;
  
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

  // Activity & Memory System Cache
  patterns: any[];
  setPatterns: (patterns: any[]) => void;
  replays: Record<string, any>;
  setReplay: (year: string, replay: any) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Theme & Color Mode
  colorMode: 'neutral',
  setColorMode: (colorMode) => set({ colorMode }),
  bgGradient: null,
  setBgGradient: (bgGradient) => set({ bgGradient }),
  
  // Data State
  currentUser: DEFAULT_USER,
  users: [DEFAULT_USER],
  posts: [],
  collections: [],
  trails: [],
  books: [],
  films: [],
  tvShows: [],
  places: [],

  // Save System
  savedPostIds: [],
  toggleSavePost: async (postId) => {
    set((state) => {
      const saved = state.savedPostIds;
      if (saved.includes(postId)) {
        return { savedPostIds: saved.filter(id => id !== postId) };
      } else {
        return { savedPostIds: [...saved, postId] };
      }
    });
    try {
      const state = get();
      if (state.savedPostIds.includes(postId)) {
        await contentApi.saveContent(postId);
      } else {
        await contentApi.unsaveContent(postId);
      }
    } catch (err) {
      console.error(err);
    }
  },

  // Post Management
  addPost: (post) => set((state) => ({
    posts: [post, ...state.posts]
  })),

  // Smart Builder & Trail Modals
  isSmartBuilderOpen: false,
  editingCollection: null,
  openSmartBuilder: (col = null) => set({ isSmartBuilderOpen: true, editingCollection: col }),
  closeSmartBuilder: () => set({ isSmartBuilderOpen: false, editingCollection: null }),

  activeTrail: null,
  trailDraft: null,
  isTrailViewerOpen: false,
  isTrailEditorOpen: false,

  // Load Collections
  loadCollections: async () => {
    try {
      const data = await collectionsApi.getAll();
      set({ collections: Array.isArray(data) ? data : [] });
    } catch (e) {
      console.error('Failed to load collections:', e);
    }
  },

  // Collection CRUD
  createCollection: async (title, description = '', isPrivate = false, extra = {}) => {
    try {
      const newCol = await collectionsApi.create({
        title,
        description,
        is_private: isPrivate,
        ...extra
      });
      set(state => ({
        collections: [newCol, ...state.collections]
      }));
      return newCol;
    } catch (e) {
      console.error('Failed to create collection', e);
      // Local fallback for offline mode
      const fallbackCol: Collection = {
        id: `c-local-${Date.now()}`,
        title,
        description,
        isPrivate,
        coverImage: extra.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
        type: extra.type || 'manual',
        matchOperator: extra.matchOperator || 'all',
        rules: extra.rules || [],
        pinnedIds: extra.pinnedIds || [],
        excludedIds: extra.excludedIds || [],
        manualOrder: extra.manualOrder || [],
        layout: extra.layout || 'grid',
        itemCount: 0,
        createdAt: new Date().toISOString()
      };
      set(state => ({ collections: [fallbackCol, ...state.collections] }));
      return fallbackCol;
    }
  },

  deleteCollection: async (id) => {
    try {
      await collectionsApi.delete(id);
      set(state => ({
        collections: state.collections.filter(c => c.id !== id)
      }));
    } catch (e) {
      console.error('Failed to delete collection', e);
      set(state => ({ collections: state.collections.filter(c => c.id !== id) }));
    }
  },

  updateCollection: async (id, updates) => {
    // Optimistic update
    set(state => ({
      collections: state.collections.map(c => c.id === id ? { ...c, ...updates } : c)
    }));

    try {
      const updated = await collectionsApi.update(id, updates);
      set(state => ({
        collections: state.collections.map(c => c.id === id ? { ...c, ...updated } : c)
      }));
    } catch (e) {
      console.error('Failed to update collection on server', e);
    }
  },

  duplicateCollection: async (id) => {
    try {
      const dup = await collectionsApi.duplicate(id);
      set(state => ({
        collections: [dup, ...state.collections]
      }));
      return dup;
    } catch (e) {
      console.error('Failed to duplicate collection:', e);
      const original = get().collections.find(c => c.id === id);
      if (original) {
        const fallbackDup: Collection = {
          ...original,
          id: `c-copy-${Date.now()}`,
          title: `${original.title} (Copy)`,
          createdAt: new Date().toISOString()
        };
        set(state => ({ collections: [fallbackDup, ...state.collections] }));
        return fallbackDup;
      }
    }
  },

  pinCollectionItem: async (collectionId, contentId) => {
    // Optimistic
    set(state => ({
      collections: state.collections.map(c => {
        if (c.id !== collectionId) return c;
        const pinned = Array.isArray(c.pinnedIds) ? c.pinnedIds : [];
        const excluded = Array.isArray(c.excludedIds) ? c.excludedIds : [];
        return {
          ...c,
          pinnedIds: pinned.includes(contentId) ? pinned : [...pinned, contentId],
          excludedIds: excluded.filter(id => id !== contentId),
          itemCount: c.itemCount + (pinned.includes(contentId) ? 0 : 1)
        };
      })
    }));

    try {
      await collectionsApi.pinItem(collectionId, contentId);
    } catch (e) {
      console.error('Failed to pin item to collection:', e);
    }
  },

  excludeCollectionItem: async (collectionId, contentId) => {
    // Optimistic
    set(state => ({
      collections: state.collections.map(c => {
        if (c.id !== collectionId) return c;
        const pinned = Array.isArray(c.pinnedIds) ? c.pinnedIds : [];
        const excluded = Array.isArray(c.excludedIds) ? c.excludedIds : [];
        return {
          ...c,
          pinnedIds: pinned.filter(id => id !== contentId),
          excludedIds: excluded.includes(contentId) ? excluded : [...excluded, contentId],
          itemCount: Math.max(0, c.itemCount - 1)
        };
      })
    }));

    try {
      await collectionsApi.excludeItem(collectionId, contentId);
    } catch (e) {
      console.error('Failed to exclude item from collection:', e);
    }
  },

  addItemsToCollection: async (collectionId, itemIds) => {
    for (const itemId of itemIds) {
      await collectionsApi.addItem(collectionId, itemId).catch(console.error);
    }
    set(state => ({
      collections: state.collections.map(c => c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + itemIds.length } : c)
    }));
  },

  removeItemsFromCollection: async (collectionId, itemIds) => {
    for (const itemId of itemIds) {
      await collectionsApi.removeItem(collectionId, itemId).catch(console.error);
    }
    set(state => ({
      collections: state.collections.map(c => c.id === collectionId ? { ...c, itemCount: Math.max(0, (c.itemCount || 0) - itemIds.length) } : c)
    }));
  },

  // Cultural Trails Actions
  loadTrails: async () => {
    try {
      const trails = await trailsApi.getAll();
      set({ trails: Array.isArray(trails) ? trails : [] });
    } catch (e) {
      console.error('Failed to load trails:', e);
    }
  },

  openTrailViewer: async (trailOrId) => {
    if (typeof trailOrId === 'string') {
      try {
        const trail = await trailsApi.getById(trailOrId);
        set({ activeTrail: trail, isTrailViewerOpen: true });
      } catch (e) {
        console.error('Failed to load trail for viewing:', e);
      }
    } else {
      set({ activeTrail: trailOrId, isTrailViewerOpen: true });
      // Fetch full details if steps not loaded
      if (!trailOrId.steps || trailOrId.steps.length === 0) {
        trailsApi.getById(trailOrId.id)
          .then(full => set({ activeTrail: full }))
          .catch(console.error);
      }
    }
  },

  closeTrailViewer: () => set({ isTrailViewerOpen: false }),

  openTrailEditor: (trail = null) => {
    if (trail) {
      if (!trail.steps || trail.steps.length === 0) {
        trailsApi.getById(trail.id).then(full => {
          set({ trailDraft: full, isTrailEditorOpen: true });
        }).catch(() => {
          set({ trailDraft: trail, isTrailEditorOpen: true });
        });
      } else {
        set({ trailDraft: { ...trail }, isTrailEditorOpen: true });
      }
    } else {
      set({
        trailDraft: {
          title: '',
          description: '',
          theme: 'cinematic',
          status: 'draft',
          steps: []
        },
        isTrailEditorOpen: true
      });
    }
  },

  closeTrailEditor: () => set({ isTrailEditorOpen: false, trailDraft: null }),

  saveTrail: async (trailData) => {
    const isNew = !trailData.id || trailData.id.startsWith('draft-');
    try {
      if (isNew) {
        const created = await trailsApi.create({
          title: trailData.title || 'Untitled Trail',
          description: trailData.description,
          coverImage: trailData.coverImage,
          theme: trailData.theme,
          status: trailData.status || 'draft',
          steps: trailData.steps || []
        });
        set(state => ({
          trails: [created, ...state.trails],
          isTrailEditorOpen: false,
          trailDraft: null
        }));
        return created;
      } else {
        await trailsApi.update(trailData.id!, {
          title: trailData.title,
          description: trailData.description,
          coverImage: trailData.coverImage,
          theme: trailData.theme,
          status: trailData.status,
          steps: trailData.steps
        });
        const updated = await trailsApi.getById(trailData.id!);
        set(state => ({
          trails: state.trails.map(t => t.id === trailData.id ? { ...t, ...updated } : t),
          activeTrail: state.activeTrail?.id === trailData.id ? updated : state.activeTrail,
          isTrailEditorOpen: false,
          trailDraft: null
        }));
        return updated;
      }
    } catch (e) {
      console.error('Failed to save trail:', e);
      // Local fallback
      const localTrail: Trail = {
        id: trailData.id || `trail-local-${Date.now()}`,
        title: trailData.title || 'Untitled Trail',
        description: trailData.description || '',
        coverImage: trailData.coverImage || trailData.steps?.[0]?.artifact?.imageUrl,
        theme: trailData.theme || 'cinematic',
        status: trailData.status || 'draft',
        stepCount: trailData.steps?.length || 0,
        steps: trailData.steps as TrailStep[],
        updatedAt: new Date().toISOString()
      };
      set(state => ({
        trails: [localTrail, ...state.trails.filter(t => t.id !== localTrail.id)],
        isTrailEditorOpen: false,
        trailDraft: null
      }));
      return localTrail;
    }
  },

  duplicateTrail: async (id) => {
    try {
      await trailsApi.duplicate(id);
      const all = await trailsApi.getAll();
      set({ trails: all });
    } catch (e) {
      console.error('Failed to duplicate trail:', e);
    }
  },

  deleteTrail: async (id) => {
    try {
      await trailsApi.delete(id);
      set(state => ({
        trails: state.trails.filter(t => t.id !== id),
        activeTrail: state.activeTrail?.id === id ? null : state.activeTrail,
        isTrailViewerOpen: state.activeTrail?.id === id ? false : state.isTrailViewerOpen
      }));
    } catch (e) {
      console.error('Failed to delete trail:', e);
      set(state => ({ trails: state.trails.filter(t => t.id !== id) }));
    }
  },

  addStepToTrail: async (trailId, step) => {
    try {
      await trailsApi.addStep(trailId, step);
      // Update trail in state
      const updated = await trailsApi.getById(trailId);
      set(state => ({
        trails: state.trails.map(t => t.id === trailId ? { ...t, stepCount: (t.stepCount || 0) + 1 } : t),
        activeTrail: state.activeTrail?.id === trailId ? updated : state.activeTrail
      }));
    } catch (e) {
      console.error('Failed to add step to trail:', e);
    }
  },

  // Viewer State (Single Canonical Foreground Layer)
  activeViewerItem: null,
  openViewer: (item) => {
    const mode = item.mode || (item.type === 'collection' ? 'collection' : 'detail');
    const resolvedItem: ActiveViewerItem = { ...item, mode };

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('viewer');
      url.searchParams.delete('universe');
      url.searchParams.delete('collection');

      if (mode === 'collection') {
        url.searchParams.set('collection', item.id);
      } else if (mode === 'universe') {
        url.searchParams.set('universe', item.id);
      } else {
        url.searchParams.set('viewer', item.id);
      }

      window.history.pushState({ viewerOpen: true, mode, id: item.id }, '', url.toString());
    }

    set({ activeViewerItem: resolvedItem });
  },
  expandToUniverse: (contentId, initialData) => {
    const current = get().activeViewerItem;
    const resolvedItem: ActiveViewerItem = {
      id: contentId,
      type: initialData?.type || current?.type || 'place',
      data: initialData || current?.data,
      mode: 'universe',
      previousViewerItem: current || null
    };

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('viewer');
      url.searchParams.delete('collection');
      url.searchParams.set('universe', contentId);
      window.history.pushState({ viewerOpen: true, mode: 'universe', id: contentId }, '', url.toString());
    }

    set({ activeViewerItem: resolvedItem });
  },
  closeViewer: () => {
    const current = get().activeViewerItem;
    if (current?.mode === 'universe' && current.previousViewerItem) {
      // Step back from Universe to the previous Post Viewer cleanly
      const prev = current.previousViewerItem;
      const restoredItem: ActiveViewerItem = { ...prev, mode: 'detail', previousViewerItem: null };
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('universe');
        url.searchParams.delete('collection');
        url.searchParams.set('viewer', prev.id);
        window.history.pushState({ viewerOpen: true, mode: 'detail', id: prev.id }, '', url.toString());
      }
      set({ activeViewerItem: restoredItem });
    } else {
      // Full close
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('viewer');
        url.searchParams.delete('universe');
        url.searchParams.delete('collection');
        window.history.pushState({}, '', url.toString());
      }
      set({ activeViewerItem: null });
    }
  },
  closeAllViewers: () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('viewer');
      url.searchParams.delete('universe');
      url.searchParams.delete('collection');
      window.history.pushState({}, '', url.toString());
    }
    set({ activeViewerItem: null });
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

  // Activity & Memory System Cache
  patterns: [],
  setPatterns: (patterns) => set({ patterns }),
  replays: {},
  setReplay: (year, replay) => set((state) => ({
    replays: { ...state.replays, [year]: replay }
  })),
}));
