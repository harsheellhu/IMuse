import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { authApi } from '../api/auth';
import { preferencesApi } from '../api/preferences';

export const useInitializeApp = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('imuse-app-init-start');
    }

    // Dev Bootstrap Diagnostic: Detect if app rendering stalls
    let stallDetector: number | null = null;
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    if (isDev) {
      stallDetector = window.setTimeout(() => {
        const rootEl = document.getElementById('root');
        const hasContent = rootEl && rootEl.childElementCount > 0;
        if (!hasContent) {
          console.warn('[iMUSE DEV] BOOTSTRAP DELAY DETECTED: App mounted but UI render took >1500ms.');
        }
      }, 1500);
    }

    // Parallel Non-Blocking Bootstrap
    const initialize = async () => {
      try {
        const [userRes, prefsRes] = await Promise.allSettled([
          authApi.me(),
          preferencesApi.get()
        ]);

        // 1. Process Auth
        if (userRes.status === 'fulfilled' && userRes.value) {
          useStore.setState({ isAuthenticated: true, currentUser: userRes.value });
        } else {
          useStore.setState({ isAuthenticated: false });
        }

        // 2. Process Preferences
        if (prefsRes.status === 'fulfilled' && prefsRes.value) {
          useSettingsStore.setState(prefsRes.value);
        }

        if (typeof performance !== 'undefined' && performance.mark) {
          performance.mark('imuse-app-init-complete');
          try {
            performance.measure('imuse-bootstrap-duration', 'imuse-app-init-start', 'imuse-app-init-complete');
          } catch (e) {}
        }
      } catch (e) {
        console.warn('[iMUSE Startup Notice] Background init completed with fallbacks:', e);
      } finally {
        if (stallDetector) clearTimeout(stallDetector);
      }
    };

    initialize();
  }, []);

  return isInitializing;
};
