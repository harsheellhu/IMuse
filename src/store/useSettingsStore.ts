import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { preferencesApi } from '../api/preferences';

export type AppearanceMode = 'default' | 'obsidian' | 'paper' | 'midnight' | 'graphite' | 'ash' | 'ivory' | 'monochrome' | 'aurora' | 'sunset' | 'ocean' | 'forest' | 'twilight' | 'electric' | 'tron';
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

export interface SettingsState {
  // Options
  appearance: AppearanceMode;
  landingStyle: LandingStyle;
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
  setSettings: (settings: Partial<Omit<SettingsState, 'presets' | 'isSettingsOpen' | 'setSettings' | 'applyPreset' | 'savePreset' | 'deletePreset' | 'randomize' | 'resetToDefault' | 'discoveryTask' | 'updateDiscoveryTask'>>) => void;
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
  slideshowConfig: {
    mode: 'shuffle' as const,
    autoplay: 'slow' as const,
    transition: 'fade' as const,
    captionPosition: 'bottom-left' as const,
  },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
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
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  updateDiscoveryTask: (taskUpdate) => set((state) => ({ discoveryTask: { ...state.discoveryTask, ...taskUpdate } })),
  
  savePreset: (name) => {
    const state = get();
    const presetData = {
      appearance: state.appearance,
      landingStyle: state.landingStyle,
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
    };
    set((s) => ({
      presets: { ...s.presets, [name]: presetData }
    }));
  },

  applyPreset: (name) => {
    const state = get();
    if (state.presets[name]) {
      set({ ...state.presets[name] });
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
    const themes: AppearanceMode[] = ['default', 'obsidian', 'paper', 'midnight', 'electric', 'tron'];
    const layouts: LandingStyle[] = ['minimal', 'editorial', 'gallery', 'tron', 'paper', 'slideshow'];
    const dens: FeedDensity[] = ['spacious', 'relaxed', 'balanced', 'dense'];
    const typo: TypographyStyle[] = ['neutral', 'editorial', 'modern', 'humanist', 'classical', 'newspaper', 'brutalist', 'technical', 'cinema', 'minimal', 'luxury'];
    const shapes: ShapeLanguage[] = ['sharp', 'subtle', 'rounded', 'editorial'];
    const textures: BackgroundTexture[] = ['none', 'fine-grain', 'dust', 'noise'];
    
    // Pick a theme and align related settings for coherence
    const theme = themes[Math.floor(Math.random() * themes.length)];
    let layout: LandingStyle = 'minimal';
    let t: TypographyStyle = 'neutral';
    let shape: ShapeLanguage = 'rounded';
    
    if (theme === 'tron' || theme === 'electric') {
      layout = 'tron';
      t = 'futuristic';
      shape = 'sharp';
    } else if (theme === 'paper') {
      layout = 'paper';
      t = 'editorial';
      shape = 'editorial';
    } else if (theme === 'obsidian' || theme === 'midnight') {
      layout = 'observatory';
      t = 'modern';
      shape = 'subtle';
    } else {
      layout = layouts[Math.floor(Math.random() * layouts.length)];
      t = typo[Math.floor(Math.random() * typo.length)];
      shape = shapes[Math.floor(Math.random() * shapes.length)];
    }

    set({
      appearance: theme,
      landingStyle: layout,
      typography: t,
      shapeLanguage: shape,
      feedDensity: dens[Math.floor(Math.random() * dens.length)],
      texture: textures[Math.floor(Math.random() * textures.length)],
      motion: 'smooth',
      ambientMode: 'balanced',
      imageStyle: 'original',
      navStyle: theme === 'tron' ? 'tron' : 'floating',
      homeLayout: 'masonry',
      interfaceSounds: 'balanced',
    });
  },

  resetToDefault: () => set(defaultSettings),
}));
