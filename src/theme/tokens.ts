/**
 * iMUSE Semantic Theme Tokens & Built-in Palette Definitions
 * 
 * Architecture:
 * Theme Definition -> Semantic Tokens -> Root CSS Variables -> Components
 */

export interface ThemeTokens {
  // Background & Surfaces
  background: string;
  backgroundElevated: string;
  backgroundSubtle: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceSecondary: string;
  surfaceTertiary: string;

  // Text & Typography
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderStrong: string;
  divider: string;

  // Accent System
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSoft: string;
  accentContrast: string;

  // Controls & Interactive
  controlBg: string;
  controlBorder: string;
  controlHover: string;

  // Focus & Selection
  focus: string;
  selection: string;
  disabled: string;

  // Overlays, Atmosphere & Glass
  overlay: string;
  backdrop: string;
  shadow: string;
  glassBg: string;
  glassBorder: string;
  glassBlur: string;

  // Ambient & Gradient
  themeGradient: string;
  glowColor?: string;
  glowIntensity?: number;
  shadowAccent?: string;

  // Canvas / Spatial Elements
  canvasGridColor: string;
  canvasNodeBorder: string;
  canvasEdgeColor: string;

  // Artwork & Metadata
  artworkBg: string;
  metadataSurface: string;

  // Scrollbars
  scrollbarThumb: string;
  scrollbarTrack: string;

  // Shape & Structure Tokens
  radiusBase: string; // "0px", "2px", "4px", "8px", "12px", "16px", "24px"
  borderWidth: string; // "0px", "1px", "2px"

  // Feedback & Status
  success: string;
  warning: string;
  error: string;
  info: string;
}

export type MoodCategory = 
  | 'ALL' 
  | 'EDITORIAL'
  | 'ANALOG'
  | 'NATURAL'
  | 'DIGITAL'
  | 'DARK' 
  | 'LIGHT' 
  | 'EARTH' 
  | 'CINEMATIC' 
  | 'COLORFUL' 
  | 'ARCHIVAL' 
  | 'FUTURISTIC';

export type ThemeTypography = 
  | 'neutral' | 'editorial' | 'modern' | 'neo-grotesk' | 'humanist' 
  | 'classical' | 'literary' | 'newspaper' | 'fashion' | 'art-book' 
  | 'brutalist' | 'technical' | 'mono' | 'futuristic' | 'cinema' 
  | 'archive' | 'contemporary' | 'minimal' | 'luxury';

export type ThemeShape = 'sharp' | 'subtle' | 'rounded' | 'soft' | 'editorial';
export type ThemeDensity = 'spacious' | 'relaxed' | 'balanced' | 'dense' | 'compact';
export type ThemeTexture = 'none' | 'fine-grain' | 'paper' | 'dust' | 'grid' | 'technical-grid' | 'noise' | 'fabric' | 'film-grain';

export interface ThemeDefinition {
  id: string;
  name: string;
  mood: string;
  category: MoodCategory;
  isDark: boolean;
  tokens: ThemeTokens;
  // Art direction pairing defaults
  defaultTypography?: ThemeTypography;
  defaultShape?: ThemeShape;
  defaultDensity?: ThemeDensity;
  defaultTexture?: ThemeTexture;
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
  typography?: ThemeTypography;
  shapeLanguage?: ThemeShape;
  density?: ThemeDensity;
  texture?: ThemeTexture;
  radiusBase?: string;
  borderWidth?: string;
  glassIntensity?: number;
  shadowIntensity?: number;
  glowIntensity?: number;
  animationIntensity?: 'static' | 'minimal' | 'smooth' | 'cinematic';
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// COLOR MATH & WCAG CONTRAST UTILITIES
// ============================================================================

export function normalizeColor(input: string, fallback = '#000000'): string {
  if (!input || typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  if (/^rgba?\(\s*([0-9]{1,3}\s*,\s*){2}[0-9]{1,3}(\s*,\s*(0|1|0?\.[0-9]+))?\s*\)$/.test(trimmed)) {
    return trimmed;
  }
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

export function getRelativeLuminance(color: string): number {
  const { r, g, b } = hexToRgb(color);
  const sRGB = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

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

export function improveContrast(fg: string, bg: string, targetRatio = 4.5): string {
  const bgLum = getRelativeLuminance(bg);
  const isDarkBg = bgLum < 0.5;
  const { r, g, b } = hexToRgb(fg);
  const hsl = rgbToHsl(r, g, b);

  let currentL = hsl.l;
  let bestHex = fg;
  let bestRatio = getContrastRatio(fg, bg);

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
  surfaceHover?: string;
  surfaceActive?: string;
  backgroundElevated?: string;
  backgroundSubtle?: string;
  surfaceSecondary?: string;
  surfaceTertiary?: string;
  text: string;
  textMuted?: string;
  textSubtle?: string;
  textInverse?: string;
  accent: string;
  accentHover?: string;
  accentActive?: string;
  accentSoft?: string;
  accentContrast?: string;
  border?: string;
  borderSubtle?: string;
  borderStrong?: string;
  divider?: string;
  controlBg?: string;
  controlBorder?: string;
  controlHover?: string;
  focus?: string;
  selection?: string;
  disabled?: string;
  overlay?: string;
  backdrop?: string;
  shadow?: string;
  glassBg?: string;
  glassBorder?: string;
  glassBlur?: string;
  themeGradient?: string;
  glowColor?: string;
  glowIntensity?: number;
  shadowAccent?: string;
  canvasGridColor?: string;
  canvasNodeBorder?: string;
  canvasEdgeColor?: string;
  artworkBg?: string;
  metadataSurface?: string;
  scrollbarThumb?: string;
  scrollbarTrack?: string;
  radiusBase?: string;
  borderWidth?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
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
  const surfaceHover = core.surfaceHover ? normalizeColor(core.surfaceHover) : rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);

  const activeHsl = isDark 
    ? { ...surfaceHsl, l: Math.min(98, surfaceHsl.l + 9) }
    : { ...surfaceHsl, l: Math.max(2, surfaceHsl.l - 8) };
  const activeRgb = hslToRgb(activeHsl.h, activeHsl.s, activeHsl.l);
  const surfaceActive = core.surfaceActive ? normalizeColor(core.surfaceActive) : rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

  // Elevated background
  const elevHsl = isDark 
    ? { ...bgHsl, l: Math.min(95, bgHsl.l + 10) }
    : { ...bgHsl, l: Math.min(100, bgHsl.l + 4) };
  const elevRgb = hslToRgb(elevHsl.h, elevHsl.s, elevHsl.l);
  const defaultElevated = rgbToHex(elevRgb.r, elevRgb.g, elevRgb.b);
  const backgroundElevated = core.backgroundElevated ? normalizeColor(core.backgroundElevated, defaultElevated) : defaultElevated;

  // Subtle background
  const subtleBgHsl = isDark
    ? { ...bgHsl, l: Math.min(90, bgHsl.l + 2) }
    : { ...bgHsl, l: Math.max(5, bgHsl.l - 2) };
  const subtleBgRgb = hslToRgb(subtleBgHsl.h, subtleBgHsl.s, subtleBgHsl.l);
  const backgroundSubtle = core.backgroundSubtle ? normalizeColor(core.backgroundSubtle) : rgbToHex(subtleBgRgb.r, subtleBgRgb.g, subtleBgRgb.b);

  // Secondary & Tertiary Surfaces
  const surfaceSecondary = core.surfaceSecondary ? normalizeColor(core.surfaceSecondary) : surfaceHover;
  const surfaceTertiary = core.surfaceTertiary ? normalizeColor(core.surfaceTertiary) : surfaceActive;

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
  const defaultSubtle = rgbToHex(subtleRgb.r, subtleRgb.g, subtleRgb.b);
  const textSubtle = core.textSubtle ? normalizeColor(core.textSubtle, defaultSubtle) : defaultSubtle;

  const textInverse = core.textInverse ? normalizeColor(core.textInverse) : (isDark ? '#050505' : '#FFFFFF');

  // Borders
  const borderOpacity = isDark ? 0.12 : 0.08;
  const defaultBorder = isDark ? `rgba(255, 255, 255, ${borderOpacity})` : `rgba(0, 0, 0, ${borderOpacity})`;
  const border = core.border ? normalizeColor(core.border, defaultBorder) : defaultBorder;
  const borderSubtle = core.borderSubtle ? normalizeColor(core.borderSubtle) : (isDark ? `rgba(255, 255, 255, 0.06)` : `rgba(0, 0, 0, 0.05)`);
  const borderStrong = core.borderStrong ? normalizeColor(core.borderStrong) : (isDark ? `rgba(255, 255, 255, 0.25)` : `rgba(0, 0, 0, 0.18)`);
  const divider = core.divider ? normalizeColor(core.divider) : borderSubtle;

  // Accent states
  const accentHoverHsl = { ...accentHsl, l: Math.min(95, accentHsl.l + 8) };
  const accentHoverRgb = hslToRgb(accentHoverHsl.h, accentHoverHsl.s, accentHoverHsl.l);
  const accentHover = core.accentHover ? normalizeColor(core.accentHover) : rgbToHex(accentHoverRgb.r, accentHoverRgb.g, accentHoverRgb.b);

  const accentActiveHsl = { ...accentHsl, l: Math.max(5, accentHsl.l - 8) };
  const accentActiveRgb = hslToRgb(accentActiveHsl.h, accentActiveHsl.s, accentActiveHsl.l);
  const accentActive = core.accentActive ? normalizeColor(core.accentActive) : rgbToHex(accentActiveRgb.r, accentActiveRgb.g, accentActiveRgb.b);

  const accentSoft = core.accentSoft ? normalizeColor(core.accentSoft) : `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.15)`;
  const accentContrast = core.accentContrast ? normalizeColor(core.accentContrast) : (getRelativeLuminance(accent) > 0.4 ? '#050505' : '#FFFFFF');

  // Controls
  const controlBg = core.controlBg ? normalizeColor(core.controlBg) : surface;
  const controlBorder = core.controlBorder ? normalizeColor(core.controlBorder) : borderSubtle;
  const controlHover = core.controlHover ? normalizeColor(core.controlHover) : surfaceHover;

  // Focus & Selection
  const focus = core.focus ? normalizeColor(core.focus) : accent;
  const selection = core.selection ? normalizeColor(core.selection) : `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.22)`;
  const disabled = core.disabled ? normalizeColor(core.disabled) : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)');

  // Overlays & Atmosphere
  const overlay = core.overlay ? normalizeColor(core.overlay) : (isDark ? `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.9)` : `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.88)`);
  const backdrop = core.backdrop ? normalizeColor(core.backdrop) : (isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)');
  const shadow = core.shadow ? normalizeColor(core.shadow) : (isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.06)');

  // Glass
  const glassBg = core.glassBg ? normalizeColor(core.glassBg) : (isDark ? `rgba(${surfaceRgb.r}, ${surfaceRgb.g}, ${surfaceRgb.b}, 0.75)` : `rgba(${surfaceRgb.r}, ${surfaceRgb.g}, ${surfaceRgb.b}, 0.8)`);
  const glassBorder = core.glassBorder ? normalizeColor(core.glassBorder) : borderSubtle;
  const glassBlur = core.glassBlur || '16px';

  // Gradient
  const themeGradient = core.themeGradient || `radial-gradient(ellipse at 50% 0%, ${accentSoft} 0%, transparent 70%)`;

  // Canvas
  const canvasGridColor = core.canvasGridColor ? normalizeColor(core.canvasGridColor) : borderSubtle;
  const canvasNodeBorder = core.canvasNodeBorder ? normalizeColor(core.canvasNodeBorder) : border;
  const canvasEdgeColor = core.canvasEdgeColor ? normalizeColor(core.canvasEdgeColor) : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)');

  // Artwork & Metadata
  const artworkBg = core.artworkBg ? normalizeColor(core.artworkBg) : (isDark ? '#000000' : '#E8E8E8');
  const metadataSurface = core.metadataSurface ? normalizeColor(core.metadataSurface) : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)');

