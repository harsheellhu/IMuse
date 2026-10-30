import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { preferencesApi } from '../api/preferences';
import { CustomPalette, BUILTIN_THEMES, deriveCompleteThemeTokens } from '../theme/tokens';
import { applyTheme } from '../theme/applyTheme';

export type AppearanceMode = string;
export type LandingStyle = 'minimal' | 'editorial' | 'observatory' | 'archive' | 'gallery' | 'cosmic' | 'tron' | 'monolith' | 'paper' | 'terminal' | 'slideshow';
export type TronIntensity = 'subtle' | 'balanced' | 'neon' | 'extreme';
export type MotionMode = 'static' | 'minimal' | 'smooth' | 'cinematic' | 'fluid' | 'experimental' | 'reduced';
export type AmbientMode = 'off' | 'soft' | 'balanced' | 'cinematic' | 'deep' | 'full';
export type FeedDensity = 'spacious' | 'relaxed' | 'balanced' | 'dense' | 'compact';
export type ImageStyle = 'original' | 'soft' | 'editorial' | 'cinematic' | 'high-contrast' | 'monochrome' | 'warm' | 'cool' | 'grain' | 'none';
export type TypographyStyle = 'neutral' | 'editorial' | 'modern' | 'neo-grotesk' | 'humanist' | 'classical' | 'literary' | 'newspaper' | 'fashion' | 'art-book' | 'brutalist' | 'technical' | 'mono' | 'futuristic' | 'cinema' | 'archive' | 'contemporary' | 'minimal' | 'luxury';
export type ShapeLanguage = 'sharp' | 'subtle' | 'rounded' | 'soft' | 'editorial';
export type BackgroundTexture = 'none' | 'fine-grain' | 'paper' | 'dust' | 'grid' | 'technical-grid' | 'noise' | 'fabric' | 'film-grain';
export type NavStyle = 'minimal' | 'floating' | 'integrated' | 'editorial' | 'cinematic' | 'tron';
export type HomeLayout = 'masonry' | 'editorial' | 'magazine' | 'gallery' | 'grid' | 'staggered' | 'minimal';
export type InterfaceSounds = 'off' | 'subtle' | 'balanced';
export type UniverseLayoutMode = 'orbit' | 'flow' | 'stack' | 'gallery' | 'constellation' | 'cinematic' | 'auto';

export interface SettingsState {
  // Options
  appearance: AppearanceMode;
  landingStyle: LandingStyle;
  universeLayout: UniverseLayoutMode;
  tronIntensity: TronIntensity;
  motion: MotionMode;
  ambientMode: AmbientMode;
  feedDensity: FeedDensity;
  imageStyle: ImageStyle;
  typography: TypographyStyle;
  shapeLanguage: ShapeLanguage;
  texture: BackgroundTexture;
  navStyle: NavStyle;
  homeLayout: HomeLayout;
  interfaceSounds: InterfaceSounds;
  skipLandingPage: boolean;

  // Custom Color Palettes & Preferences
  customPalettes: CustomPalette[];
  favoritePalettes: string[];
  recentPalettes: string[];

  // Slideshow Config
  slideshowConfig: {
    mode: 'curated' | 'shuffle';
    autoplay: 'off' | 'slow' | 'cinematic' | 'fast';
    transition: 'fade' | 'crossfade' | 'slide' | 'depth' | 'dissolve';
    captionPosition: 'bottom-left' | 'bottom-right' | 'top-left';
  };

  // Presets
  presets: Record<string, Partial<SettingsState>>;

  // UI State
  isSettingsOpen: boolean;

  // Background Task State
  discoveryTask: {
    isActive: boolean;
    packName: string | null;
    stage: 'preparing' | 'fetching' | 'downloading' | 'processing' | 'extracting' | 'indexing' | 'finalizing' | null;
    progress: number; // 0 to 100
    itemsProcessed: number;
    totalItems: number;
    elapsedTime: number; // seconds
    isPaused: boolean;
    error: string | null;
  };

