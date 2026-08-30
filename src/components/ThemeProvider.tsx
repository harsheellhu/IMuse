import React, { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme-related classes cleanly
    const classesToRemove = Array.from(root.classList).filter(c => 
      c.startsWith('theme-') || c === 'dark' || c === 'light' || 
      c.startsWith('landing-') || c.startsWith('tron-') || c.startsWith('motion-') ||
      c.startsWith('ambient-') || c.startsWith('density-') || c.startsWith('img-') ||
      c.startsWith('typo-') || c.startsWith('shape-') || c.startsWith('texture-') ||
      c.startsWith('nav-')
    );
    root.classList.remove(...classesToRemove);
    
    // Base theme handling (dark/light) based on appearance
    let isDark = false;
    const darkThemes = ['obsidian', 'midnight', 'graphite', 'electric', 'tron', 'monolith', 'observatory', 'sunset', 'ocean', 'forest', 'twilight', 'aurora'];
    const lightThemes = ['paper', 'ivory', 'monochrome', 'ash'];

    if (settings.appearance === 'default') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = darkThemes.includes(settings.appearance);
    }

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Add specific settings classes
    root.classList.add(`theme-${settings.appearance}`);
    root.classList.add(`landing-${settings.landingStyle}`);
    root.classList.add(`tron-intensity-${settings.tronIntensity}`);
    root.classList.add(`motion-${settings.motion}`);
    root.classList.add(`ambient-${settings.ambientMode}`);
    root.classList.add(`density-${settings.feedDensity}`);
    root.classList.add(`img-style-${settings.imageStyle}`);
    root.classList.add(`typo-${settings.typography}`);
    root.classList.add(`shape-${settings.shapeLanguage}`);
    root.classList.add(`texture-${settings.texture}`);
    root.classList.add(`nav-${settings.navStyle}`);

    // We can also apply global styles directly to the body or root via CSS variables if needed,
    // but relying on tailwind/css variables in index.css is cleaner.

  }, [
    settings.appearance,
    settings.landingStyle,
    settings.tronIntensity,
    settings.motion,
    settings.ambientMode,
    settings.feedDensity,
    settings.imageStyle,
    settings.typography,
    settings.shapeLanguage,
    settings.texture,
    settings.navStyle
  ]);

  return <>{children}</>;
}
