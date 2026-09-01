import React, { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { applyTheme } from '../theme/applyTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore();

  useEffect(() => {
    // 1. Apply semantic theme tokens, custom properties, and dark/light classes
    applyTheme(settings.appearance, settings.customPalettes);

    const root = window.document.documentElement;
    
    // 2. Remove previous non-theme settings classes
    const classesToRemove = Array.from(root.classList).filter(c => 
      c.startsWith('landing-') || c.startsWith('tron-intensity-') || c.startsWith('motion-') ||
      c.startsWith('ambient-') || c.startsWith('density-') || c.startsWith('img-') ||
      c.startsWith('typo-') || c.startsWith('shape-') || c.startsWith('texture-') ||
      c.startsWith('nav-')
    );
    root.classList.remove(...classesToRemove);

    // 3. Add current experience settings classes
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

  }, [
    settings.appearance,
    settings.customPalettes,
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
