/**
 * iMUSE Theme Applicator
 * 
 * Sets CSS custom properties on document.documentElement smoothly and safely.
 */

import { ThemeTokens, ThemeDefinition, CustomPalette, BUILTIN_THEMES } from './tokens';

export interface ApplyThemeOptions {
  themeId?: string;
  glowColor?: string;
  glowIntensity?: number;
  shadowAccent?: string;
  radiusBase?: string;
  borderWidth?: string;
  glassIntensity?: number;
  shadowIntensity?: number;
}

/**
 * Maps semantic tokens to root CSS custom properties and legacy compatibility aliases.
 */
export function applyThemeTokensToRoot(
  tokens: ThemeTokens, 
  isDark: boolean,
  options?: ApplyThemeOptions
) {
  if (typeof window === 'undefined' || !window.document) return;
  const root = window.document.documentElement;

  // 1. Background & Elevated Surfaces
  root.style.setProperty('--color-background', tokens.background);
  root.style.setProperty('--color-background-elevated', tokens.backgroundElevated);
  root.style.setProperty('--color-background-subtle', tokens.backgroundSubtle || tokens.background);

  // 2. Surfaces (Primary, Secondary, Tertiary, Hover, Active)
  root.style.setProperty('--color-surface', tokens.surface);
  root.style.setProperty('--color-surface-hover', tokens.surfaceHover);
  root.style.setProperty('--color-surface-active', tokens.surfaceActive);
  root.style.setProperty('--color-surface-secondary', tokens.surfaceSecondary || tokens.surface);
  root.style.setProperty('--color-surface-tertiary', tokens.surfaceTertiary || tokens.surfaceHover);

  // 3. Text & Typography
  root.style.setProperty('--color-text', tokens.text);
  root.style.setProperty('--color-text-primary', tokens.text);
  root.style.setProperty('--color-text-secondary', tokens.textMuted);
  root.style.setProperty('--color-text-muted', tokens.textMuted);
  root.style.setProperty('--color-text-subtle', tokens.textSubtle);
  root.style.setProperty('--color-text-inverse', tokens.textInverse);

  // 4. Borders & Dividers
  root.style.setProperty('--color-border', tokens.border);
  root.style.setProperty('--color-border-subtle', tokens.borderSubtle);
  root.style.setProperty('--color-border-strong', tokens.borderStrong);
  root.style.setProperty('--color-divider', tokens.divider || tokens.borderSubtle);
  const borderWidth = options?.borderWidth || tokens.borderWidth || '1px';
  root.style.setProperty('--border-width', borderWidth);

  // 5. Accent System
  root.style.setProperty('--color-accent', tokens.accent);
  root.style.setProperty('--color-accent-primary', tokens.accent);
  root.style.setProperty('--color-accent-hover', tokens.accentHover);
  root.style.setProperty('--color-accent-active', tokens.accentActive);
  root.style.setProperty('--color-accent-soft', tokens.accentSoft);
  root.style.setProperty('--color-accent-contrast', tokens.accentContrast);
  root.style.setProperty('--color-accent-foreground', tokens.accentContrast);

  // 6. Primary and Secondary Interactive Controls
  root.style.setProperty('--color-control-bg', tokens.controlBg || tokens.surface);
  root.style.setProperty('--color-control-border', tokens.controlBorder || tokens.border);
  root.style.setProperty('--color-control-hover', tokens.controlHover || tokens.surfaceHover);

  // 7. Focus, Selection & States
  root.style.setProperty('--color-focus', tokens.focus);
  root.style.setProperty('--color-focus-ring', tokens.focus);
  root.style.setProperty('--color-selection', tokens.selection);
  root.style.setProperty('--color-disabled', tokens.disabled || 'rgba(128, 128, 128, 0.4)');
  root.style.setProperty('--color-state-disabled', tokens.disabled || 'rgba(128, 128, 128, 0.4)');
  root.style.setProperty('--color-state-selected', tokens.accentSoft || 'rgba(128, 128, 128, 0.15)');

  // 8. Feedback & Status
  root.style.setProperty('--color-success', tokens.success);
  root.style.setProperty('--color-warning', tokens.warning);
  root.style.setProperty('--color-error', tokens.error);
  root.style.setProperty('--color-info', tokens.info);

  // 9. Modal Backdrops, Glass Surfaces & Transparency
  root.style.setProperty('--color-overlay', tokens.overlay);
  root.style.setProperty('--color-backdrop', tokens.backdrop || tokens.overlay);
  const glassIntensity = options?.glassIntensity !== undefined ? options.glassIntensity : 1;
  root.style.setProperty('--glass-intensity', String(glassIntensity));
  root.style.setProperty('--surface-glass', tokens.glassBg || (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)'));
  root.style.setProperty('--surface-glass-border', tokens.glassBorder || tokens.borderSubtle);
  root.style.setProperty('--surface-glass-blur', tokens.glassBlur || '16px');

  // 10. Shadows, Ambient Glows & Gradients
  const shadowIntensity = options?.shadowIntensity !== undefined ? options.shadowIntensity : 1;
  root.style.setProperty('--shadow-intensity', String(shadowIntensity));
  root.style.setProperty('--color-shadow', tokens.shadow);
  root.style.setProperty('--shadow-sm', `0 1px 2px ${tokens.shadow || 'rgba(0, 0, 0, 0.06)'}`);
  root.style.setProperty('--shadow-md', `0 4px 6px -1px ${tokens.shadow || 'rgba(0, 0, 0, 0.1)'}`);
  root.style.setProperty('--shadow-lg', `0 10px 15px -3px ${tokens.shadow || 'rgba(0, 0, 0, 0.15)'}`);
  root.style.setProperty('--theme-gradient', tokens.themeGradient || 'none');
  root.style.setProperty('--gradient-ambient', tokens.themeGradient || 'none');
  root.style.setProperty('--gradient-primary', tokens.themeGradient || 'none');
  root.style.setProperty('--image-overlay', isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)');

  // 11. Canvas Grid, Node Borders & Connection Lines
  root.style.setProperty('--canvas-grid', tokens.canvasGridColor || tokens.borderSubtle);
  root.style.setProperty('--canvas-node-border', tokens.canvasNodeBorder || tokens.border);
  root.style.setProperty('--canvas-edge', tokens.canvasEdgeColor || tokens.borderSubtle);
  root.style.setProperty('--canvas-connection', tokens.canvasEdgeColor || tokens.borderSubtle);

  // 12. Artwork Backgrounds & Metadata Surfaces
  root.style.setProperty('--artwork-bg', tokens.artworkBg || tokens.surface);
  root.style.setProperty('--artwork-border', tokens.borderSubtle);
  root.style.setProperty('--metadata-surface', tokens.metadataSurface || tokens.surfaceSecondary || tokens.surface);

  // 13. Scrollbars
  root.style.setProperty('--scrollbar-thumb', tokens.scrollbarThumb || tokens.textSubtle);
  root.style.setProperty('--scrollbar-track', tokens.scrollbarTrack || 'transparent');

  // 14. Shape & Radius Tokens
  const radiusBase = options?.radiusBase || tokens.radiusBase || '8px';
  root.style.setProperty('--radius-base', radiusBase);
  root.style.setProperty('--radius-sm', `calc(${radiusBase} * 0.5)`);
  root.style.setProperty('--radius-md', radiusBase);
  root.style.setProperty('--radius-lg', `calc(${radiusBase} * 1.5)`);
  root.style.setProperty('--radius-xl', `calc(${radiusBase} * 2)`);
  root.style.setProperty('--radius-2xl', `calc(${radiusBase} * 3)`);

  // 15. Legacy Aliases for 100% Backward Compatibility
  root.style.setProperty('--bg-base', tokens.background);
  root.style.setProperty('--bg-secondary', tokens.surface);
  root.style.setProperty('--bg-secondary-hover', tokens.surfaceHover);
  root.style.setProperty('--bg-secondary-active', tokens.surfaceActive);
  root.style.setProperty('--bg-elevated', tokens.backgroundElevated);

  root.style.setProperty('--text-primary', tokens.text);
  root.style.setProperty('--text-secondary', tokens.textMuted);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--text-subtle', tokens.textSubtle);

  root.style.setProperty('--border-subtle', tokens.borderSubtle);
  root.style.setProperty('--border-strong', tokens.borderStrong);

  root.style.setProperty('--accent-primary', tokens.accent);
  root.style.setProperty('--accent-soft', tokens.accentSoft);
  root.style.setProperty('--accent-contrast', tokens.accentContrast);

  root.style.setProperty('--overlay', tokens.overlay);
  root.style.setProperty('--shadow-color', tokens.shadow);

  // 16. Glow and Atmospheric Effects
  const glowColor = options?.glowColor || tokens.glowColor;
  const glowIntensity = options?.glowIntensity !== undefined ? options.glowIntensity : (tokens.glowIntensity ?? 0);
  if (glowColor && glowIntensity > 0) {
    root.style.setProperty('--glow-color', glowColor);
    root.style.setProperty('--glow-intensity', String(glowIntensity));
    root.style.setProperty('--shadow-accent', options?.shadowAccent || tokens.shadowAccent || `rgba(${isDark ? '0, 255, 255' : '0, 0, 0'}, 0.2)`);
  } else {
    root.style.setProperty('--glow-color', 'transparent');
    root.style.setProperty('--glow-intensity', '0');
    root.style.setProperty('--shadow-accent', 'transparent');
  }

  // 17. Dark / Light root classes
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // 18. Theme identifier class (e.g. theme-swiss-international)
  const themeClasses = Array.from(root.classList).filter(c => c.startsWith('theme-'));
  root.classList.remove(...themeClasses);
  if (options?.themeId) {
    root.classList.add(`theme-${options.themeId}`);
  }
}

/**
 * Resolves and applies a theme by ID, ThemeDefinition, or CustomPalette.
 */
export function applyTheme(
  themeOrId: string | ThemeDefinition | CustomPalette,
  customPalettes: CustomPalette[] = []
) {
  let themeDef: ThemeDefinition | CustomPalette | undefined;

  if (typeof themeOrId === 'string') {
    if (BUILTIN_THEMES[themeOrId]) {
      themeDef = BUILTIN_THEMES[themeOrId];
    } else {
      themeDef = customPalettes.find(p => p.id === themeOrId);
    }
  } else {
    themeDef = themeOrId;
  }

  if (!themeDef) {
    themeDef = BUILTIN_THEMES.default;
  }

  const isDark = themeDef.isDark;
  const isTron = themeDef.id === 'tron';

  const custom = themeDef as CustomPalette;
  const builtin = themeDef as ThemeDefinition;

  applyThemeTokensToRoot(themeDef.tokens, isDark, {
    themeId: themeDef.id,
    glowColor: custom.glowIntensity !== undefined ? (themeDef.tokens.glowColor || '#00FFFF') : (builtin.glowColor || (isTron ? '#00FFFF' : undefined)),
    glowIntensity: custom.glowIntensity !== undefined ? custom.glowIntensity : (builtin.glowIntensity || (isTron ? 1 : 0)),
    shadowAccent: builtin.shadowAccent,
    radiusBase: custom.radiusBase || themeDef.tokens.radiusBase,
    borderWidth: custom.borderWidth || themeDef.tokens.borderWidth,
    glassIntensity: custom.glassIntensity,
    shadowIntensity: custom.shadowIntensity,
  });
}

/**
 * Live preview of tokens without saving.
 */
export function previewTheme(
  tokens: ThemeTokens, 
  isDark: boolean, 
  options: ApplyThemeOptions = { themeId: 'custom-preview' }
) {
  applyThemeTokensToRoot(tokens, isDark, options);
}

/**
 * Reverts live preview back to the active theme.
 */
export function revertThemePreview(
  activeThemeId: string, 
  customPalettes: CustomPalette[] = []
) {
  applyTheme(activeThemeId, customPalettes);
}
