/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { ThemeProvider } from './components/ThemeProvider';
import { SettingsOverlay } from './components/settings/SettingsOverlay';
import { ImportProgress } from './components/settings/ImportProgress';
import { CreateCollectionModal } from './components/ui/CreateCollectionModal';
import { useInitializeApp } from './hooks/useInitializeApp';

// Lazy Load heavy secondary routes
const ExploreWorld = React.lazy(() => import('./pages/ExploreWorld').then(module => ({ default: module.ExploreWorld })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Books = React.lazy(() => import('./pages/Books').then(module => ({ default: module.Books })));
const Films = React.lazy(() => import('./pages/Films').then(module => ({ default: module.Films })));
const Collections = React.lazy(() => import('./pages/Collections').then(module => ({ default: module.Collections })));
const Library = React.lazy(() => import('./pages/Library').then(module => ({ default: module.Library })));
const TvShows = React.lazy(() => import('./pages/TvShows').then(module => ({ default: module.TvShows })));
const Places = React.lazy(() => import('./pages/Places').then(module => ({ default: module.Places })));
const Shops = React.lazy(() => import('./pages/Shops').then(module => ({ default: module.Shops })));


export default function App() {
  const isInitializing = useInitializeApp();

  // We no longer block rendering with a spinner. The shell renders immediately,
  // and data hydrates as it streams in, improving perceived performance.

  return (
    <ThemeProvider>
      <BrowserRouter>
        <SettingsOverlay />
        <ImportProgress />
        <CreateCollectionModal />
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><ExploreWorld /></React.Suspense>} />
            <Route path="books" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Books /></React.Suspense>} />
            <Route path="films" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Films /></React.Suspense>} />
            <Route path="tv-shows" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><TvShows /></React.Suspense>} />
            <Route path="places" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Places /></React.Suspense>} />
            <Route path="shops" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Shops /></React.Suspense>} />
            <Route path="collections" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Collections /></React.Suspense>} />
            <Route path="library" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Library /></React.Suspense>} />
            <Route path="profile/:id" element={<React.Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}><Profile /></React.Suspense>} />
            {/* Fallback for unbuilt pages */}
            <Route path="*" element={<div className="p-8 text-center text-text-secondary">Page coming soon.</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

