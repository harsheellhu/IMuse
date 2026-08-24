/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { ExploreWorld } from './pages/ExploreWorld';
import { Profile } from './pages/Profile';
import { Books } from './pages/Books';
import { Films } from './pages/Films';
import { Collections } from './pages/Collections';
import { Library } from './pages/Library';
import { useStore } from './store/useStore';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, colorMode } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'theme-neutral', 'theme-warm', 'theme-cool');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    root.classList.add(`theme-${colorMode}`);
  }, [theme, colorMode]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<ExploreWorld />} />
            <Route path="books" element={<Books />} />
            <Route path="films" element={<Films />} />
            <Route path="collections" element={<Collections />} />
            <Route path="library" element={<Library />} />
            <Route path="profile/:id" element={<Profile />} />
            {/* Fallback for unbuilt pages */}
            <Route path="*" element={<div className="p-8 text-center text-text-secondary">Page coming soon.</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