  // Scrollbars
  const scrollbarThumb = core.scrollbarThumb ? normalizeColor(core.scrollbarThumb) : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)');
  const scrollbarTrack = core.scrollbarTrack ? normalizeColor(core.scrollbarTrack) : 'transparent';

  // Structure
  const radiusBase = core.radiusBase || '8px';
  const borderWidth = core.borderWidth || '1px';

  // Status
  const success = core.success ? normalizeColor(core.success) : '#10B981';
  const warning = core.warning ? normalizeColor(core.warning) : '#F59E0B';
  const error = core.error ? normalizeColor(core.error) : '#EF4444';
  const info = core.info ? normalizeColor(core.info) : accent;

  return {
    background: bg,
    backgroundElevated,
    backgroundSubtle,
    surface,
    surfaceHover,
    surfaceActive,
    surfaceSecondary,
    surfaceTertiary,
    text,
    textMuted,
    textSubtle,
    textInverse,
    border,
    borderSubtle,
    borderStrong,
    divider,
    accent,
    accentHover,
    accentActive,
    accentSoft,
    accentContrast,
    controlBg,
    controlBorder,
    controlHover,
    focus,
    selection,
    disabled,
    overlay,
    backdrop,
    shadow,
    glassBg,
    glassBorder,
    glassBlur,
    themeGradient,
    glowColor: core.glowColor,
    glowIntensity: core.glowIntensity,
    shadowAccent: core.shadowAccent,
    canvasGridColor,
    canvasNodeBorder,
    canvasEdgeColor,
    artworkBg,
    metadataSurface,
    scrollbarThumb,
    scrollbarTrack,
    radiusBase,
    borderWidth,
    success,
    warning,
    error,
    info,
  };
}

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

export function generateTastefulPalette(preferredDark?: boolean): ThemeTokens {
  const isDark = preferredDark !== undefined ? preferredDark : Math.random() > 0.25;
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(20 + Math.random() * 40);

  const bgL = isDark ? Math.floor(3 + Math.random() * 6) : Math.floor(94 + Math.random() * 4);
  const bgRgb = hslToRgb(hue, saturation * 0.4, bgL);
  const background = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);

  const textL = isDark ? Math.floor(90 + Math.random() * 6) : Math.floor(10 + Math.random() * 8);
  const textRgb = hslToRgb(hue, saturation * 0.1, textL);
  const text = rgbToHex(textRgb.r, textRgb.g, textRgb.b);

  const accentHue = (hue + Math.floor(30 + Math.random() * 180)) % 360;
  const accentSat = Math.floor(60 + Math.random() * 35);
  const accentL = isDark ? Math.floor(55 + Math.random() * 20) : Math.floor(35 + Math.random() * 20);
  const accentRgb = hslToRgb(accentHue, accentSat, accentL);
  const accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);

  return deriveCompleteThemeTokens({ background, text, accent, isDark });
}

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
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
        let mostVibrantHex = '';
        let maxVibrancy = -1;

        for (let i = 0; i < imgData.length; i += 16) {
          const a = imgData[i + 3];
          if (a < 128) continue;

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          totalR += r;
          totalG += g;
          totalB += b;
          pixelCount++;

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

        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);
        const avgHsl = rgbToHsl(avgR, avgG, avgB);

        const darkBgHsl = { h: avgHsl.h, s: Math.min(avgHsl.s, 25), l: 5 };
        const darkBgRgb = hslToRgb(darkBgHsl.h, darkBgHsl.s, darkBgHsl.l);
        const background = rgbToHex(darkBgRgb.r, darkBgRgb.g, darkBgRgb.b);
        const text = '#EDEDED';
        const accent = mostVibrantHex || rgbToHex(avgR, avgG, avgB);

        resolve(deriveCompleteThemeTokens({ background, text, accent, isDark: true }));
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

