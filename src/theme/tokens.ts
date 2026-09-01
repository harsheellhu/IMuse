/**
 * iMUSE Semantic Theme Tokens & Built-in Palette Definitions
 * 
 * Architecture:
 * Theme Definition -> Semantic Tokens -> Root CSS Variables -> Components
 */

export interface ThemeTokens {
  // Background & Surface
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;

  // Text & Typography
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  // Borders
  border: string;
  borderSubtle: string;
  borderStrong: string;

  // Accent System
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSoft: string;
  accentContrast: string;

  // Focus & Selection
  focus: string;
  selection: string;

  // Overlays & Atmosphere
  overlay: string;
  shadow: string;

  // Feedback & Status
  success: string;
  warning: string;
  error: string;
  info: string;
}

export type MoodCategory = 
  | 'ALL' 
  | 'DARK' 
  | 'LIGHT' 
  | 'EARTH' 
  | 'CINEMATIC' 
  | 'COLORFUL' 
  | 'ARCHIVAL' 
  | 'FUTURISTIC';

export interface ThemeDefinition {
  id: string;
  name: string;
  mood: string;
  category: MoodCategory;
  isDark: boolean;
  tokens: ThemeTokens;
  // Special optional effects
  glowColor?: string;
  glowIntensity?: number;
  shadowAccent?: string;
}

