/**
 * iMUSE Theme Applicator
 * 
 * Sets CSS custom properties on document.documentElement smoothly and safely.
 */

import { ThemeTokens, ThemeDefinition, CustomPalette, BUILTIN_THEMES } from './tokens';

/**
 * Maps semantic tokens to root CSS custom properties and legacy compatibility aliases.
 */
export function applyThemeTokensToRoot(
  tokens: ThemeTokens, 
  isDark: boolean,
  options?: {
    themeId?: string;
    glowColor?: string;
    glowIntensity?: number;
    shadowAccent?: string;
  }
) {
  if (typeof window === 'undefined' || !window.document) return;
  const root = window.document.documentElement;

  // 1. Semantic CSS Tokens
  root.style.setProperty('--color-background', tokens.background);
  root.style.setProperty('--color-background-elevated', tokens.backgroundElevated);
  root.style.setProperty('--color-surface', tokens.surface);
  root.style.setProperty('--color-surface-hover', tokens.surfaceHover);
  root.style.setProperty('--color-surface-active', tokens.surfaceActive);

  root.style.setProperty('--color-text', tokens.text);
  root.style.setProperty('--color-text-primary', tokens.text);
  root.style.setProperty('--color-text-secondary', tokens.textMuted);
  root.style.setProperty('--color-text-muted', tokens.textMuted);
  root.style.setProperty('--color-text-subtle', tokens.textSubtle);
  root.style.setProperty('--color-text-inverse', tokens.textInverse);

  root.style.setProperty('--color-border', tokens.border);
  root.style.setProperty('--color-border-subtle', tokens.borderSubtle);
  root.style.setProperty('--color-border-strong', tokens.borderStrong);

  root.style.setProperty('--color-accent', tokens.accent);
  root.style.setProperty('--color-accent-primary', tokens.accent);
  root.style.setProperty('--color-accent-hover', tokens.accentHover);
  root.style.setProperty('--color-accent-active', tokens.accentActive);
  root.style.setProperty('--color-accent-soft', tokens.accentSoft);
  root.style.setProperty('--color-accent-contrast', tokens.accentContrast);

  root.style.setProperty('--color-focus', tokens.focus);
  root.style.setProperty('--color-selection', tokens.selection);
  root.style.setProperty('--color-overlay', tokens.overlay);
  root.style.setProperty('--color-shadow', tokens.shadow);

  root.style.setProperty('--color-success', tokens.success);
  root.style.setProperty('--color-warning', tokens.warning);
  root.style.setProperty('--color-error', tokens.error);
  root.style.setProperty('--color-info', tokens.info);

  // 2. Legacy Aliases for 100% Backward Compatibility
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

  // 3. Effects / TRON specific variables
  if (options?.glowColor) {
    root.style.setProperty('--glow-color', options.glowColor);
    root.style.setProperty('--glow-intensity', String(options.glowIntensity ?? 1));
    root.style.setProperty('--shadow-accent', options.shadowAccent || `rgba(0, 255, 255, 0.2)`);
  } else {
    root.style.setProperty('--glow-color', 'transparent');
    root.style.setProperty('--glow-intensity', '0');
    root.style.setProperty('--shadow-accent', 'transparent');
  }

  // 4. Update dark / light classes
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // 5. Update theme-* class
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

  applyThemeTokensToRoot(themeDef.tokens, isDark, {
    themeId: themeDef.id,
    glowColor: (themeDef as ThemeDefinition).glowColor || (isTron ? '#00FFFF' : undefined),
    glowIntensity: (themeDef as ThemeDefinition).glowIntensity || (isTron ? 1 : 0),
    shadowAccent: (themeDef as ThemeDefinition).shadowAccent,
  });
}

/**
 * Live preview of tokens without saving.
 */
export function previewTheme(tokens: ThemeTokens, isDark: boolean, themeId = 'custom-preview') {
  applyThemeTokensToRoot(tokens, isDark, { themeId });
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