export function exportPaletteToJson(palette: CustomPalette | ThemeDefinition): string {
  const exportData = {
    version: '2.0.0',
    name: palette.name,
    isDark: palette.isDark,
    baseThemeId: (palette as CustomPalette).baseThemeId || palette.id,
    typography: (palette as CustomPalette).typography || (palette as ThemeDefinition).defaultTypography,
    shapeLanguage: (palette as CustomPalette).shapeLanguage || (palette as ThemeDefinition).defaultShape,
    density: (palette as CustomPalette).density || (palette as ThemeDefinition).defaultDensity,
    texture: (palette as CustomPalette).texture || (palette as ThemeDefinition).defaultTexture,
    radiusBase: (palette as CustomPalette).radiusBase || palette.tokens.radiusBase,
    borderWidth: (palette as CustomPalette).borderWidth || palette.tokens.borderWidth,
    glassIntensity: (palette as CustomPalette).glassIntensity,
    shadowIntensity: (palette as CustomPalette).shadowIntensity,
    glowIntensity: (palette as CustomPalette).glowIntensity || (palette as ThemeDefinition).glowIntensity || palette.tokens.glowIntensity,
    animationIntensity: (palette as CustomPalette).animationIntensity,
    tokens: palette.tokens,
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
    if (!raw.background || !raw.text || !raw.accent) return null;

    const isDark = typeof data.isDark === 'boolean' ? data.isDark : true;
    const sanitizedTokens = deriveCompleteThemeTokens({
      ...raw,
      background: normalizeColor(raw.background, isDark ? '#050505' : '#FFFFFF'),
      text: normalizeColor(raw.text, isDark ? '#EDEDED' : '#111111'),
      accent: normalizeColor(raw.accent, '#38BDF8'),
      isDark,
    });

    // Validate optional properties
    const validTypo = ['neutral', 'editorial', 'modern', 'neo-grotesk', 'humanist', 'classical', 'literary', 'newspaper', 'fashion', 'art-book', 'brutalist', 'technical', 'mono', 'futuristic', 'cinema', 'archive', 'contemporary', 'minimal', 'luxury'];
    const validShape = ['sharp', 'subtle', 'rounded', 'soft', 'editorial'];
    const validDensity = ['spacious', 'relaxed', 'balanced', 'dense', 'compact'];
    const validTexture = ['none', 'fine-grain', 'paper', 'dust', 'grid', 'technical-grid', 'noise', 'fabric', 'film-grain'];
    const validMotion = ['static', 'minimal', 'smooth', 'cinematic'];

    return {
      name: data.name.trim().slice(0, 40),
      baseThemeId: typeof data.baseThemeId === 'string' ? data.baseThemeId : 'default',
      isDark,
      typography: validTypo.includes(data.typography) ? data.typography : undefined,
      shapeLanguage: validShape.includes(data.shapeLanguage) ? data.shapeLanguage : undefined,
      density: validDensity.includes(data.density) ? data.density : undefined,
      texture: validTexture.includes(data.texture) ? data.texture : undefined,
      radiusBase: typeof data.radiusBase === 'string' ? data.radiusBase : sanitizedTokens.radiusBase,
      borderWidth: typeof data.borderWidth === 'string' ? data.borderWidth : sanitizedTokens.borderWidth,
      glassIntensity: typeof data.glassIntensity === 'number' && !isNaN(data.glassIntensity) ? Math.max(0, Math.min(1, data.glassIntensity)) : undefined,
      shadowIntensity: typeof data.shadowIntensity === 'number' && !isNaN(data.shadowIntensity) ? Math.max(0, Math.min(2, data.shadowIntensity)) : undefined,
      glowIntensity: typeof data.glowIntensity === 'number' && !isNaN(data.glowIntensity) ? Math.max(0, Math.min(2, data.glowIntensity)) : undefined,
      animationIntensity: validMotion.includes(data.animationIntensity) ? data.animationIntensity : undefined,
      tokens: sanitizedTokens,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// BUILT-IN CURATED THEMES
// ============================================================================

export const BUILTIN_THEMES: Record<string, ThemeDefinition> = {
  // --------------------------------------------------------------------------
  // EDITORIAL & ARTISTIC
  // --------------------------------------------------------------------------
  'swiss-international': {
    id: 'swiss-international',
    name: 'Swiss International',
    mood: 'Rational / Precise / Minimalist Grid',
    category: 'EDITORIAL',
    isDark: false,
    defaultTypography: 'neo-grotesk',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#FFFFFF',
      surface: '#F4F4F5',
      backgroundElevated: '#FFFFFF',
      backgroundSubtle: '#FAFAFA',
      surfaceSecondary: '#E4E4E7',
      surfaceTertiary: '#D4D4D8',
      text: '#09090B',
      textMuted: '#52525B',
      textSubtle: '#71717A',
      textInverse: '#FFFFFF',
      accent: '#DC2626', // Swiss vermilion red
      accentHover: '#B91C1C',
      accentActive: '#991B1B',
      accentSoft: 'rgba(220, 38, 38, 0.1)',
      accentContrast: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.12)',
      borderSubtle: 'rgba(0, 0, 0, 0.06)',
      borderStrong: 'rgba(0, 0, 0, 0.22)',
      divider: 'rgba(0, 0, 0, 0.08)',
      controlBg: '#FFFFFF',
      controlBorder: 'rgba(0, 0, 0, 0.15)',
      controlHover: '#F4F4F5',
      canvasGridColor: 'rgba(0, 0, 0, 0.07)',
      canvasNodeBorder: 'rgba(0, 0, 0, 0.2)',
      canvasEdgeColor: 'rgba(220, 38, 38, 0.35)',
      artworkBg: '#F4F4F5',
      metadataSurface: '#F4F4F5',
      radiusBase: '0px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'art-book': {
    id: 'art-book',
    name: 'Art Book',
    mood: 'Archival / Exhibition Catalogue / Warm Paper',
    category: 'EDITORIAL',
    isDark: false,
    defaultTypography: 'art-book',
    defaultShape: 'editorial',
    defaultDensity: 'spacious',
    tokens: deriveCompleteThemeTokens({
      background: '#F8F5EE',
      surface: '#EFECE2',
      backgroundElevated: '#FCFAF5',
      backgroundSubtle: '#F4F0E6',
      surfaceSecondary: '#E4DFD3',
      surfaceTertiary: '#D9D3C5',
      text: '#1A1815',
      textMuted: '#6B665C',
      textSubtle: '#8C867A',
      textInverse: '#F8F5EE',
      accent: '#8C6D3F', // Warm bronze ochre
      accentHover: '#735730',
      accentActive: '#5A4323',
      accentSoft: 'rgba(140, 109, 63, 0.12)',
      accentContrast: '#FFFFFF',
      border: 'rgba(26, 24, 21, 0.09)',
      borderSubtle: 'rgba(26, 24, 21, 0.05)',
      borderStrong: 'rgba(26, 24, 21, 0.18)',
      divider: 'rgba(26, 24, 21, 0.07)',
      controlBg: '#FCFAF5',
      controlBorder: 'rgba(26, 24, 21, 0.12)',
      controlHover: '#EFECE2',
      canvasGridColor: 'rgba(26, 24, 21, 0.05)',
      canvasNodeBorder: 'rgba(26, 24, 21, 0.14)',
      canvasEdgeColor: 'rgba(140, 109, 63, 0.3)',
      artworkBg: '#EFECE2',
      metadataSurface: '#EFECE2',
      radiusBase: '2px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'modernist': {
    id: 'modernist',
    name: 'Modernist',
    mood: 'Architectural / Bauhaus / Stark Contrast',
    category: 'EDITORIAL',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#111215',
      surface: '#1A1B20',
      backgroundElevated: '#24262E',
      backgroundSubtle: '#15161A',
      surfaceSecondary: '#21232B',
      surfaceTertiary: '#2D303B',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textSubtle: '#64748B',
      textInverse: '#111215',
      accent: '#FACC15', // Bauhaus canary yellow
      accentHover: '#FDE047',
      accentActive: '#EAB308',
      accentSoft: 'rgba(250, 204, 21, 0.15)',
      accentContrast: '#0F1012',
      border: 'rgba(255, 255, 255, 0.14)',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(255, 255, 255, 0.28)',
      divider: 'rgba(255, 255, 255, 0.1)',
      controlBg: '#1A1B20',
      controlBorder: 'rgba(255, 255, 255, 0.18)',
      controlHover: '#24262E',
      canvasGridColor: 'rgba(255, 255, 255, 0.06)',
      canvasNodeBorder: 'rgba(250, 204, 21, 0.3)',
      canvasEdgeColor: 'rgba(250, 204, 21, 0.35)',
      artworkBg: '#090A0C',
      metadataSurface: '#1A1B20',
      radiusBase: '4px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  'neo-brutalist': {
    id: 'neo-brutalist',
    name: 'Neo-Brutalist',
    mood: 'Raw Structure / Heavy Ink / Hard Shadow',
    category: 'EDITORIAL',
    isDark: false,
    defaultTypography: 'brutalist',
    defaultShape: 'sharp',
    defaultDensity: 'dense',
    tokens: deriveCompleteThemeTokens({
      background: '#ECEBE4',
      surface: '#DFDED6',
      backgroundElevated: '#F5F4EE',
      backgroundSubtle: '#E5E4DC',
      surfaceSecondary: '#D4D3CB',
      surfaceTertiary: '#C8C7BF',
      text: '#000000',
      textMuted: '#333333',
      textSubtle: '#555555',
      textInverse: '#FFFFFF',
      accent: '#FACC15', // Shocking canary yellow
      accentHover: '#EAB308',
      accentActive: '#CA8A04',
      accentSoft: 'rgba(250, 204, 21, 0.25)',
      accentContrast: '#000000',
      border: '#000000',
      borderSubtle: 'rgba(0, 0, 0, 0.2)',
      borderStrong: '#000000',
      divider: '#000000',
      controlBg: '#FFFFFF',
      controlBorder: '#000000',
      controlHover: '#FACC15',
      canvasGridColor: 'rgba(0, 0, 0, 0.12)',
      canvasNodeBorder: '#000000',
      canvasEdgeColor: '#000000',
      artworkBg: '#DFDED6',
      metadataSurface: '#FFFFFF',
      radiusBase: '0px',
      borderWidth: '2px',
      shadow: 'rgba(0, 0, 0, 0.95)',
      isDark: false,
    }),
  },

  'neo-romantic': {
    id: 'neo-romantic',
    name: 'Neo-Romantic',
    mood: 'Dusky Plum / Silk Cream / Poetic Glow',
    category: 'EDITORIAL',
    isDark: true,
    defaultTypography: 'editorial',
    defaultShape: 'soft',
    defaultDensity: 'relaxed',
    glowColor: '#E0A3B5',
    glowIntensity: 0.35,
    tokens: deriveCompleteThemeTokens({
      background: '#130D16',
      surface: '#1E1523',
      backgroundElevated: '#2A1E31',
      backgroundSubtle: '#18101C',
      surfaceSecondary: '#261B2D',
      surfaceTertiary: '#34253E',
      text: '#FAF0F4',
      textMuted: '#A6929F',
      textSubtle: '#786673',
      textInverse: '#130D16',
      accent: '#E0A3B5', // Dusty rose
      accentHover: '#F2BED0',
      accentActive: '#C8879B',
      accentSoft: 'rgba(224, 163, 181, 0.15)',
      accentContrast: '#130D16',
      border: 'rgba(224, 163, 181, 0.16)',
      borderSubtle: 'rgba(224, 163, 181, 0.08)',
      borderStrong: 'rgba(224, 163, 181, 0.32)',
      divider: 'rgba(224, 163, 181, 0.12)',
      controlBg: '#1E1523',
      controlBorder: 'rgba(224, 163, 181, 0.2)',
      controlHover: '#2A1E31',
      canvasGridColor: 'rgba(224, 163, 181, 0.06)',
      canvasNodeBorder: 'rgba(224, 163, 181, 0.3)',
      canvasEdgeColor: 'rgba(224, 163, 181, 0.35)',
      artworkBg: '#0B070D',
      metadataSurface: '#1E1523',
      radiusBase: '16px',
      borderWidth: '1px',
      themeGradient: 'radial-gradient(ellipse at 50% 0%, rgba(224, 163, 181, 0.18) 0%, transparent 70%)',
      glowColor: '#E0A3B5',
      glowIntensity: 0.35,
      isDark: true,
    }),
  },

  // --------------------------------------------------------------------------
  // ANALOG & NOSTALGIC
  // --------------------------------------------------------------------------
  'analog-archive': {
    id: 'analog-archive',
    name: 'Analog Archive',
    mood: 'Aged Manila / Sepia / Film Grain',
    category: 'ANALOG',
    isDark: false,
    defaultTypography: 'archive',
    defaultShape: 'subtle',
    defaultDensity: 'relaxed',
    defaultTexture: 'film-grain',
    tokens: deriveCompleteThemeTokens({
      background: '#EDE6D6',
      surface: '#DFD6C2',
      backgroundElevated: '#F6F0E4',
      backgroundSubtle: '#E7DEC9',
      surfaceSecondary: '#D4C9B3',
      surfaceTertiary: '#C7BBA2',
      text: '#2A241E',
      textMuted: '#6E6458',
      textSubtle: '#8C8072',
      textInverse: '#EDE6D6',
      accent: '#7C4D32', // Aged walnut
      accentHover: '#653D26',
      accentActive: '#4E2E1C',
      accentSoft: 'rgba(124, 77, 50, 0.14)',
      accentContrast: '#FFFFFF',
      border: 'rgba(42, 36, 30, 0.1)',
      borderSubtle: 'rgba(42, 36, 30, 0.05)',
      borderStrong: 'rgba(42, 36, 30, 0.22)',
      divider: 'rgba(42, 36, 30, 0.08)',
      controlBg: '#F6F0E4',
      controlBorder: 'rgba(42, 36, 30, 0.14)',
      controlHover: '#DFD6C2',
      canvasGridColor: 'rgba(42, 36, 30, 0.06)',
      canvasNodeBorder: 'rgba(42, 36, 30, 0.16)',
      canvasEdgeColor: 'rgba(124, 77, 50, 0.35)',
      artworkBg: '#DFD6C2',
      metadataSurface: '#DFD6C2',
      radiusBase: '4px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'darkroom': {
    id: 'darkroom',
    name: 'Darkroom',
    mood: 'Silver Gelatin / Safe-Light Amber / Monochrome',
    category: 'ANALOG',
    isDark: true,
    defaultTypography: 'technical',
    defaultShape: 'sharp',
    defaultDensity: 'dense',
    glowColor: '#E07A1F',
    glowIntensity: 0.25,
    tokens: deriveCompleteThemeTokens({
      background: '#0B0C0E',
      surface: '#141619',
      backgroundElevated: '#1D2024',
      backgroundSubtle: '#0F1013',
      surfaceSecondary: '#1C1F23',
      surfaceTertiary: '#25292F',
      text: '#E6E9EC',
      textMuted: '#7D8690',
      textSubtle: '#525961',
      textInverse: '#0B0C0E',
      accent: '#E07A1F', // Safe-light amber
      accentHover: '#F59338',
      accentActive: '#C46412',
      accentSoft: 'rgba(224, 122, 31, 0.16)',
      accentContrast: '#0B0C0E',
      border: 'rgba(255, 255, 255, 0.1)',
      borderSubtle: 'rgba(255, 255, 255, 0.05)',
      borderStrong: 'rgba(255, 255, 255, 0.22)',
      divider: 'rgba(255, 255, 255, 0.08)',
      controlBg: '#141619',
      controlBorder: 'rgba(255, 255, 255, 0.12)',
      controlHover: '#1D2024',
      canvasGridColor: 'rgba(255, 255, 255, 0.05)',
      canvasNodeBorder: 'rgba(224, 122, 31, 0.3)',
      canvasEdgeColor: 'rgba(224, 122, 31, 0.35)',
      artworkBg: '#050607',
      metadataSurface: '#141619',
      radiusBase: '0px',
      borderWidth: '1px',
      glowColor: '#E07A1F',
      glowIntensity: 0.25,
      isDark: true,
    }),
  },

  'vintage-library': {
    id: 'vintage-library',
    name: 'Vintage Library',
    mood: 'Polished Walnut / Parchment / Gold Leaf',
    category: 'ANALOG',
    isDark: true,
    defaultTypography: 'classical',
    defaultShape: 'editorial',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#16110D',
      surface: '#221B14',
      backgroundElevated: '#30261D',
      backgroundSubtle: '#1C1611',
      surfaceSecondary: '#2B221A',
      surfaceTertiary: '#382D23',
      text: '#EFE7D7',
      textMuted: '#A19481',
      textSubtle: '#736859',
      textInverse: '#16110D',
      accent: '#2E5D46', // British racing green
      accentHover: '#3A7458',
      accentActive: '#224634',
      accentSoft: 'rgba(46, 93, 70, 0.2)',
      accentContrast: '#FFFFFF',
      border: 'rgba(212, 175, 55, 0.18)', // Gold leaf accent border
      borderSubtle: 'rgba(212, 175, 55, 0.08)',
      borderStrong: 'rgba(212, 175, 55, 0.35)',
      divider: 'rgba(212, 175, 55, 0.12)',
      controlBg: '#221B14',
      controlBorder: 'rgba(212, 175, 55, 0.22)',
      controlHover: '#30261D',
      canvasGridColor: 'rgba(212, 175, 55, 0.06)',
      canvasNodeBorder: 'rgba(212, 175, 55, 0.3)',
      canvasEdgeColor: 'rgba(46, 93, 70, 0.4)',
      artworkBg: '#0E0B08',
      metadataSurface: '#221B14',
      radiusBase: '4px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  'retro-futurism': {
    id: 'retro-futurism',
    name: 'Retro Futurism',
    mood: '1960s Space Age / Bakelite / International Orange',
    category: 'ANALOG',
    isDark: false,
    defaultTypography: 'futuristic',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#F1EDE6',
      surface: '#E4DDD2',
      backgroundElevated: '#FAF8F4',
      backgroundSubtle: '#ECE6DC',
      surfaceSecondary: '#D8CFBF',
      surfaceTertiary: '#CBBFA9',
      text: '#1C1A18',
      textMuted: '#68625B',
      textSubtle: '#88827A',
      textInverse: '#F1EDE6',
      accent: '#FF4F00', // International orange
      accentHover: '#E04500',
      accentActive: '#C23C00',
      accentSoft: 'rgba(255, 79, 0, 0.15)',
      accentContrast: '#FFFFFF',
      border: 'rgba(28, 26, 24, 0.12)',
      borderSubtle: 'rgba(28, 26, 24, 0.06)',
      borderStrong: 'rgba(28, 26, 24, 0.25)',
      divider: 'rgba(28, 26, 24, 0.09)',
      controlBg: '#FAF8F4',
      controlBorder: 'rgba(28, 26, 24, 0.16)',
      controlHover: '#E4DDD2',
      canvasGridColor: 'rgba(28, 26, 24, 0.06)',
      canvasNodeBorder: 'rgba(255, 79, 0, 0.3)',
      canvasEdgeColor: 'rgba(255, 79, 0, 0.35)',
      artworkBg: '#E4DDD2',
      metadataSurface: '#E4DDD2',
      radiusBase: '14px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'y2k-digital': {
    id: 'y2k-digital',
    name: 'Y2K Digital',
    mood: 'Translucent Indigo / Liquid Cyan / Chrome Sheen',
    category: 'ANALOG',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    glowColor: '#00F5D4',
    glowIntensity: 0.45,
    tokens: deriveCompleteThemeTokens({
      background: '#090D1A',
      surface: '#11172A',
      backgroundElevated: '#1A233E',
      backgroundSubtle: '#0D1222',
      surfaceSecondary: '#172038',
      surfaceTertiary: '#202B4B',
      text: '#F0F4FA',
      textMuted: '#8797B2',
      textSubtle: '#5C6D88',
      textInverse: '#090D1A',
      accent: '#00F5D4', // Electric aqua
      accentHover: '#33F7DD',
      accentActive: '#00D1B5',
      accentSoft: 'rgba(0, 245, 212, 0.18)',
      accentContrast: '#090D1A',
      border: 'rgba(0, 245, 212, 0.22)',
      borderSubtle: 'rgba(0, 245, 212, 0.1)',
      borderStrong: 'rgba(0, 245, 212, 0.45)',
      divider: 'rgba(0, 245, 212, 0.15)',
      controlBg: '#11172A',
      controlBorder: 'rgba(0, 245, 212, 0.25)',
      controlHover: '#1A233E',
      canvasGridColor: 'rgba(0, 245, 212, 0.08)',
      canvasNodeBorder: 'rgba(0, 245, 212, 0.4)',
      canvasEdgeColor: 'rgba(0, 245, 212, 0.4)',
      artworkBg: '#05070E',
      metadataSurface: '#11172A',
      radiusBase: '16px',
      borderWidth: '1px',
      glassBlur: '20px',
      themeGradient: 'radial-gradient(ellipse at 50% 0%, rgba(0, 245, 212, 0.2) 0%, rgba(157, 78, 221, 0.15) 50%, transparent 80%)',
      glowColor: '#00F5D4',
      glowIntensity: 0.45,
      isDark: true,
    }),
  },

  // --------------------------------------------------------------------------
  // NATURAL & ATMOSPHERIC
  // --------------------------------------------------------------------------
  'botanical': {
    id: 'botanical',
    name: 'Botanical',
    mood: 'Pressed Flora / Herbarium Sage / Peat Stone',
    category: 'NATURAL',
    isDark: false,
    defaultTypography: 'humanist',
    defaultShape: 'rounded',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#F4F4EB',
      surface: '#E7E8DC',
      backgroundElevated: '#FAFBF4',
      backgroundSubtle: '#ECECE1',
      surfaceSecondary: '#DCDECF',
      surfaceTertiary: '#CFD1C0',
      text: '#1D231C',
      textMuted: '#586455',
      textSubtle: '#7A8677',
      textInverse: '#F4F4EB',
      accent: '#3F634A', // Deep botanical sage
      accentHover: '#33503C',
      accentActive: '#263D2D',
      accentSoft: 'rgba(63, 99, 74, 0.14)',
      accentContrast: '#FFFFFF',
      border: 'rgba(29, 35, 28, 0.1)',
      borderSubtle: 'rgba(29, 35, 28, 0.05)',
      borderStrong: 'rgba(29, 35, 28, 0.2)',
      divider: 'rgba(29, 35, 28, 0.07)',
      controlBg: '#FAFBF4',
      controlBorder: 'rgba(29, 35, 28, 0.12)',
      controlHover: '#E7E8DC',
      canvasGridColor: 'rgba(29, 35, 28, 0.06)',
      canvasNodeBorder: 'rgba(63, 99, 74, 0.25)',
      canvasEdgeColor: 'rgba(63, 99, 74, 0.35)',
      artworkBg: '#E7E8DC',
      metadataSurface: '#E7E8DC',
      radiusBase: '16px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'terracotta': {
    id: 'terracotta',
    name: 'Terracotta',
    mood: 'Sun-Baked Adobe / Raw Clay / Burnt Sienna',
    category: 'NATURAL',
    isDark: false,
    defaultTypography: 'contemporary',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#F7F2EC',
      surface: '#ECE2D6',
      backgroundElevated: '#FAF6F1',
      backgroundSubtle: '#F2E9DE',
      surfaceSecondary: '#E0D3C4',
      surfaceTertiary: '#D2C2B0',
      text: '#2A1C17',
      textMuted: '#70584F',
      textSubtle: '#91786E',
      textInverse: '#F7F2EC',
      accent: '#C4572F', // Burnt terracotta
      accentHover: '#AC4A26',
      accentActive: '#923C1E',
      accentSoft: 'rgba(196, 87, 47, 0.14)',
      accentContrast: '#FFFFFF',
      border: 'rgba(42, 28, 23, 0.1)',
      borderSubtle: 'rgba(42, 28, 23, 0.05)',
      borderStrong: 'rgba(42, 28, 23, 0.22)',
      divider: 'rgba(42, 28, 23, 0.08)',
      controlBg: '#FAF6F1',
      controlBorder: 'rgba(42, 28, 23, 0.14)',
      controlHover: '#ECE2D6',
      canvasGridColor: 'rgba(42, 28, 23, 0.06)',
      canvasNodeBorder: 'rgba(196, 87, 47, 0.28)',
      canvasEdgeColor: 'rgba(196, 87, 47, 0.35)',
      artworkBg: '#ECE2D6',
      metadataSurface: '#ECE2D6',
      radiusBase: '10px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'alpine': {
    id: 'alpine',
    name: 'Alpine',
    mood: 'Glacial Slate / Frost Silver / Cold Pine',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'minimal',
    defaultShape: 'subtle',
    defaultDensity: 'spacious',
    tokens: deriveCompleteThemeTokens({
      background: '#0C1016',
      surface: '#151C26',
      backgroundElevated: '#202A39',
      backgroundSubtle: '#0F151E',
      surfaceSecondary: '#1C2533',
      surfaceTertiary: '#253244',
      text: '#F8FAFC',
      textMuted: '#89A1B8',
      textSubtle: '#5F768E',
      textInverse: '#0C1016',
      accent: '#67E8F9', // Glacial cyan
      accentHover: '#A5F3FC',
      accentActive: '#22D3EE',
      accentSoft: 'rgba(103, 232, 249, 0.16)',
      accentContrast: '#0C1016',
      border: 'rgba(103, 232, 249, 0.15)',
      borderSubtle: 'rgba(103, 232, 249, 0.08)',
      borderStrong: 'rgba(103, 232, 249, 0.3)',
      divider: 'rgba(103, 232, 249, 0.1)',
      controlBg: '#151C26',
      controlBorder: 'rgba(103, 232, 249, 0.18)',
      controlHover: '#202A39',
      canvasGridColor: 'rgba(103, 232, 249, 0.06)',
      canvasNodeBorder: 'rgba(103, 232, 249, 0.35)',
      canvasEdgeColor: 'rgba(103, 232, 249, 0.35)',
      artworkBg: '#070A0F',
      metadataSurface: '#151C26',
      radiusBase: '6px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  'desert-dusk': {
    id: 'desert-dusk',
    name: 'Desert Dusk',
    mood: 'Twilight Sandstone / Warm Ochre / Dusty Lilac',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'editorial',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#1A121E',
      surface: '#281B2D',
      backgroundElevated: '#38253F',
      backgroundSubtle: '#201625',
      surfaceSecondary: '#312137',
      surfaceTertiary: '#3E2B46',
      text: '#FDF1EE',
      textMuted: '#A78C98',
      textSubtle: '#78626C',
      textInverse: '#1A121E',
      accent: '#F4A261', // Sandstone ochre
      accentHover: '#F6B27C',
      accentActive: '#E76F51',
      accentSoft: 'rgba(244, 162, 97, 0.18)',
      accentContrast: '#1A121E',
      border: 'rgba(244, 162, 97, 0.18)',
      borderSubtle: 'rgba(244, 162, 97, 0.08)',
      borderStrong: 'rgba(244, 162, 97, 0.35)',
      divider: 'rgba(244, 162, 97, 0.12)',
      controlBg: '#281B2D',
      controlBorder: 'rgba(244, 162, 97, 0.22)',
      controlHover: '#38253F',
      canvasGridColor: 'rgba(244, 162, 97, 0.06)',
      canvasNodeBorder: 'rgba(244, 162, 97, 0.35)',
      canvasEdgeColor: 'rgba(244, 162, 97, 0.35)',
      artworkBg: '#100B13',
      metadataSurface: '#281B2D',
      radiusBase: '12px',
      borderWidth: '1px',
      themeGradient: 'radial-gradient(ellipse at 50% 0%, rgba(244, 162, 97, 0.16) 0%, rgba(192, 132, 252, 0.12) 50%, transparent 75%)',
      isDark: true,
    }),
  },

  'oceanic': {
    id: 'oceanic',
    name: 'Oceanic',
    mood: 'Abyssal Navy / Sea-Glass Teal / Bioluminescent Depth',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'rounded',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#040B16',
      surface: '#091526',
      backgroundElevated: '#0F213A',
      backgroundSubtle: '#06101F',
      surfaceSecondary: '#0C1C32',
      surfaceTertiary: '#122642',
      text: '#E5F6F8',
      textMuted: '#67899B',
      textSubtle: '#476372',
      textInverse: '#040B16',
      accent: '#2DD4BF', // Sea-glass teal
      accentHover: '#5EEAD4',
      accentActive: '#14B8A6',
      accentSoft: 'rgba(45, 212, 191, 0.18)',
      accentContrast: '#040B16',
      border: 'rgba(45, 212, 191, 0.2)',
      borderSubtle: 'rgba(45, 212, 191, 0.08)',
      borderStrong: 'rgba(45, 212, 191, 0.38)',
      divider: 'rgba(45, 212, 191, 0.12)',
      controlBg: '#091526',
      controlBorder: 'rgba(45, 212, 191, 0.22)',
      controlHover: '#0F213A',
      canvasGridColor: 'rgba(45, 212, 191, 0.06)',
      canvasNodeBorder: 'rgba(45, 212, 191, 0.35)',
      canvasEdgeColor: 'rgba(45, 212, 191, 0.35)',
      artworkBg: '#02060C',
      metadataSurface: '#091526',
      radiusBase: '14px',
      borderWidth: '1px',
      themeGradient: 'radial-gradient(ellipse at 50% 0%, rgba(45, 212, 191, 0.18) 0%, rgba(6, 182, 212, 0.1) 60%, transparent 80%)',
      isDark: true,
    }),
  },

  // --------------------------------------------------------------------------
  // DIGITAL & EXPERIMENTAL
  // --------------------------------------------------------------------------
  'terminal': {
    id: 'terminal',
    name: 'Terminal',
    mood: 'Phosphor CRT / Telemetry / Utilitarian Monospace',
    category: 'DIGITAL',
    isDark: true,
    defaultTypography: 'mono',
    defaultShape: 'sharp',
    defaultDensity: 'dense',
    defaultTexture: 'grid',
    glowColor: '#22C55E',
    glowIntensity: 0.3,
    tokens: deriveCompleteThemeTokens({
      background: '#040704',
      surface: '#0A110A',
      backgroundElevated: '#101B10',
      backgroundSubtle: '#060B06',
      surfaceSecondary: '#0E170E',
      surfaceTertiary: '#142114',
      text: '#CEF7DF',
      textMuted: '#467B54',
      textSubtle: '#2E5438',
      textInverse: '#040704',
      accent: '#22C55E', // Matrix phosphor green
      accentHover: '#4ADE80',
      accentActive: '#16A34A',
      accentSoft: 'rgba(34, 197, 94, 0.18)',
      accentContrast: '#040704',
      border: 'rgba(34, 197, 94, 0.25)',
      borderSubtle: 'rgba(34, 197, 94, 0.12)',
      borderStrong: 'rgba(34, 197, 94, 0.45)',
      divider: 'rgba(34, 197, 94, 0.16)',
      controlBg: '#0A110A',
      controlBorder: 'rgba(34, 197, 94, 0.3)',
      controlHover: '#101B10',
      canvasGridColor: 'rgba(34, 197, 94, 0.1)',
      canvasNodeBorder: 'rgba(34, 197, 94, 0.4)',
      canvasEdgeColor: 'rgba(34, 197, 94, 0.4)',
      artworkBg: '#020402',
      metadataSurface: '#0A110A',
      radiusBase: '0px',
      borderWidth: '1px',
      glowColor: '#22C55E',
      glowIntensity: 0.3,
      isDark: true,
    }),
  },

  'cybernetic': {
    id: 'cybernetic',
    name: 'Cybernetic',
    mood: 'High-Frequency Cyan / Neural Purple / Sharp Chamfer',
    category: 'DIGITAL',
    isDark: true,
    defaultTypography: 'futuristic',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    glowColor: '#00F0FF',
    glowIntensity: 0.5,
    tokens: deriveCompleteThemeTokens({
      background: '#090A0D',
      surface: '#12141A',
      backgroundElevated: '#1B1E27',
      backgroundSubtle: '#0D0E12',
      surfaceSecondary: '#161922',
      surfaceTertiary: '#1F232F',
      text: '#F0F4F8',
      textMuted: '#79879B',
      textSubtle: '#515B6A',
      textInverse: '#090A0D',
      accent: '#00F0FF', // Electric cyan
      accentHover: '#4DF4FF',
      accentActive: '#00C8D4',
      accentSoft: 'rgba(0, 240, 255, 0.2)',
      accentContrast: '#090A0D',
      border: 'rgba(0, 240, 255, 0.25)',
      borderSubtle: 'rgba(0, 240, 255, 0.1)',
      borderStrong: 'rgba(0, 240, 255, 0.5)',
      divider: 'rgba(0, 240, 255, 0.16)',
      controlBg: '#12141A',
      controlBorder: 'rgba(0, 240, 255, 0.3)',
      controlHover: '#1B1E27',
      canvasGridColor: 'rgba(0, 240, 255, 0.08)',
      canvasNodeBorder: 'rgba(0, 240, 255, 0.45)',
      canvasEdgeColor: 'rgba(0, 240, 255, 0.4)',
      artworkBg: '#050507',
      metadataSurface: '#12141A',
      radiusBase: '2px',
      borderWidth: '1px',
      glowColor: '#00F0FF',
      glowIntensity: 0.5,
      isDark: true,
    }),
  },

  'prismatic': {
    id: 'prismatic',
    name: 'Prismatic',
    mood: 'Iridescent Dispersion / Optical White / Neutral Glass',
    category: 'DIGITAL',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#07080B',
      surface: '#0F1116',
      backgroundElevated: '#181B22',
      backgroundSubtle: '#0B0C10',
      surfaceSecondary: '#14171E',
      surfaceTertiary: '#1D212B',
      text: '#F8FAFC',
      textMuted: '#92A0B3',
      textSubtle: '#626D7C',
      textInverse: '#07080B',
      accent: '#06B6D4', // Prismatic cyan
      accentHover: '#22D3EE',
      accentActive: '#0891B2',
      accentSoft: 'rgba(6, 182, 212, 0.18)',
      accentContrast: '#07080B',
      border: 'rgba(255, 255, 255, 0.14)',
      borderSubtle: 'rgba(255, 255, 255, 0.07)',
      borderStrong: 'rgba(255, 255, 255, 0.28)',
      divider: 'rgba(255, 255, 255, 0.1)',
      controlBg: '#0F1116',
      controlBorder: 'rgba(255, 255, 255, 0.18)',
      controlHover: '#181B22',
      canvasGridColor: 'rgba(255, 255, 255, 0.06)',
      canvasNodeBorder: 'rgba(6, 182, 212, 0.35)',
      canvasEdgeColor: 'rgba(6, 182, 212, 0.35)',
      artworkBg: '#030406',
      metadataSurface: '#0F1116',
      radiusBase: '10px',
      borderWidth: '1px',
      themeGradient: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(139,92,246,0.12) 50%, rgba(6,182,212,0.12) 100%)',
      isDark: true,
    }),
  },

  'aurora-glass': {
    id: 'aurora-glass',
    name: 'Aurora Glass',
    mood: 'Nocturnal Frosted Glass / Atmospheric Borealis / Soft Glow',
    category: 'DIGITAL',
    isDark: true,
    defaultTypography: 'contemporary',
    defaultShape: 'rounded',
    defaultDensity: 'relaxed',
    glowColor: '#10B981',
    glowIntensity: 0.35,
    tokens: deriveCompleteThemeTokens({
      background: '#060B15',
      surface: '#0D1626',
      backgroundElevated: '#142138',
      backgroundSubtle: '#09101E',
      surfaceSecondary: '#111B2E',
      surfaceTertiary: '#182740',
      text: '#EEFBF4',
      textMuted: '#709C8D',
      textSubtle: '#4D6E63',
      textInverse: '#060B15',
      accent: '#10B981', // Northern emerald
      accentHover: '#34D399',
      accentActive: '#059669',
      accentSoft: 'rgba(16, 185, 129, 0.2)',
      accentContrast: '#060B15',
      border: 'rgba(16, 185, 129, 0.2)',
      borderSubtle: 'rgba(16, 185, 129, 0.08)',
      borderStrong: 'rgba(16, 185, 129, 0.4)',
      divider: 'rgba(16, 185, 129, 0.12)',
      controlBg: '#0D1626',
      controlBorder: 'rgba(16, 185, 129, 0.22)',
      controlHover: '#142138',
      canvasGridColor: 'rgba(16, 185, 129, 0.06)',
      canvasNodeBorder: 'rgba(16, 185, 129, 0.35)',
      canvasEdgeColor: 'rgba(16, 185, 129, 0.35)',
      artworkBg: '#03060C',
      metadataSurface: '#0D1626',
      radiusBase: '16px',
      borderWidth: '1px',
      glassBlur: '24px',
      themeGradient: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.2) 0%, rgba(45, 212, 191, 0.15) 45%, transparent 75%)',
      glowColor: '#10B981',
      glowIntensity: 0.35,
      isDark: true,
    }),
  },

  'liquid-chrome': {
    id: 'liquid-chrome',
    name: 'Liquid Chrome',
    mood: 'Polished Platinum / Specular Metallic / Precision Alloy',
    category: 'DIGITAL',
    isDark: true,
    defaultTypography: 'luxury',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#0D0F12',
      surface: '#16191E',
      backgroundElevated: '#20242B',
      backgroundSubtle: '#111317',
      surfaceSecondary: '#1B1E24',
      surfaceTertiary: '#252A33',
      text: '#FFFFFF',
      textMuted: '#9EA3AC',
      textSubtle: '#6A707A',
      textInverse: '#0D0F12',
      accent: '#E2E8F0', // Platinum silver
      accentHover: '#FFFFFF',
      accentActive: '#CBD5E1',
      accentSoft: 'rgba(255, 255, 255, 0.15)',
      accentContrast: '#0D0F12',
      border: 'rgba(255, 255, 255, 0.18)',
      borderSubtle: 'rgba(255, 255, 255, 0.09)',
      borderStrong: 'rgba(255, 255, 255, 0.38)',
      divider: 'rgba(255, 255, 255, 0.12)',
      controlBg: '#16191E',
      controlBorder: 'rgba(255, 255, 255, 0.22)',
      controlHover: '#20242B',
      canvasGridColor: 'rgba(255, 255, 255, 0.07)',
      canvasNodeBorder: 'rgba(255, 255, 255, 0.35)',
      canvasEdgeColor: 'rgba(255, 255, 255, 0.3)',
      artworkBg: '#07080A',
      metadataSurface: '#16191E',
      radiusBase: '8px',
      borderWidth: '1px',
      themeGradient: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
      isDark: true,
    }),
  },

  // --------------------------------------------------------------------------
  // CORE FOUNDATIONS & CLASSIC PALETTES
  // --------------------------------------------------------------------------
  default: {
    id: 'default',
    name: 'Default Light',
    mood: 'Neutral / Clean / Balanced',
    category: 'LIGHT',
    isDark: false,
    defaultTypography: 'neutral',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
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
      radiusBase: '8px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  'default-dark': {
    id: 'default-dark',
    name: 'Default Dark',
    mood: 'Neutral / Clean Dark / Deep Carbon',
    category: 'DARK',
    isDark: true,
    defaultTypography: 'neutral',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#09090B',
      backgroundElevated: '#18181B',
      surface: '#121215',
      surfaceHover: '#1E1E22',
      surfaceActive: '#27272C',
      text: '#FAFAFA',
      textMuted: '#A1A1AA',
      textSubtle: '#71717A',
      textInverse: '#09090B',
      border: 'rgba(255, 255, 255, 0.12)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
      borderStrong: 'rgba(255, 255, 255, 0.24)',
      accent: '#FAFAFA',
      accentHover: '#FFFFFF',
      accentActive: '#E4E4E7',
      accentSoft: 'rgba(250, 250, 250, 0.12)',
      accentContrast: '#09090B',
      focus: '#FAFAFA',
      selection: 'rgba(250, 250, 250, 0.18)',
      overlay: 'rgba(9, 9, 11, 0.9)',
      shadow: 'rgba(0, 0, 0, 0.7)',
      radiusBase: '8px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    mood: 'Dark / Luxurious / Cinematic',
    category: 'DARK',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
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
      radiusBase: '4px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  paper: {
    id: 'paper',
    name: 'Paper',
    mood: 'Editorial / Bookish / Archival',
    category: 'ARCHIVAL',
    isDark: false,
    defaultTypography: 'editorial',
    defaultShape: 'editorial',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#F4EEDD',
      backgroundElevated: '#FAF8F2',
      surface: '#EADDCE',
      surfaceHover: '#DFD2C2',
      surfaceActive: '#D4C6B5',
      text: '#2C2A26',
      textMuted: '#6D685E',
      textSubtle: '#9A9487',
      textInverse: '#F4EEDD',
      border: 'rgba(44, 42, 38, 0.08)',
      borderSubtle: 'rgba(44, 42, 38, 0.05)',
      borderStrong: 'rgba(44, 42, 38, 0.18)',
      accent: '#3E3A33',
      accentHover: '#2C2A26',
      accentActive: '#1A1816',
      accentSoft: 'rgba(62, 58, 51, 0.1)',
      accentContrast: '#F4EEDD',
      focus: '#3E3A33',
      selection: 'rgba(62, 58, 51, 0.15)',
      overlay: 'rgba(244, 238, 221, 0.9)',
      shadow: 'rgba(44, 42, 38, 0.06)',
      radiusBase: '2px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  ivory: {
    id: 'ivory',
    name: 'Ivory',
    mood: 'Warm / Minimal / Elegant',
    category: 'LIGHT',
    isDark: false,
    defaultTypography: 'editorial',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#FFFFF0',
      backgroundElevated: '#FFFFFF',
      surface: '#F5F5DC',
      surfaceHover: '#EBEBD0',
      surfaceActive: '#E1E1C4',
      text: '#4A4A4A',
      textMuted: '#8C8C8C',
      textSubtle: '#B5B5B5',
      textInverse: '#FFFFF0',
      border: 'rgba(74, 74, 74, 0.08)',
      borderSubtle: 'rgba(74, 74, 74, 0.04)',
      borderStrong: 'rgba(74, 74, 74, 0.16)',
      accent: '#6E6E60',
      accentHover: '#57574B',
      accentActive: '#404036',
      accentSoft: 'rgba(110, 110, 96, 0.1)',
      accentContrast: '#FFFFF0',
      radiusBase: '6px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight',
    mood: 'Deep / Atmospheric / Nocturnal',
    category: 'DARK',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#020914',
      backgroundElevated: '#081B38',
      surface: '#041226',
      surfaceHover: '#0A2040',
      surfaceActive: '#0E2950',
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
      accentSoft: 'rgba(56, 189, 248, 0.15)',
      accentContrast: '#020914',
      radiusBase: '8px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  tron: {
    id: 'tron',
    name: 'Tron',
    mood: 'Cyber / Neon / High-Tech Grid',
    category: 'FUTURISTIC',
    isDark: true,
    defaultTypography: 'futuristic',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    glowColor: '#00FFFF',
    glowIntensity: 1,
    shadowAccent: 'rgba(0, 255, 255, 0.2)',
    tokens: deriveCompleteThemeTokens({
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
      borderStrong: 'rgba(0, 255, 255, 0.45)',
      accent: '#00FFFF',
      accentHover: '#5FFFFF',
      accentActive: '#00CCCC',
      accentSoft: 'rgba(0, 255, 255, 0.15)',
      accentContrast: '#010409',
      canvasGridColor: 'rgba(0, 255, 255, 0.15)',
      canvasNodeBorder: 'rgba(0, 255, 255, 0.5)',
      canvasEdgeColor: 'rgba(0, 255, 255, 0.45)',
      radiusBase: '0px',
      borderWidth: '1px',
      glowColor: '#00FFFF',
      glowIntensity: 1,
      isDark: true,
    }),
  },

  electric: {
    id: 'electric',
    name: 'Electric',
    mood: 'Vivid / Radiant / Cyber-Violet',
    category: 'FUTURISTIC',
    isDark: true,
    defaultTypography: 'futuristic',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    glowColor: '#C557FF',
    glowIntensity: 0.4,
    tokens: deriveCompleteThemeTokens({
      background: '#06020D',
      surface: '#100620',
      backgroundElevated: '#1D0C38',
      text: '#F5E8FF',
      textMuted: '#A375E8',
      accent: '#C557FF',
      border: 'rgba(163, 117, 232, 0.2)',
      radiusBase: '10px',
      isDark: true,
    }),
  },

  graphite: {
    id: 'graphite',
    name: 'Graphite',
    mood: 'Industrial / Matte / Neutral Grey',
    category: 'DARK',
    isDark: true,
    defaultTypography: 'neutral',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#1A1A1A',
      surface: '#242424',
      backgroundElevated: '#2E2E2E',
      text: '#D1D1D1',
      textMuted: '#8B8B8B',
      accent: '#E0E0E0',
      border: 'rgba(255, 255, 255, 0.1)',
      radiusBase: '4px',
      isDark: true,
    }),
  },

  ash: {
    id: 'ash',
    name: 'Ash',
    mood: 'Muted / Soft Limestone / Architectural',
    category: 'LIGHT',
    isDark: false,
    defaultTypography: 'neutral',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#ECEBE8',
      surface: '#E1E0DD',
      backgroundElevated: '#F5F4F1',
      text: '#383A35',
      textMuted: '#74776D',
      accent: '#4E5247',
      border: 'rgba(0, 0, 0, 0.08)',
      radiusBase: '6px',
      isDark: false,
    }),
  },

  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    mood: 'High Contrast / Pure Black & White / Gallery',
    category: 'EDITORIAL',
    isDark: false,
    defaultTypography: 'neo-grotesk',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#FFFFFF',
      surface: '#F0F0F0',
      backgroundElevated: '#FAFAFA',
      text: '#000000',
      textMuted: '#555555',
      accent: '#000000',
      border: 'rgba(0, 0, 0, 0.15)',
      radiusBase: '0px',
      borderWidth: '1px',
      isDark: false,
    }),
  },

  aurora: {
    id: 'aurora',
    name: 'Aurora',
    mood: 'Northern Lights / Emerald / Polar Sky',
    category: 'DIGITAL',
    isDark: true,
    defaultTypography: 'contemporary',
    defaultShape: 'rounded',
    defaultDensity: 'relaxed',
    glowColor: '#34D399',
    glowIntensity: 0.35,
    tokens: deriveCompleteThemeTokens({
      background: '#0B1320',
      surface: '#121F33',
      backgroundElevated: '#1C2D47',
      text: '#A7F3D0',
      textMuted: '#6EE7B7',
      accent: '#34D399',
      border: 'rgba(167, 243, 208, 0.15)',
      radiusBase: '12px',
      isDark: true,
    }),
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    mood: 'Crimson / Velvet Wine / Evening Glow',
    category: 'CINEMATIC',
    isDark: true,
    defaultTypography: 'editorial',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#2D142C',
      surface: '#510A32',
      backgroundElevated: '#801336',
      text: '#FBEFEF',
      textMuted: '#EE4540',
      accent: '#C72C41',
      border: 'rgba(238, 69, 64, 0.2)',
      radiusBase: '12px',
      isDark: true,
    }),
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean',
    mood: 'Marine / Coastal / Deep Horizon',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#011222',
      surface: '#022340',
      backgroundElevated: '#033660',
      text: '#E0F2FE',
      textMuted: '#7DD3FC',
      accent: '#38BDF8',
      border: 'rgba(125, 211, 252, 0.15)',
      radiusBase: '8px',
      isDark: true,
    }),
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    mood: 'Canopy / Evergreen / Pine Resin',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'humanist',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#0A1A12',
      surface: '#122B1E',
      backgroundElevated: '#1B3F2D',
      text: '#D1FAE5',
      textMuted: '#6EE7B7',
      accent: '#10B981',
      border: 'rgba(110, 231, 183, 0.15)',
      radiusBase: '10px',
      isDark: true,
    }),
  },

  moss: {
    id: 'moss',
    name: 'Moss',
    mood: 'Earthy / Velvety / Forest Floor',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'humanist',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#0E1710',
      surface: '#18261C',
      backgroundElevated: '#243628',
      text: '#E8F5E9',
      textMuted: '#A5D6A7',
      accent: '#81C784',
      border: 'rgba(165, 214, 167, 0.15)',
      radiusBase: '12px',
      isDark: true,
    }),
  },

  sand: {
    id: 'sand',
    name: 'Sand',
    mood: 'Dune / Warm Limestone / Sunlit',
    category: 'NATURAL',
    isDark: false,
    defaultTypography: 'contemporary',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#F9F6F0',
      surface: '#EFE9DD',
      backgroundElevated: '#FCFAF7',
      text: '#3D3830',
      textMuted: '#787063',
      accent: '#9E8B70',
      border: 'rgba(61, 56, 48, 0.08)',
      radiusBase: '6px',
      isDark: false,
    }),
  },

  lavender: {
    id: 'lavender',
    name: 'Lavender',
    mood: 'Gentle / Mist / Provence Floral',
    category: 'COLORFUL',
    isDark: false,
    defaultTypography: 'editorial',
    defaultShape: 'soft',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#F8F6FC',
      surface: '#EEEAF6',
      backgroundElevated: '#FFFFFF',
      text: '#363045',
      textMuted: '#746B87',
      accent: '#8B6FAF',
      border: 'rgba(139, 111, 175, 0.12)',
      radiusBase: '16px',
      isDark: false,
    }),
  },

  violet: {
    id: 'violet',
    name: 'Violet',
    mood: 'Deep Velvet / Amethyst / Midnight Bloom',
    category: 'COLORFUL',
    isDark: true,
    defaultTypography: 'editorial',
    defaultShape: 'soft',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#130C1E',
      surface: '#201533',
      backgroundElevated: '#2F1E4B',
      text: '#F3E8FF',
      textMuted: '#C084FC',
      accent: '#A855F7',
      border: 'rgba(192, 132, 252, 0.18)',
      radiusBase: '12px',
      isDark: true,
    }),
  },

  rose: {
    id: 'rose',
    name: 'Rose',
    mood: 'Blush / Petal / Classical Warmth',
    category: 'COLORFUL',
    isDark: false,
    defaultTypography: 'editorial',
    defaultShape: 'soft',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#FFF8F8',
      surface: '#F8ECEC',
      backgroundElevated: '#FFFFFF',
      text: '#452A2E',
      textMuted: '#8C5E65',
      accent: '#C46D7D',
      border: 'rgba(196, 109, 125, 0.12)',
      radiusBase: '14px',
      isDark: false,
    }),
  },

  burgundy: {
    id: 'burgundy',
    name: 'Burgundy',
    mood: 'Rich Wine / Tannin / Library Velvet',
    category: 'CINEMATIC',
    isDark: true,
    defaultTypography: 'classical',
    defaultShape: 'editorial',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#180B10',
      surface: '#2A131C',
      backgroundElevated: '#3E1C29',
      text: '#FDF2F4',
      textMuted: '#BE8190',
      accent: '#E05372',
      border: 'rgba(224, 83, 114, 0.18)',
      radiusBase: '4px',
      isDark: true,
    }),
  },

  amber: {
    id: 'amber',
    name: 'Amber',
    mood: 'Fossil Resin / Honey / Warm Glow',
    category: 'ANALOG',
    isDark: true,
    defaultTypography: 'contemporary',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#161007',
      surface: '#251A0B',
      backgroundElevated: '#362710',
      text: '#FFFBEB',
      textMuted: '#F59E0B',
      accent: '#FBBF24',
      border: 'rgba(251, 191, 36, 0.18)',
      radiusBase: '8px',
      isDark: true,
    }),
  },

  copper: {
    id: 'copper',
    name: 'Copper',
    mood: 'Burnished Metal / Warm Patina / Hearth',
    category: 'ANALOG',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#170E0A',
      surface: '#271710',
      backgroundElevated: '#3A2318',
      text: '#FDF3EE',
      textMuted: '#C27D5E',
      accent: '#EA7A48',
      border: 'rgba(234, 122, 72, 0.18)',
      radiusBase: '8px',
      isDark: true,
    }),
  },

  slate: {
    id: 'slate',
    name: 'Slate',
    mood: 'Mineral / Cool Grey / Atmospheric Mist',
    category: 'DARK',
    isDark: true,
    defaultTypography: 'minimal',
    defaultShape: 'subtle',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#0F172A',
      surface: '#1E293B',
      backgroundElevated: '#334155',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      accent: '#64748B',
      border: 'rgba(148, 163, 184, 0.15)',
      radiusBase: '6px',
      isDark: true,
    }),
  },

  concrete: {
    id: 'concrete',
    name: 'Concrete',
    mood: 'Architectural / Minimal / Brutalist Light',
    category: 'LIGHT',
    isDark: false,
    defaultTypography: 'modern',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#F1F1F1',
      surface: '#E2E2E2',
      backgroundElevated: '#FAFAFA',
      text: '#222222',
      textMuted: '#666666',
      accent: '#444444',
      border: 'rgba(0, 0, 0, 0.12)',
      radiusBase: '2px',
      isDark: false,
    }),
  },

  ink: {
    id: 'ink',
    name: 'Ink',
    mood: 'Sumi-e / Carbon / Japanese Brush Wash',
    category: 'EDITORIAL',
    isDark: true,
    defaultTypography: 'art-book',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#080808',
      surface: '#141414',
      backgroundElevated: '#1F1F1F',
      text: '#F5F5F5',
      textMuted: '#808080',
      accent: '#C0C0C0',
      border: 'rgba(255, 255, 255, 0.12)',
      radiusBase: '0px',
      borderWidth: '1px',
      isDark: true,
    }),
  },

  jade: {
    id: 'jade',
    name: 'Jade',
    mood: 'Imperial Green / Mineral Lustre / Serene',
    category: 'COLORFUL',
    isDark: true,
    defaultTypography: 'contemporary',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#071611',
      surface: '#0F261E',
      backgroundElevated: '#17382D',
      text: '#E8F5E9',
      textMuted: '#81C784',
      accent: '#2ECC71',
      border: 'rgba(46, 204, 113, 0.18)',
      radiusBase: '10px',
      isDark: true,
    }),
  },

  cobalt: {
    id: 'cobalt',
    name: 'Cobalt',
    mood: 'Yves Klein / Vivid Ultramarine / Electric Depth',
    category: 'COLORFUL',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'sharp',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#040A1F',
      surface: '#081438',
      backgroundElevated: '#0D2056',
      text: '#E0E7FF',
      textMuted: '#818CF8',
      accent: '#4F46E5',
      border: 'rgba(99, 102, 241, 0.22)',
      radiusBase: '4px',
      isDark: true,
    }),
  },

  mediterranean: {
    id: 'mediterranean',
    name: 'Mediterranean',
    mood: 'Azure Waves / White Terraces / Coastal Sun',
    category: 'NATURAL',
    isDark: false,
    defaultTypography: 'contemporary',
    defaultShape: 'rounded',
    defaultDensity: 'relaxed',
    tokens: deriveCompleteThemeTokens({
      background: '#F6FAFC',
      surface: '#E6F2F7',
      backgroundElevated: '#FFFFFF',
      text: '#172B38',
      textMuted: '#4F7285',
      accent: '#0284C7',
      border: 'rgba(2, 132, 199, 0.12)',
      radiusBase: '12px',
      isDark: false,
    }),
  },

  autumn: {
    id: 'autumn',
    name: 'Autumn',
    mood: 'Fallen Leaves / Russet / Golden Hour',
    category: 'ANALOG',
    isDark: true,
    defaultTypography: 'literary',
    defaultShape: 'editorial',
    defaultDensity: 'balanced',
    tokens: deriveCompleteThemeTokens({
      background: '#1A0E08',
      surface: '#2C170D',
      backgroundElevated: '#3F2213',
      text: '#FEF3C7',
      textMuted: '#D97706',
      accent: '#F59E0B',
      border: 'rgba(245, 158, 11, 0.18)',
      radiusBase: '6px',
      isDark: true,
    }),
  },

  winter: {
    id: 'winter',
    name: 'Winter',
    mood: 'Frost / Pale Slate / Subdued Chill',
    category: 'NATURAL',
    isDark: true,
    defaultTypography: 'minimal',
    defaultShape: 'subtle',
    defaultDensity: 'spacious',
    tokens: deriveCompleteThemeTokens({
      background: '#0F141C',
      surface: '#1A222E',
      backgroundElevated: '#263143',
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      accent: '#38BDF8',
      border: 'rgba(148, 163, 184, 0.15)',
      radiusBase: '6px',
      isDark: true,
    }),
  },

  'neon-noir': {
    id: 'neon-noir',
    name: 'Neon Noir',
    mood: 'Rain-Slicked Asphalt / Cyberpunk Glow / Hot Pink',
    category: 'CINEMATIC',
    isDark: true,
    defaultTypography: 'futuristic',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    glowColor: '#EC4899',
    glowIntensity: 0.45,
    tokens: deriveCompleteThemeTokens({
      background: '#07050A',
      surface: '#130C1C',
      backgroundElevated: '#20142F',
      text: '#FDF2F8',
      textMuted: '#F472B6',
      accent: '#EC4899',
      border: 'rgba(236, 72, 153, 0.22)',
      radiusBase: '10px',
      glowColor: '#EC4899',
      glowIntensity: 0.45,
      isDark: true,
    }),
  },

  cosmic: {
    id: 'cosmic',
    name: 'Cosmic',
    mood: 'Deep Space Nebula / Starlight / Infinite Void',
    category: 'CINEMATIC',
    isDark: true,
    defaultTypography: 'modern',
    defaultShape: 'rounded',
    defaultDensity: 'balanced',
    glowColor: '#8B5CF6',
    glowIntensity: 0.4,
    tokens: deriveCompleteThemeTokens({
      background: '#080512',
      surface: '#130C28',
      backgroundElevated: '#201442',
      text: '#EDE9FE',
      textMuted: '#A78BFA',
      accent: '#8B5CF6',
      border: 'rgba(139, 92, 246, 0.2)',
      radiusBase: '12px',
      glowColor: '#8B5CF6',
      glowIntensity: 0.4,
      isDark: true,
    }),
  },
};