export interface CustomPalette {
  id: string;
  userId?: string;
  name: string;
  baseThemeId?: string;
  isDark: boolean;
  tokens: ThemeTokens;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// 28+ BUILT-IN CURATED PALETTES
// ============================================================================

export const BUILTIN_THEMES: Record<string, ThemeDefinition> = {
  // --------------------------------------------------------------------------
  // PALETTE 00: DEFAULT (Neutral Clean Light)
  // --------------------------------------------------------------------------
  default: {
    id: 'default',
    name: 'Default',
    mood: 'Neutral / Clean / Balanced',
    category: 'LIGHT',
    isDark: false,
    tokens: {
      background: '#FDFCFB',
      backgroundElevated: '#FFFFFF',
      surface: '#F5F4F1',
      surfaceHover: '#EBEAE7',
      surfaceActive: '#E0DFDC',
      text: '#111111',
      textMuted: '#666666',
      textSubtle: '#999999',
      textInverse: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.08)',
      borderSubtle: 'rgba(0, 0, 0, 0.05)',
      borderStrong: 'rgba(0, 0, 0, 0.15)',
      accent: '#111111',
      accentHover: '#2A2A2A',
      accentActive: '#000000',
      accentSoft: 'rgba(17, 17, 17, 0.08)',
      accentContrast: '#FFFFFF',
      focus: '#111111',
      selection: 'rgba(17, 17, 17, 0.12)',
      overlay: 'rgba(255, 255, 255, 0.85)',
      shadow: 'rgba(0, 0, 0, 0.06)',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 01: OBSIDIAN
  // --------------------------------------------------------------------------
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    mood: 'Dark / Luxurious / Cinematic',
    category: 'DARK',
    isDark: true,
    tokens: {
      background: '#050505',
      backgroundElevated: '#121212',
      surface: '#0E0E0E',
      surfaceHover: '#181818',
      surfaceActive: '#222222',
      text: '#EDEDED',
      textMuted: '#888888',
      textSubtle: '#555555',
      textInverse: '#050505',
      border: 'rgba(255, 255, 255, 0.1)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
      borderStrong: 'rgba(255, 255, 255, 0.2)',
      accent: '#E0E0E0',
      accentHover: '#FFFFFF',
      accentActive: '#CCCCCC',
      accentSoft: 'rgba(255, 255, 255, 0.1)',
      accentContrast: '#050505',
      focus: '#E0E0E0',
      selection: 'rgba(255, 255, 255, 0.15)',
      overlay: 'rgba(5, 5, 5, 0.88)',
      shadow: 'rgba(0, 0, 0, 0.6)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 02: PAPER
  // --------------------------------------------------------------------------
  paper: {
    id: 'paper',
    name: 'Paper',
    mood: 'Editorial / Bookish / Archival',
    category: 'ARCHIVAL',
    isDark: false,
    tokens: {
      background: '#F4EEDD',
      backgroundElevated: '#FAF8F2',
      surface: '#EADDCE',
      surfaceHover: '#DFD2C2',
      surfaceActive: '#D4C6B5',
      text: '#2C2A26',
      textMuted: '#6D685E',
      textSubtle: '#9E978B',
      textInverse: '#FAF8F2',
      border: 'rgba(44, 42, 38, 0.12)',
      borderSubtle: 'rgba(44, 42, 38, 0.06)',
      borderStrong: 'rgba(44, 42, 38, 0.22)',
      accent: '#1F1E1B',
      accentHover: '#33312C',
      accentActive: '#12110F',
      accentSoft: 'rgba(44, 42, 38, 0.08)',
      accentContrast: '#F4EEDD',
      focus: '#1F1E1B',
      selection: 'rgba(44, 42, 38, 0.12)',
      overlay: 'rgba(244, 238, 221, 0.9)',
      shadow: 'rgba(44, 42, 38, 0.06)',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 03: IVORY
  // --------------------------------------------------------------------------
  ivory: {
    id: 'ivory',
    name: 'Ivory',
    mood: 'Luxury Editorial / Warm Gold',
    category: 'LIGHT',
    isDark: false,
    tokens: {
      background: '#FFFFF4',
      backgroundElevated: '#FFFFFF',
      surface: '#F6F5E8',
      surfaceHover: '#EDECE0',
      surfaceActive: '#E3E2D4',
      text: '#38332B',
      textMuted: '#7D7569',
      textSubtle: '#A8A094',
      textInverse: '#FFFFFF',
      border: 'rgba(56, 51, 43, 0.1)',
      borderSubtle: 'rgba(56, 51, 43, 0.05)',
      borderStrong: 'rgba(56, 51, 43, 0.2)',
      accent: '#B89758',
      accentHover: '#A38448',
      accentActive: '#8C703A',
      accentSoft: 'rgba(184, 151, 88, 0.12)',
      accentContrast: '#FFFFFF',
      focus: '#B89758',
      selection: 'rgba(184, 151, 88, 0.18)',
      overlay: 'rgba(255, 255, 244, 0.9)',
      shadow: 'rgba(56, 51, 43, 0.05)',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 04: MIDNIGHT
  // --------------------------------------------------------------------------
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    mood: 'Deep Nighttime / Navy-Black',
    category: 'DARK',
    isDark: true,
    tokens: {
      background: '#020914',
      backgroundElevated: '#081B38',
      surface: '#041226',
      surfaceHover: '#071B38',
      surfaceActive: '#0A254D',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      textSubtle: '#64748B',
      textInverse: '#020914',
      border: 'rgba(226, 232, 240, 0.1)',
      borderSubtle: 'rgba(226, 232, 240, 0.05)',
      borderStrong: 'rgba(226, 232, 240, 0.22)',
      accent: '#38BDF8',
      accentHover: '#60A5FA',
      accentActive: '#0284C7',
      accentSoft: 'rgba(56, 189, 248, 0.12)',
      accentContrast: '#020914',
      focus: '#38BDF8',
      selection: 'rgba(56, 189, 248, 0.2)',
      overlay: 'rgba(2, 9, 20, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#38BDF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 05: OCEAN
  // --------------------------------------------------------------------------
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    mood: 'Calm / Cool / Immersive',
    category: 'COLORFUL',
    isDark: true,
    tokens: {
      background: '#011222',
      backgroundElevated: '#033660',
      surface: '#022340',
      surfaceHover: '#043058',
      surfaceActive: '#063D70',
      text: '#E0F2FE',
      textMuted: '#7DD3FC',
      textSubtle: '#38BDF8',
      textInverse: '#011222',
      border: 'rgba(125, 211, 252, 0.18)',
      borderSubtle: 'rgba(125, 211, 252, 0.1)',
      borderStrong: 'rgba(125, 211, 252, 0.3)',
      accent: '#0284C7',
      accentHover: '#0EA5E9',
      accentActive: '#0369A1',
      accentSoft: 'rgba(2, 132, 199, 0.18)',
      accentContrast: '#FFFFFF',
      focus: '#38BDF8',
      selection: 'rgba(56, 189, 248, 0.22)',
      overlay: 'rgba(1, 18, 34, 0.9)',
      shadow: 'rgba(0, 10, 25, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#38BDF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 06: FOREST
  // --------------------------------------------------------------------------
  forest: {
    id: 'forest',
    name: 'Forest',
    mood: 'Organic / Quiet / Natural',
    category: 'EARTH',
    isDark: true,
    tokens: {
      background: '#0A1A12',
      backgroundElevated: '#1B3F2D',
      surface: '#122B1E',
      surfaceHover: '#173626',
      surfaceActive: '#1D4330',
      text: '#D1FAE5',
      textMuted: '#6EE7B7',
      textSubtle: '#34D399',
      textInverse: '#0A1A12',
      border: 'rgba(110, 231, 183, 0.18)',
      borderSubtle: 'rgba(110, 231, 183, 0.08)',
      borderStrong: 'rgba(110, 231, 183, 0.28)',
      accent: '#10B981',
      accentHover: '#34D399',
      accentActive: '#059669',
      accentSoft: 'rgba(16, 185, 129, 0.15)',
      accentContrast: '#0A1A12',
      focus: '#10B981',
      selection: 'rgba(16, 185, 129, 0.2)',
      overlay: 'rgba(10, 26, 18, 0.9)',
      shadow: 'rgba(0, 15, 8, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 07: MOSS
  // --------------------------------------------------------------------------
  moss: {
    id: 'moss',
    name: 'Moss',
    mood: 'Earthy / Quiet / Naturalist',
    category: 'EARTH',
    isDark: true,
    tokens: {
      background: '#141812',
      backgroundElevated: '#283024',
      surface: '#1E241B',
      surfaceHover: '#252C22',
      surfaceActive: '#2C3529',
      text: '#F2EFE9',
      textMuted: '#A3AD9B',
      textSubtle: '#7A8473',
      textInverse: '#141812',
      border: 'rgba(163, 173, 155, 0.16)',
      borderSubtle: 'rgba(163, 173, 155, 0.08)',
      borderStrong: 'rgba(163, 173, 155, 0.26)',
      accent: '#829577',
      accentHover: '#98AB8D',
      accentActive: '#6D7E63',
      accentSoft: 'rgba(130, 149, 119, 0.15)',
      accentContrast: '#141812',
      focus: '#829577',
      selection: 'rgba(130, 149, 119, 0.2)',
      overlay: 'rgba(20, 24, 18, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.6)',
      success: '#4ADE80',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 08: SUNSET
  // --------------------------------------------------------------------------
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    mood: 'Warm / Cinematic / Aubergine',
    category: 'CINEMATIC',
    isDark: true,
    tokens: {
      background: '#1F121E',
      backgroundElevated: '#3E1C38',
      surface: '#2C1628',
      surfaceHover: '#371C33',
      surfaceActive: '#44233F',
      text: '#FDEEE9',
      textMuted: '#E09F8F',
      textSubtle: '#B57466',
      textInverse: '#1F121E',
      border: 'rgba(224, 159, 143, 0.18)',
      borderSubtle: 'rgba(224, 159, 143, 0.08)',
      borderStrong: 'rgba(224, 159, 143, 0.3)',
      accent: '#F97316',
      accentHover: '#FB923C',
      accentActive: '#EA580C',
      accentSoft: 'rgba(249, 115, 22, 0.15)',
      accentContrast: '#FFFFFF',
      focus: '#F97316',
      selection: 'rgba(249, 115, 22, 0.22)',
      overlay: 'rgba(31, 18, 30, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 09: TERRACOTTA
  // --------------------------------------------------------------------------
  terracotta: {
    id: 'terracotta',
    name: 'Terracotta',
    mood: 'Architectural / Warm Clay',
    category: 'EARTH',
    isDark: true,
    tokens: {
      background: '#231512',
      backgroundElevated: '#42241F',
      surface: '#311C18',
      surfaceHover: '#3D231E',
      surfaceActive: '#4A2B25',
      text: '#FBECE8',
      textMuted: '#D79F93',
      textSubtle: '#AA7468',
      textInverse: '#231512',
      border: 'rgba(215, 159, 147, 0.18)',
      borderSubtle: 'rgba(215, 159, 147, 0.08)',
      borderStrong: 'rgba(215, 159, 147, 0.28)',
      accent: '#E07A5F',
      accentHover: '#E8927B',
      accentActive: '#D46345',
      accentSoft: 'rgba(224, 122, 95, 0.15)',
      accentContrast: '#FFFFFF',
      focus: '#E07A5F',
      selection: 'rgba(224, 122, 95, 0.2)',
      overlay: 'rgba(35, 21, 18, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 10: SAND
  // --------------------------------------------------------------------------
  sand: {
    id: 'sand',
    name: 'Sand',
    mood: 'Desert / Architectural / Minimal',
    category: 'LIGHT',
    isDark: false,
    tokens: {
      background: '#F7F3E9',
      backgroundElevated: '#FFFFFF',
      surface: '#EDE7D8',
      surfaceHover: '#E3DCsources',
      surfaceActive: '#D9D1BF',
      text: '#362E25',
      textMuted: '#796B5B',
      textSubtle: '#A89988',
      textInverse: '#FFFFFF',
      border: 'rgba(54, 46, 37, 0.1)',
      borderSubtle: 'rgba(54, 46, 37, 0.05)',
      borderStrong: 'rgba(54, 46, 37, 0.2)',
      accent: '#9A5B32',
      accentHover: '#874D28',
      accentActive: '#723F1E',
      accentSoft: 'rgba(154, 91, 50, 0.12)',
      accentContrast: '#FFFFFF',
      focus: '#9A5B32',
      selection: 'rgba(154, 91, 50, 0.16)',
      overlay: 'rgba(247, 243, 233, 0.9)',
      shadow: 'rgba(54, 46, 37, 0.06)',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 11: LAVENDER
  // --------------------------------------------------------------------------
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    mood: 'Soft / Creative / Dreamlike',
    category: 'COLORFUL',
    isDark: true,
    tokens: {
      background: '#161420',
      backgroundElevated: '#2C283F',
      surface: '#201D2F',
      surfaceHover: '#28243A',
      surfaceActive: '#312D46',
      text: '#F3F0FA',
      textMuted: '#B9B0D4',
      textSubtle: '#8B80AC',
      textInverse: '#161420',
      border: 'rgba(185, 176, 212, 0.18)',
      borderSubtle: 'rgba(185, 176, 212, 0.08)',
      borderStrong: 'rgba(185, 176, 212, 0.28)',
      accent: '#A78BFA',
      accentHover: '#C4B5FD',
      accentActive: '#8B5CF6',
      accentSoft: 'rgba(167, 139, 250, 0.15)',
      accentContrast: '#161420',
      focus: '#A78BFA',
      selection: 'rgba(167, 139, 250, 0.22)',
      overlay: 'rgba(22, 20, 32, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#818CF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 12: VIOLET
  // --------------------------------------------------------------------------
  violet: {
    id: 'violet',
    name: 'Violet',
    mood: 'Dramatic / Artistic / Deep Violet',
    category: 'COLORFUL',
    isDark: true,
    tokens: {
      background: '#0F091A',
      backgroundElevated: '#281345',
      surface: '#1A0E2E',
      surfaceHover: '#22133D',
      surfaceActive: '#2C194D',
      text: '#F5EDFF',
      textMuted: '#C4A1F3',
      textSubtle: '#9568CE',
      textInverse: '#0F091A',
      border: 'rgba(196, 161, 243, 0.2)',
      borderSubtle: 'rgba(196, 161, 243, 0.09)',
      borderStrong: 'rgba(196, 161, 243, 0.32)',
      accent: '#8B5CF6',
      accentHover: '#A78BFA',
      accentActive: '#7C3AED',
      accentSoft: 'rgba(139, 92, 246, 0.16)',
      accentContrast: '#FFFFFF',
      focus: '#8B5CF6',
      selection: 'rgba(139, 92, 246, 0.24)',
      overlay: 'rgba(15, 9, 26, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#818CF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 13: ROSE
  // --------------------------------------------------------------------------
  rose: {
    id: 'rose',
    name: 'Rose',
    mood: 'Editorial / Fashion / Dusty Rose',
    category: 'COLORFUL',
    isDark: true,
    tokens: {
      background: '#1A1115',
      backgroundElevated: '#38202C',
      surface: '#261720',
      surfaceHover: '#301E29',
      surfaceActive: '#3C2634',
      text: '#FDF2F4',
      textMuted: '#D89EAE',
      textSubtle: '#A86C7D',
      textInverse: '#1A1115',
      border: 'rgba(216, 158, 174, 0.18)',
      borderSubtle: 'rgba(216, 158, 174, 0.08)',
      borderStrong: 'rgba(216, 158, 174, 0.28)',
      accent: '#FB7185',
      accentHover: '#FDA4AF',
      accentActive: '#F43F5E',
      accentSoft: 'rgba(251, 113, 133, 0.15)',
      accentContrast: '#1A1115',
      focus: '#FB7185',
      selection: 'rgba(251, 113, 133, 0.22)',
      overlay: 'rgba(26, 17, 21, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 14: BURGUNDY
  // --------------------------------------------------------------------------
  burgundy: {
    id: 'burgundy',
    name: 'Burgundy',
    mood: 'Cinematic / Luxurious / Deep Wine',
    category: 'CINEMATIC',
    isDark: true,
    tokens: {
      background: '#14060A',
      backgroundElevated: '#300B17',
      surface: '#200810',
      surfaceHover: '#2A0C16',
      surfaceActive: '#36101E',
      text: '#FDEEEF',
      textMuted: '#C97D8C',
      textSubtle: '#914B5A',
      textInverse: '#14060A',
      border: 'rgba(201, 125, 140, 0.2)',
      borderSubtle: 'rgba(201, 125, 140, 0.08)',
      borderStrong: 'rgba(201, 125, 140, 0.3)',
      accent: '#E11D48',
      accentHover: '#F43F5E',
      accentActive: '#BE123C',
      accentSoft: 'rgba(225, 29, 72, 0.16)',
      accentContrast: '#FFFFFF',
      focus: '#E11D48',
      selection: 'rgba(225, 29, 72, 0.24)',
      overlay: 'rgba(20, 6, 10, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 15: AMBER
  // --------------------------------------------------------------------------
  amber: {
    id: 'amber',
    name: 'Amber',
    mood: 'Film / Archive / Warm Light',
    category: 'ARCHIVAL',
    isDark: true,
    tokens: {
      background: '#1A140B',
      backgroundElevated: '#3A2C18',
      surface: '#271E10',
      surfaceHover: '#312615',
      surfaceActive: '#3D2F1B',
      text: '#FEF8EE',
      textMuted: '#D6BA8E',
      textSubtle: '#9D8257',
      textInverse: '#1A140B',
      border: 'rgba(214, 186, 142, 0.18)',
      borderSubtle: 'rgba(214, 186, 142, 0.08)',
      borderStrong: 'rgba(214, 186, 142, 0.28)',
      accent: '#F59E0B',
      accentHover: '#FBBF24',
      accentActive: '#D97706',
      accentSoft: 'rgba(245, 158, 11, 0.15)',
      accentContrast: '#1A140B',
      focus: '#F59E0B',
      selection: 'rgba(245, 158, 11, 0.22)',
      overlay: 'rgba(26, 20, 11, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#F59E0B',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 16: COPPER
  // --------------------------------------------------------------------------
  copper: {
    id: 'copper',
    name: 'Copper',
    mood: 'Industrial / Material / Warm Metal',
    category: 'EARTH',
    isDark: true,
    tokens: {
      background: '#16110E',
      backgroundElevated: '#33231C',
      surface: '#221813',
      surfaceHover: '#2C201A',
      surfaceActive: '#372821',
      text: '#FDF6F0',
      textMuted: '#C49F8C',
      textSubtle: '#8C6C5A',
      textInverse: '#16110E',
      border: 'rgba(196, 159, 140, 0.18)',
      borderSubtle: 'rgba(196, 159, 140, 0.08)',
      borderStrong: 'rgba(196, 159, 140, 0.28)',
      accent: '#D97706',
      accentHover: '#F59E0B',
      accentActive: '#B45309',
      accentSoft: 'rgba(217, 119, 6, 0.15)',
      accentContrast: '#FFFFFF',
      focus: '#D97706',
      selection: 'rgba(217, 119, 6, 0.22)',
      overlay: 'rgba(22, 17, 14, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#F59E0B',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 17: SLATE
  // --------------------------------------------------------------------------
  slate: {
    id: 'slate',
    name: 'Slate',
    mood: 'Industrial / Modernist / Steel',
    category: 'DARK',
    isDark: true,
    tokens: {
      background: '#0F172A',
      backgroundElevated: '#1E293B',
      surface: '#172033',
      surfaceHover: '#1F2B44',
      surfaceActive: '#273655',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textSubtle: '#64748B',
      textInverse: '#0F172A',
      border: 'rgba(148, 163, 184, 0.18)',
      borderSubtle: 'rgba(148, 163, 184, 0.08)',
      borderStrong: 'rgba(148, 163, 184, 0.28)',
      accent: '#94A3B8',
      accentHover: '#CBD5E1',
      accentActive: '#64748B',
      accentSoft: 'rgba(148, 163, 184, 0.14)',
      accentContrast: '#0F172A',
      focus: '#94A3B8',
      selection: 'rgba(148, 163, 184, 0.2)',
      overlay: 'rgba(15, 23, 42, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 18: CONCRETE
  // --------------------------------------------------------------------------
  concrete: {
    id: 'concrete',
    name: 'Concrete',
    mood: 'Brutalist / Architectural / Monochrome',
    category: 'LIGHT',
    isDark: false,
    tokens: {
      background: '#E4E4E4',
      backgroundElevated: '#F2F2F2',
      surface: '#D8D8D8',
      surfaceHover: '#CCCCCC',
      surfaceActive: '#BFBFBF',
      text: '#1C1C1C',
      textMuted: '#5C5C5C',
      textSubtle: '#8C8C8C',
      textInverse: '#F2F2F2',
      border: 'rgba(28, 28, 28, 0.14)',
      borderSubtle: 'rgba(28, 28, 28, 0.07)',
      borderStrong: 'rgba(28, 28, 28, 0.25)',
      accent: '#000000',
      accentHover: '#2A2A2A',
      accentActive: '#111111',
      accentSoft: 'rgba(0, 0, 0, 0.1)',
      accentContrast: '#FFFFFF',
      focus: '#000000',
      selection: 'rgba(0, 0, 0, 0.15)',
      overlay: 'rgba(228, 228, 228, 0.92)',
      shadow: 'rgba(0, 0, 0, 0.08)',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 19: MONOCHROME
  // --------------------------------------------------------------------------
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    mood: 'Pure Grayscale / Minimalist',
    category: 'DARK',
    isDark: true,
    tokens: {
      background: '#000000',
      backgroundElevated: '#1A1A1A',
      surface: '#111111',
      surfaceHover: '#1C1C1C',
      surfaceActive: '#262626',
      text: '#FFFFFF',
      textMuted: '#A3A3A3',
      textSubtle: '#666666',
      textInverse: '#000000',
      border: 'rgba(255, 255, 255, 0.15)',
      borderSubtle: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.3)',
      accent: '#FFFFFF',
      accentHover: '#E5E5E5',
      accentActive: '#CCCCCC',
      accentSoft: 'rgba(255, 255, 255, 0.12)',
      accentContrast: '#000000',
      focus: '#FFFFFF',
      selection: 'rgba(255, 255, 255, 0.2)',
      overlay: 'rgba(0, 0, 0, 0.92)',
      shadow: 'rgba(0, 0, 0, 0.8)',
      success: '#FFFFFF',
      warning: '#CCCCCC',
      error: '#FFFFFF',
      info: '#CCCCCC',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 20: INK
  // --------------------------------------------------------------------------
  ink: {
    id: 'ink',
    name: 'Ink',
    mood: 'Japanese Print / Warm Near-Black / Vermilion',
    category: 'ARCHIVAL',
    isDark: true,
    tokens: {
      background: '#0C0A09',
      backgroundElevated: '#211D1A',
      surface: '#171412',
      surfaceHover: '#1F1B18',
      surfaceActive: '#282320',
      text: '#F5F2EB',
      textMuted: '#A8A29E',
      textSubtle: '#78716C',
      textInverse: '#0C0A09',
      border: 'rgba(245, 242, 235, 0.12)',
      borderSubtle: 'rgba(245, 242, 235, 0.06)',
      borderStrong: 'rgba(245, 242, 235, 0.22)',
      accent: '#E63946',
      accentHover: '#F25C68',
      accentActive: '#CC2936',
      accentSoft: 'rgba(230, 57, 70, 0.15)',
      accentContrast: '#FFFFFF',
      focus: '#E63946',
      selection: 'rgba(230, 57, 70, 0.22)',
      overlay: 'rgba(12, 10, 9, 0.92)',
      shadow: 'rgba(0, 0, 0, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#E63946',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 21: JADE
  // --------------------------------------------------------------------------
  jade: {
    id: 'jade',
    name: 'Jade',
    mood: 'Cool Green Editorial / Jade-Black',
    category: 'COLORFUL',
    isDark: true,
    tokens: {
      background: '#061311',
      backgroundElevated: '#11312C',
      surface: '#0B211E',
      surfaceHover: '#0F2C28',
      surfaceActive: '#143833',
      text: '#E6F7F4',
      textMuted: '#7ECEC2',
      textSubtle: '#439B8F',
      textInverse: '#061311',
      border: 'rgba(126, 206, 194, 0.18)',
      borderSubtle: 'rgba(126, 206, 194, 0.08)',
      borderStrong: 'rgba(126, 206, 194, 0.28)',
      accent: '#2DD4BF',
      accentHover: '#5EEAD4',
      accentActive: '#14B8A6',
      accentSoft: 'rgba(45, 212, 191, 0.15)',
      accentContrast: '#061311',
      focus: '#2DD4BF',
      selection: 'rgba(45, 212, 191, 0.22)',
      overlay: 'rgba(6, 19, 17, 0.9)',
      shadow: 'rgba(0, 15, 12, 0.65)',
      success: '#2DD4BF',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 22: COBALT
  // --------------------------------------------------------------------------
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt',
    mood: 'Graphic / Modern / Bold Cobalt Blue',
    category: 'COLORFUL',
    isDark: true,
    tokens: {
      background: '#030B18',
      backgroundElevated: '#0B224A',
      surface: '#06152E',
      surfaceHover: '#091E41',
      surfaceActive: '#0E2957',
      text: '#FFFFFF',
      textMuted: '#93C5FD',
      textSubtle: '#60A5FA',
      textInverse: '#030B18',
      border: 'rgba(147, 197, 253, 0.2)',
      borderSubtle: 'rgba(147, 197, 253, 0.09)',
      borderStrong: 'rgba(147, 197, 253, 0.32)',
      accent: '#2563EB',
      accentHover: '#3B82F6',
      accentActive: '#1D4ED8',
      accentSoft: 'rgba(37, 99, 235, 0.18)',
      accentContrast: '#FFFFFF',
      focus: '#2563EB',
      selection: 'rgba(37, 99, 235, 0.25)',
      overlay: 'rgba(3, 11, 24, 0.9)',
      shadow: 'rgba(0, 5, 20, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#3B82F6',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 23: MEDITERRANEAN
  // --------------------------------------------------------------------------
  mediterranean: {
    id: 'mediterranean',
    name: 'Mediterranean',
    mood: 'Sun / Stone / Sea Blue & Terracotta',
    category: 'CINEMATIC',
    isDark: true,
    tokens: {
      background: '#0B1726',
      backgroundElevated: '#20334D',
      surface: '#142338',
      surfaceHover: '#1B2E48',
      surfaceActive: '#233A5B',
      text: '#FDFBF7',
      textMuted: '#CBD5E1',
      textSubtle: '#94A3B8',
      textInverse: '#0B1726',
      border: 'rgba(203, 213, 225, 0.18)',
      borderSubtle: 'rgba(203, 213, 225, 0.08)',
      borderStrong: 'rgba(203, 213, 225, 0.28)',
      accent: '#E07A5F',
      accentHover: '#E8927B',
      accentActive: '#D46345',
      accentSoft: 'rgba(224, 122, 95, 0.16)',
      accentContrast: '#FFFFFF',
      focus: '#E07A5F',
      selection: 'rgba(224, 122, 95, 0.22)',
      overlay: 'rgba(11, 23, 38, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#38BDF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 24: AUTUMN
  // --------------------------------------------------------------------------
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    mood: 'Literary / Seasonal / Rust & Burnt Orange',
    category: 'EARTH',
    isDark: true,
    tokens: {
      background: '#1A0E0A',
      backgroundElevated: '#361D15',
      surface: '#26140E',
      surfaceHover: '#301A12',
      surfaceActive: '#3C2017',
      text: '#FDF4EB',
      textMuted: '#DCAB97',
      textSubtle: '#A8745E',
      textInverse: '#1A0E0A',
      border: 'rgba(220, 171, 151, 0.18)',
      borderSubtle: 'rgba(220, 171, 151, 0.08)',
      borderStrong: 'rgba(220, 171, 151, 0.28)',
      accent: '#EA580C',
      accentHover: '#F97316',
      accentActive: '#C2410C',
      accentSoft: 'rgba(234, 88, 12, 0.16)',
      accentContrast: '#FFFFFF',
      focus: '#EA580C',
      selection: 'rgba(234, 88, 12, 0.24)',
      overlay: 'rgba(26, 14, 10, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 25: WINTER
  // --------------------------------------------------------------------------
  winter: {
    id: 'winter',
    name: 'Winter',
    mood: 'Cold / Quiet / Slate & Icy Blue',
    category: 'DARK',
    isDark: true,
    tokens: {
      background: '#0B1017',
      backgroundElevated: '#1A2433',
      surface: '#121A25',
      surfaceHover: '#182332',
      surfaceActive: '#1F2C3F',
      text: '#F0F6FC',
      textMuted: '#A5B4C8',
      textSubtle: '#6A7D96',
      textInverse: '#0B1017',
      border: 'rgba(165, 180, 200, 0.18)',
      borderSubtle: 'rgba(165, 180, 200, 0.08)',
      borderStrong: 'rgba(165, 180, 200, 0.28)',
      accent: '#7DD3FC',
      accentHover: '#BAE6FD',
      accentActive: '#38BDF8',
      accentSoft: 'rgba(125, 211, 252, 0.15)',
      accentContrast: '#0B1017',
      focus: '#7DD3FC',
      selection: 'rgba(125, 211, 252, 0.22)',
      overlay: 'rgba(11, 16, 23, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.65)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#7DD3FC',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 26: NEON NOIR
  // --------------------------------------------------------------------------
  'neon-noir': {
    id: 'neon-noir',
    name: 'Neon Noir',
    mood: 'Dark Urban / Magenta & Cyan Balance',
    category: 'CINEMATIC',
    isDark: true,
    tokens: {
      background: '#050508',
      backgroundElevated: '#181224',
      surface: '#0F0B18',
      surfaceHover: '#161122',
      surfaceActive: '#1E172E',
      text: '#FFFFFF',
      textMuted: '#B8A8D0',
      textSubtle: '#786894',
      textInverse: '#050508',
      border: 'rgba(217, 70, 239, 0.2)',
      borderSubtle: 'rgba(217, 70, 239, 0.09)',
      borderStrong: 'rgba(217, 70, 239, 0.32)',
      accent: '#E879F9',
      accentHover: '#F0ABFC',
      accentActive: '#D946EF',
      accentSoft: 'rgba(232, 121, 249, 0.16)',
      accentContrast: '#050508',
      focus: '#E879F9',
      selection: 'rgba(232, 121, 249, 0.24)',
      overlay: 'rgba(5, 5, 8, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.7)',
      success: '#2DD4BF',
      warning: '#FBBF24',
      error: '#F43F5E',
      info: '#38BDF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 27: COSMIC
  // --------------------------------------------------------------------------
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic',
    mood: 'Atmospheric / Deep Indigo & Violet Space',
    category: 'FUTURISTIC',
    isDark: true,
    tokens: {
      background: '#080512',
      backgroundElevated: '#1C133A',
      surface: '#120C26',
      surfaceHover: '#181033',
      surfaceActive: '#201642',
      text: '#F3EEFF',
      textMuted: '#B4A2DE',
      textSubtle: '#7A64AE',
      textInverse: '#080512',
      border: 'rgba(180, 162, 222, 0.18)',
      borderSubtle: 'rgba(180, 162, 222, 0.08)',
      borderStrong: 'rgba(180, 162, 222, 0.28)',
      accent: '#818CF8',
      accentHover: '#A5B4FC',
      accentActive: '#6366F1',
      accentSoft: 'rgba(129, 140, 248, 0.16)',
      accentContrast: '#FFFFFF',
      focus: '#818CF8',
      selection: 'rgba(129, 140, 248, 0.24)',
      overlay: 'rgba(8, 5, 18, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.7)',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#818CF8',
    },
  },

  // --------------------------------------------------------------------------
  // PALETTE 28: TRON (High-Tech Controlled Cyan & Glow)
  // --------------------------------------------------------------------------
  tron: {
    id: 'tron',
    name: 'TRON',
    mood: 'High-Tech / Near-Black & Controlled Cyan',
    category: 'FUTURISTIC',
    isDark: true,
    glowColor: '#00FFFF',
    glowIntensity: 1,
    shadowAccent: 'rgba(0, 255, 255, 0.15)',
    tokens: {
      background: '#010409',
      backgroundElevated: '#051324',
      surface: '#020810',
      surfaceHover: '#031020',
      surfaceActive: '#041830',
      text: '#E2F1F8',
      textMuted: '#6A9DB2',
      textSubtle: '#3D6678',
      textInverse: '#010409',
      border: 'rgba(0, 255, 255, 0.2)',
      borderSubtle: 'rgba(0, 255, 255, 0.12)',
      borderStrong: 'rgba(0, 255, 255, 0.4)',
      accent: '#00FFFF',
      accentHover: '#66FFFF',
      accentActive: '#00CCCC',
      accentSoft: 'rgba(0, 255, 255, 0.15)',
      accentContrast: '#010409',
      focus: '#00FFFF',
      selection: 'rgba(0, 255, 255, 0.25)',
      overlay: 'rgba(1, 4, 9, 0.92)',
      shadow: 'rgba(0, 255, 255, 0.06)',
      success: '#00FFAA',
      warning: '#FFE600',
      error: '#FF0055',
      info: '#00FFFF',
    },
  },
};

// ============================================================================
// COLOR MATH & WCAG CONTRAST UTILITIES
// ============================================================================

/**
 * Validates and normalizes color strings to safe hex or rgba values.
 */
export function normalizeColor(input: string, fallback = '#000000'): string {
  if (!input || typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  
  // Safe hex check (#fff or #ffffff or #ffffffff)
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  // Safe rgb/rgba check
  if (/^rgba?\(\s*([0-9]{1,3}\s*,\s*){2}[0-9]{1,3}(\s*,\s*(0|1|0?\.[0-9]+))?\s*\)$/.test(trimmed)) {
    return trimmed;
  }
  // Safe hsl/hsla check
  if (/^hsla?\(\s*[0-9]{1,3}(\.[0-9]+)?(deg)?\s*,\s*[0-9]{1,3}(\.[0-9]+)?%\s*,\s*[0-9]{1,3}(\.[0-9]+)?%(\s*,\s*(0|1|0?\.[0-9]+))?\s*\)$/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: cleaned.length === 8 ? Math.round(((num >> 24) & 255) / 255 * 100) / 100 : 1
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = (h % 360 + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val, a: 1 };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a: 1
  };
}

/**
 * Calculates WCAG 2.1 relative luminance (0 to 1).
 */
export function getRelativeLuminance(color: string): number {
  const { r, g, b } = hexToRgb(color);
  const sRGB = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculates WCAG 2.1 contrast ratio between two colors (1 to 21).
 */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns contrast analysis with recommendation.
 */
export function analyzeContrast(text: string, background: string) {
  const ratio = getContrastRatio(text, background);
  const isGood = ratio >= 4.5;
  const isAcceptable = ratio >= 3.0;
  return {
    ratio: Math.round(ratio * 10) / 10,
    isGood,
    isAcceptable,
    status: isGood ? 'Great' : isAcceptable ? 'Acceptable' : 'Low Contrast',
  };
}

/**
 * Auto-improves contrast of a foreground color against a background color.
 */
export function improveContrast(fg: string, bg: string, targetRatio = 4.5): string {
  const bgLum = getRelativeLuminance(bg);
  const isDarkBg = bgLum < 0.5;
  const { r, g, b } = hexToRgb(fg);
  const hsl = rgbToHsl(r, g, b);

  let currentL = hsl.l;
  let bestHex = fg;
  let bestRatio = getContrastRatio(fg, bg);

  // If dark background, increase lightness; if light background, decrease lightness
  for (let step = 0; step < 100; step++) {
    if (isDarkBg) {
      currentL = Math.min(100, currentL + 1);
    } else {
      currentL = Math.max(0, currentL - 1);
    }
    const rgb = hslToRgb(hsl.h, hsl.s, currentL);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const ratio = getContrastRatio(hex, bg);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestHex = hex;
    }
    if (ratio >= targetRatio) {
      return hex;
    }
  }

  return bestHex;
}

/**
 * Automatically derives complete state colors and secondary tokens
 * from essential core picks (Background, Surface, Text, Accent).
 */
export function deriveCompleteThemeTokens(core: {
  background: string;
  surface?: string;
  backgroundElevated?: string;
  text: string;
  textMuted?: string;
  accent: string;
  border?: string;
  isDark?: boolean;
}): ThemeTokens {
  const bg = normalizeColor(core.background, '#050505');
  const text = normalizeColor(core.text, '#EDEDED');
  const accent = normalizeColor(core.accent, '#38BDF8');
  
  const bgLum = getRelativeLuminance(bg);
  const isDark = core.isDark !== undefined ? core.isDark : bgLum < 0.5;

  const bgRgb = hexToRgb(bg);
  const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);

  const textRgb = hexToRgb(text);
  const textHsl = rgbToHsl(textRgb.r, textRgb.g, textRgb.b);

  const accentRgb = hexToRgb(accent);
  const accentHsl = rgbToHsl(accentRgb.r, accentRgb.g, accentRgb.b);

  // Surface derivation
  const surfaceHsl = isDark 
    ? { ...bgHsl, l: Math.min(90, bgHsl.l + 5) }
    : { ...bgHsl, l: Math.max(10, bgHsl.l - 4) };
  const surfaceRgb = hslToRgb(surfaceHsl.h, surfaceHsl.s, surfaceHsl.l);
  const defaultSurface = rgbToHex(surfaceRgb.r, surfaceRgb.g, surfaceRgb.b);
  const surface = core.surface ? normalizeColor(core.surface, defaultSurface) : defaultSurface;

  // Surface hover & active
  const hoverHsl = isDark 
    ? { ...surfaceHsl, l: Math.min(95, surfaceHsl.l + 5) }
    : { ...surfaceHsl, l: Math.max(5, surfaceHsl.l - 4) };
  const hoverRgb = hslToRgb(hoverHsl.h, hoverHsl.s, hoverHsl.l);
  const surfaceHover = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);

  const activeHsl = isDark 
    ? { ...surfaceHsl, l: Math.min(98, surfaceHsl.l + 9) }
    : { ...surfaceHsl, l: Math.max(2, surfaceHsl.l - 8) };
  const activeRgb = hslToRgb(activeHsl.h, activeHsl.s, activeHsl.l);
  const surfaceActive = rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

  // Elevated background
  const elevHsl = isDark 
    ? { ...bgHsl, l: Math.min(95, bgHsl.l + 10) }
    : { ...bgHsl, l: Math.min(100, bgHsl.l + 4) };
  const elevRgb = hslToRgb(elevHsl.h, elevHsl.s, elevHsl.l);
  const defaultElevated = rgbToHex(elevRgb.r, elevRgb.g, elevRgb.b);
  const backgroundElevated = core.backgroundElevated ? normalizeColor(core.backgroundElevated, defaultElevated) : defaultElevated;

  // Text subtle & muted
  const mutedHsl = isDark
    ? { ...textHsl, l: Math.max(20, textHsl.l - 30) }
    : { ...textHsl, l: Math.min(80, textHsl.l + 30) };
  const mutedRgb = hslToRgb(mutedHsl.h, mutedHsl.s, mutedHsl.l);
  const defaultMuted = rgbToHex(mutedRgb.r, mutedRgb.g, mutedRgb.b);
  const textMuted = core.textMuted ? normalizeColor(core.textMuted, defaultMuted) : defaultMuted;

  const subtleHsl = isDark
    ? { ...textHsl, l: Math.max(10, textHsl.l - 50) }
    : { ...textHsl, l: Math.min(90, textHsl.l + 50) };
  const subtleRgb = hslToRgb(subtleHsl.h, subtleHsl.s, subtleHsl.l);
  const textSubtle = rgbToHex(subtleRgb.r, subtleRgb.g, subtleRgb.b);

  const textInverse = isDark ? '#050505' : '#FFFFFF';

  // Borders
  const borderOpacity = isDark ? 0.12 : 0.08;
  const defaultBorder = isDark ? `rgba(255, 255, 255, ${borderOpacity})` : `rgba(0, 0, 0, ${borderOpacity})`;
  const border = core.border ? normalizeColor(core.border, defaultBorder) : defaultBorder;
  const borderSubtle = isDark ? `rgba(255, 255, 255, 0.06)` : `rgba(0, 0, 0, 0.05)`;
  const borderStrong = isDark ? `rgba(255, 255, 255, 0.25)` : `rgba(0, 0, 0, 0.18)`;

  // Accent states
  const accentHoverHsl = { ...accentHsl, l: Math.min(95, accentHsl.l + 8) };
  const accentHoverRgb = hslToRgb(accentHoverHsl.h, accentHoverHsl.s, accentHoverHsl.l);
  const accentHover = rgbToHex(accentHoverRgb.r, accentHoverRgb.g, accentHoverRgb.b);

  const accentActiveHsl = { ...accentHsl, l: Math.max(5, accentHsl.l - 8) };
  const accentActiveRgb = hslToRgb(accentActiveHsl.h, accentActiveHsl.s, accentActiveHsl.l);
  const accentActive = rgbToHex(accentActiveRgb.r, accentActiveRgb.g, accentActiveRgb.b);

  const accentSoft = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.15)`;
  const accentContrast = getRelativeLuminance(accent) > 0.4 ? '#050505' : '#FFFFFF';

  return {
    background: bg,
    backgroundElevated,
    surface,
    surfaceHover,
    surfaceActive,
    text,
    textMuted,
    textSubtle,
    textInverse,
    border,
    borderSubtle,
    borderStrong,
    accent,
    accentHover,
    accentActive,
    accentSoft,
    accentContrast,
    focus: accent,
    selection: `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.22)`,
    overlay: isDark ? `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.9)` : `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.88)`,
    shadow: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.06)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: accent,
  };
}

// ============================================================================
// COLOR HARMONY CALCULATIONS
// ============================================================================

export function balancePalette(
  baseAccent: string, 
  harmony: 'complementary' | 'analogous' | 'monochrome' | 'triadic' = 'analogous'
): { accent: string; secondary: string; tertiary: string } {
  const { r, g, b } = hexToRgb(baseAccent);
  const hsl = rgbToHsl(r, g, b);

  let secH = hsl.h;
  let tertH = hsl.h;

  if (harmony === 'complementary') {
    secH = (hsl.h + 180) % 360;
    tertH = (hsl.h + 30) % 360;
  } else if (harmony === 'analogous') {
    secH = (hsl.h + 30) % 360;
    tertH = (hsl.h - 30 + 360) % 360;
  } else if (harmony === 'triadic') {
    secH = (hsl.h + 120) % 360;
    tertH = (hsl.h + 240) % 360;
  } else if (harmony === 'monochrome') {
    const secRgb = hslToRgb(hsl.h, Math.max(0, hsl.s - 30), Math.min(90, hsl.l + 15));
    const tertRgb = hslToRgb(hsl.h, Math.max(0, hsl.s - 50), Math.max(10, hsl.l - 20));
    return {
      accent: baseAccent,
      secondary: rgbToHex(secRgb.r, secRgb.g, secRgb.b),
      tertiary: rgbToHex(tertRgb.r, tertRgb.g, tertRgb.b),
    };
  }

  const secRgb = hslToRgb(secH, hsl.s, hsl.l);
  const tertRgb = hslToRgb(tertH, hsl.s, hsl.l);

  return {
    accent: baseAccent,
    secondary: rgbToHex(secRgb.r, secRgb.g, secRgb.b),
    tertiary: rgbToHex(tertRgb.r, tertRgb.g, tertRgb.b),
  };
}

/**
 * Generates a tasteful, readable, artistic random palette.
 */
export function generateTastefulPalette(preferredDark?: boolean): ThemeTokens {
  const isDark = preferredDark !== undefined ? preferredDark : Math.random() > 0.25; // 75% dark preference
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(20 + Math.random() * 40); // 20-60% tasteful sat

  // Background
  const bgL = isDark ? Math.floor(3 + Math.random() * 6) : Math.floor(94 + Math.random() * 4);
  const bgRgb = hslToRgb(hue, saturation * 0.4, bgL);
  const background = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);

  // Text
  const textL = isDark ? Math.floor(90 + Math.random() * 6) : Math.floor(10 + Math.random() * 8);
  const textRgb = hslToRgb(hue, saturation * 0.1, textL);
  const text = rgbToHex(textRgb.r, textRgb.g, textRgb.b);

  // Accent
  const accentHue = (hue + Math.floor(30 + Math.random() * 180)) % 360;
  const accentSat = Math.floor(60 + Math.random() * 35);
  const accentL = isDark ? Math.floor(55 + Math.random() * 20) : Math.floor(35 + Math.random() * 20);
  const accentRgb = hslToRgb(accentHue, accentSat, accentL);
  const accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);

  return deriveCompleteThemeTokens({ background, text, accent, isDark });
}

// ============================================================================
// CLIENT-SIDE IMAGE-TO-PALETTE EXTRACTION
// ============================================================================

export async function extractPaletteFromImage(
  imageSource: string | File
): Promise<ThemeTokens> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    let objectUrlToRevoke: string | null = null;
    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      objectUrlToRevoke = URL.createObjectURL(imageSource);
      img.src = objectUrlToRevoke;
    }

    img.onload = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // Downsample to 64x64 for instant client-side analysis
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts: { [hex: string]: number } = {};
        let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;

        let mostVibrantHex = '';
        let maxVibrancy = -1;

        for (let i = 0; i < imgData.length; i += 16) { // step by 4 pixels (16 bytes)
          const a = imgData[i + 3];
          if (a < 128) continue; // skip transparent

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          totalR += r;
          totalG += g;
          totalB += b;
          pixelCount++;

          // Quantize to 5-bit color bins
          const qR = Math.round(r / 16) * 16;
          const qG = Math.round(g / 16) * 16;
          const qB = Math.round(b / 16) * 16;
          const hex = rgbToHex(qR, qG, qB);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;

          // Vibrancy metric: saturation * (1 - abs(lightness - 0.5) * 2)
          const hsl = rgbToHsl(r, g, b);
          const vibrancy = hsl.s * (1 - Math.abs(hsl.l - 50) / 50);
          if (vibrancy > maxVibrancy && hsl.s > 30 && hsl.l > 25 && hsl.l < 80) {
            maxVibrancy = vibrancy;
            mostVibrantHex = rgbToHex(r, g, b);
          }
        }

        if (pixelCount === 0) {
          resolve(generateTastefulPalette(true));
          return;
        }

        // Average dominant color
        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);
        const avgHsl = rgbToHsl(avgR, avgG, avgB);

        // Derive cinematic dark background from dominant mood
        const darkBgHsl = { h: avgHsl.h, s: Math.min(avgHsl.s, 25), l: 5 };
        const darkBgRgb = hslToRgb(darkBgHsl.h, darkBgHsl.s, darkBgHsl.l);
        const background = rgbToHex(darkBgRgb.r, darkBgRgb.g, darkBgRgb.b);

        // Text in crisp soft-white
        const text = '#EDEDED';

        // Accent in most vibrant extracted color or fallback
        const accent = mostVibrantHex || rgbToHex(avgR, avgG, avgB);

        const derived = deriveCompleteThemeTokens({
          background,
          text,
          accent,
          isDark: true
        });

        resolve(derived);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      reject(new Error('Failed to load image for color extraction'));
    };
  });
}

// ============================================================================
// IMPORT / EXPORT VALIDATION
// ============================================================================

export function exportPaletteToJson(palette: CustomPalette | ThemeDefinition): string {
  const exportData = {
    name: palette.name,
    isDark: palette.isDark,
    baseThemeId: (palette as CustomPalette).baseThemeId || palette.id,
    tokens: palette.tokens,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

export function validateAndImportPaletteJson(jsonString: string): Omit<CustomPalette, 'id' | 'createdAt' | 'updatedAt'> | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return null;
    if (typeof data.name !== 'string' || !data.name.trim()) return null;
    if (!data.tokens || typeof data.tokens !== 'object') return null;

    const raw = data.tokens;
    // Validate essential tokens
    if (!raw.background || !raw.text || !raw.accent) return null;

    // Sanitize and derive full token set safely
    const sanitizedTokens: ThemeTokens = deriveCompleteThemeTokens({
      background: normalizeColor(raw.background, '#050505'),
      surface: raw.surface ? normalizeColor(raw.surface) : undefined,
      backgroundElevated: raw.backgroundElevated ? normalizeColor(raw.backgroundElevated) : undefined,
      text: normalizeColor(raw.text, '#EDEDED'),
      textMuted: raw.textMuted ? normalizeColor(raw.textMuted) : undefined,
      accent: normalizeColor(raw.accent, '#38BDF8'),
      border: raw.border ? normalizeColor(raw.border) : undefined,
      isDark: typeof data.isDark === 'boolean' ? data.isDark : true,
    });

    // Override any other explicitly supplied valid tokens
    const tokenKeys: (keyof ThemeTokens)[] = [
      'surfaceHover', 'surfaceActive', 'textSubtle', 'textInverse',
      'borderSubtle', 'borderStrong', 'accentHover', 'accentActive',
      'accentSoft', 'accentContrast', 'focus', 'selection', 'overlay',
      'shadow', 'success', 'warning', 'error', 'info'
    ];
    for (const k of tokenKeys) {
      if (raw[k] && typeof raw[k] === 'string') {
        sanitizedTokens[k] = normalizeColor(raw[k], sanitizedTokens[k]);
      }
    }

    return {
      name: data.name.trim().slice(0, 40),
      baseThemeId: typeof data.baseThemeId === 'string' ? data.baseThemeId : 'default',
      isDark: typeof data.isDark === 'boolean' ? data.isDark : true,
      tokens: sanitizedTokens,
    };
  } catch {
    return null;
  }
}