  // Actions
  setSettings: (settings: Partial<Omit<SettingsState, 'presets' | 'isSettingsOpen' | 'setSettings' | 'applyPreset' | 'savePreset' | 'deletePreset' | 'randomize' | 'resetToDefault' | 'discoveryTask' | 'updateDiscoveryTask' | 'createCustomPalette' | 'updateCustomPalette' | 'deleteCustomPalette' | 'duplicatePalette' | 'toggleFavoritePalette' | 'addRecentPalette'>>) => void;
  setAppearance: (themeId: string) => void;
  createCustomPalette: (palette: Omit<CustomPalette, 'id' | 'createdAt' | 'updatedAt'>) => CustomPalette;
  updateCustomPalette: (id: string, updates: Partial<CustomPalette>) => void;
  deleteCustomPalette: (id: string) => void;
  duplicatePalette: (themeId: string, newName?: string) => CustomPalette;
  toggleFavoritePalette: (themeId: string) => void;
  addRecentPalette: (themeId: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  savePreset: (name: string) => void;
  applyPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  randomize: () => void;
  resetToDefault: () => void;
  updateDiscoveryTask: (taskUpdate: Partial<SettingsState['discoveryTask']>) => void;
}

const defaultSettings = {
  appearance: 'default' as AppearanceMode,
  landingStyle: 'minimal' as LandingStyle,
  universeLayout: 'orbit' as UniverseLayoutMode,
  tronIntensity: 'balanced' as TronIntensity,
  motion: 'smooth' as MotionMode,
  ambientMode: 'balanced' as AmbientMode,
  feedDensity: 'balanced' as FeedDensity,
  imageStyle: 'original' as ImageStyle,
  typography: 'neutral' as TypographyStyle,
  shapeLanguage: 'rounded' as ShapeLanguage,
  texture: 'none' as BackgroundTexture,
  navStyle: 'floating' as NavStyle,
  homeLayout: 'masonry' as HomeLayout,
  interfaceSounds: 'balanced' as InterfaceSounds,
  skipLandingPage: false,
  customPalettes: [] as CustomPalette[],
  favoritePalettes: ['default', 'obsidian', 'paper', 'tron'] as string[],
  recentPalettes: [] as string[],
  slideshowConfig: {
    mode: 'shuffle' as const,
    autoplay: 'slow' as const,
    transition: 'fade' as const,
    captionPosition: 'bottom-left' as const,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      presets: {},
      isSettingsOpen: false,
      discoveryTask: {
        isActive: false,
        packName: null,
        stage: null,
        progress: 0,
        itemsProcessed: 0,
        totalItems: 0,
        elapsedTime: 0,
        isPaused: false,
        error: null,
      },

      setSettings: (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
        preferencesApi.update(newSettings).catch(console.error);
      },

      setAppearance: (themeId: string, applyArtDirection: boolean = true) => {
        const state = get();
        state.addRecentPalette(themeId);

        let targetTheme: any = BUILTIN_THEMES[themeId];
        if (!targetTheme) {
          targetTheme = state.customPalettes.find((p) => p.id === themeId);
        }

        const updates: Partial<SettingsState> = { appearance: themeId };

        if (applyArtDirection && targetTheme) {
          if (targetTheme.defaultTypography) updates.typography = targetTheme.defaultTypography;
          if (targetTheme.defaultShape) updates.shapeLanguage = targetTheme.defaultShape;
          if (targetTheme.defaultDensity) updates.feedDensity = targetTheme.defaultDensity;
          if (targetTheme.defaultTexture) updates.texture = targetTheme.defaultTexture;

          if (targetTheme.typography) updates.typography = targetTheme.typography;
          if (targetTheme.shapeLanguage) updates.shapeLanguage = targetTheme.shapeLanguage;
          if (targetTheme.density) updates.feedDensity = targetTheme.density;
          if (targetTheme.texture) updates.texture = targetTheme.texture;
          if (targetTheme.animationIntensity) updates.motion = targetTheme.animationIntensity;
        }

        set(updates);
        applyTheme(targetTheme || themeId, state.customPalettes);
        preferencesApi.update(updates).catch(console.error);
      },

      createCustomPalette: (paletteData) => {
        const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newPalette: CustomPalette = {
          ...paletteData,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const stateUpdates: Partial<SettingsState> = {
          customPalettes: [...get().customPalettes, newPalette],
          appearance: id,
        };
        if (newPalette.typography) stateUpdates.typography = newPalette.typography as any;
        if (newPalette.shapeLanguage) stateUpdates.shapeLanguage = newPalette.shapeLanguage as any;
        if (newPalette.density) stateUpdates.feedDensity = newPalette.density as any;
        if (newPalette.texture) stateUpdates.texture = newPalette.texture as any;
        if (newPalette.animationIntensity) stateUpdates.motion = newPalette.animationIntensity as any;

        set((state) => ({
          ...state,
          ...stateUpdates,
        }));

        const state = get();
        state.addRecentPalette(id);
        applyTheme(newPalette, state.customPalettes);
        preferencesApi.update({ appearance: id, customPalettes: state.customPalettes, ...stateUpdates } as any).catch(console.error);

        return newPalette;
      },

      updateCustomPalette: (id, updates) => {
        set((state) => {
          const updatedPalettes = state.customPalettes.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          );
          return { customPalettes: updatedPalettes };
        });

        const state = get();
        if (state.appearance === id) {
          const current = state.customPalettes.find((p) => p.id === id);
          if (current) {
            applyTheme(current, state.customPalettes);
            const extraUpdates: Partial<SettingsState> = {};
            if (updates.typography) extraUpdates.typography = updates.typography as any;
            if (updates.shapeLanguage) extraUpdates.shapeLanguage = updates.shapeLanguage as any;
            if (updates.density) extraUpdates.feedDensity = updates.density as any;
            if (updates.texture) extraUpdates.texture = updates.texture as any;
            if (updates.animationIntensity) extraUpdates.motion = updates.animationIntensity as any;
            if (Object.keys(extraUpdates).length > 0) set(extraUpdates);
          }
        }
        preferencesApi.update({ customPalettes: state.customPalettes } as any).catch(console.error);
      },

      deleteCustomPalette: (id) => {
        set((state) => {
          const updatedPalettes = state.customPalettes.filter((p) => p.id !== id);
          const nextAppearance = state.appearance === id ? 'default' : state.appearance;
          const nextFavorites = state.favoritePalettes.filter((fid) => fid !== id);
          const nextRecents = state.recentPalettes.filter((rid) => rid !== id);
          return {
            customPalettes: updatedPalettes,
            appearance: nextAppearance,
            favoritePalettes: nextFavorites,
            recentPalettes: nextRecents,
          };
        });

        const state = get();
        applyTheme(state.appearance, state.customPalettes);
        preferencesApi.update({ appearance: state.appearance, customPalettes: state.customPalettes } as any).catch(console.error);
      },

      duplicatePalette: (themeId, newName) => {
        const state = get();
        let baseTokens = BUILTIN_THEMES.default.tokens;
        let isDark = false;
        let sourceName = 'Custom';
        let typo: any;
        let shape: any;
        let density: any;
        let texture: any;
        let radiusBase: any;
        let borderWidth: any;
        let glassIntensity: any;
        let shadowIntensity: any;
        let glowIntensity: any;
        let animationIntensity: any;

        if (BUILTIN_THEMES[themeId]) {
          const theme = BUILTIN_THEMES[themeId];
          baseTokens = { ...theme.tokens };
          isDark = theme.isDark;
          sourceName = theme.name;
          typo = theme.defaultTypography;
          shape = theme.defaultShape;
          density = theme.defaultDensity;
          texture = theme.defaultTexture;
          radiusBase = theme.tokens.radiusBase;
          borderWidth = theme.tokens.borderWidth;
          glowIntensity = theme.glowIntensity;
        } else {
          const custom = state.customPalettes.find((p) => p.id === themeId);
          if (custom) {
            baseTokens = { ...custom.tokens };
            isDark = custom.isDark;
            sourceName = custom.name;
            typo = custom.typography;
            shape = custom.shapeLanguage;
            density = custom.density;
            texture = custom.texture;
            radiusBase = custom.radiusBase || custom.tokens.radiusBase;
            borderWidth = custom.borderWidth || custom.tokens.borderWidth;
            glassIntensity = custom.glassIntensity;
            shadowIntensity = custom.shadowIntensity;
            glowIntensity = custom.glowIntensity;
            animationIntensity = custom.animationIntensity;
          }
        }

        const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const duplicated: CustomPalette = {
          id,
          name: newName || `${sourceName} Copy`,
          baseThemeId: themeId,
          isDark,
          tokens: { ...baseTokens },
          typography: typo,
          shapeLanguage: shape,
          density,
          texture,
          radiusBase,
          borderWidth,
          glassIntensity,
          shadowIntensity,
          glowIntensity,
          animationIntensity,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const stateUpdates: Partial<SettingsState> = {
          customPalettes: [...state.customPalettes, duplicated],
          appearance: id,
        };
        if (typo) stateUpdates.typography = typo;
        if (shape) stateUpdates.shapeLanguage = shape;
        if (density) stateUpdates.feedDensity = density;
        if (texture) stateUpdates.texture = texture;
        if (animationIntensity) stateUpdates.motion = animationIntensity;

        set(stateUpdates);

        const updatedState = get();
        updatedState.addRecentPalette(id);
        applyTheme(duplicated, updatedState.customPalettes);
        preferencesApi.update({ appearance: id, customPalettes: updatedState.customPalettes, ...stateUpdates } as any).catch(console.error);

        return duplicated;
      },

      toggleFavoritePalette: (themeId) => {
        set((state) => {
          const isFav = state.favoritePalettes.includes(themeId);
          const favoritePalettes = isFav
            ? state.favoritePalettes.filter((id) => id !== themeId)
            : [themeId, ...state.favoritePalettes];
          return { favoritePalettes };
        });
        preferencesApi.update({ favoritePalettes: get().favoritePalettes } as any).catch(console.error);
      },

      addRecentPalette: (themeId) => {
        set((state) => {
          const filtered = state.recentPalettes.filter((id) => id !== themeId);
          return { recentPalettes: [themeId, ...filtered].slice(0, 6) };
        });
      },

      setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
      updateDiscoveryTask: (taskUpdate) => set((state) => ({ discoveryTask: { ...state.discoveryTask, ...taskUpdate } })),
      
      savePreset: (name) => {
        const state = get();
        const presetData = {
          appearance: state.appearance,
          landingStyle: state.landingStyle,
          universeLayout: state.universeLayout,
          tronIntensity: state.tronIntensity,
          motion: state.motion,
          ambientMode: state.ambientMode,
          feedDensity: state.feedDensity,
          imageStyle: state.imageStyle,
          typography: state.typography,
          shapeLanguage: state.shapeLanguage,
          texture: state.texture,
          navStyle: state.navStyle,
          homeLayout: state.homeLayout,
          interfaceSounds: state.interfaceSounds,
          slideshowConfig: state.slideshowConfig,
          skipLandingPage: state.skipLandingPage,
        };
        set((s) => ({
          presets: { ...s.presets, [name]: presetData }
        }));
      },

      applyPreset: (name) => {
        const state = get();
        if (state.presets[name]) {
          const target = state.presets[name];
          set({ ...target });
          if (target.appearance) {
            applyTheme(target.appearance, state.customPalettes);
          }
        }
      },

      deletePreset: (name) => {
        set((state) => {
          const newPresets = { ...state.presets };
          delete newPresets[name];
          return { presets: newPresets };
        });
      },

      randomize: () => {
        const allThemeIds = Object.keys(BUILTIN_THEMES);
        const layouts: LandingStyle[] = ['minimal', 'editorial', 'gallery', 'tron', 'paper', 'slideshow'];
        const universeLayouts: UniverseLayoutMode[] = ['orbit', 'flow', 'stack', 'gallery', 'constellation', 'cinematic', 'auto'];
        const dens: FeedDensity[] = ['spacious', 'relaxed', 'balanced', 'dense'];
        const typo: TypographyStyle[] = ['neutral', 'editorial', 'modern', 'humanist', 'classical', 'newspaper', 'brutalist', 'technical', 'cinema', 'minimal', 'luxury'];
        const shapes: ShapeLanguage[] = ['sharp', 'subtle', 'rounded', 'editorial'];
        const textures: BackgroundTexture[] = ['none', 'fine-grain', 'dust', 'noise'];
        
        // Pick a theme and align related settings for coherence
        const themeId = allThemeIds[Math.floor(Math.random() * allThemeIds.length)];
        let layout: LandingStyle = 'minimal';
        let t: TypographyStyle = 'neutral';
        let shape: ShapeLanguage = 'rounded';
        
        if (themeId === 'tron') {
          layout = 'tron';
          t = 'futuristic';
          shape = 'sharp';
        } else if (themeId === 'paper' || themeId === 'ivory') {
          layout = 'paper';
          t = 'editorial';
          shape = 'editorial';
        } else if (themeId === 'obsidian' || themeId === 'midnight' || themeId === 'cosmic') {
          layout = 'observatory';
          t = 'modern';
          shape = 'subtle';
        } else {
          layout = layouts[Math.floor(Math.random() * layouts.length)];
          t = typo[Math.floor(Math.random() * typo.length)];
          shape = shapes[Math.floor(Math.random() * shapes.length)];
        }

        set({
          appearance: themeId,
          landingStyle: layout,
          universeLayout: universeLayouts[Math.floor(Math.random() * universeLayouts.length)],
          typography: t,
          shapeLanguage: shape,
          feedDensity: dens[Math.floor(Math.random() * dens.length)],
          texture: textures[Math.floor(Math.random() * textures.length)],
          motion: 'smooth',
          ambientMode: 'balanced',
          imageStyle: 'original',
          navStyle: themeId === 'tron' ? 'tron' : 'floating',
          homeLayout: 'masonry',
          interfaceSounds: 'balanced',
        });

        const state = get();
        state.addRecentPalette(themeId);
        applyTheme(themeId, state.customPalettes);
      },

      resetToDefault: () => {
        set(defaultSettings);
        applyTheme('default', []);
      },
    }),
    {
      name: 'imuse-settings',
      partialize: (state) => ({ 
        appearance: state.appearance,
        customPalettes: state.customPalettes,
        favoritePalettes: state.favoritePalettes,
        recentPalettes: state.recentPalettes,
        landingStyle: state.landingStyle,
        universeLayout: state.universeLayout,
        tronIntensity: state.tronIntensity,
        motion: state.motion,
        ambientMode: state.ambientMode,
        feedDensity: state.feedDensity,
        imageStyle: state.imageStyle,
        typography: state.typography,
        shapeLanguage: state.shapeLanguage,
        texture: state.texture,
        navStyle: state.navStyle,
        homeLayout: state.homeLayout,
        interfaceSounds: state.interfaceSounds,
        skipLandingPage: state.skipLandingPage,
        slideshowConfig: state.slideshowConfig,
        presets: state.presets,
      }),
    }
  )
);
