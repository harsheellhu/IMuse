/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ThemeProvider } from './components/ThemeProvider';
import { useInitializeApp } from './hooks/useInitializeApp';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { RouteSkeleton } from './components/ui/RouteSkeleton';
import { useSettingsStore } from './store/useSettingsStore';
import { useStore } from './store/useStore';

// Core Layout & Modals (Lazy-loaded to keep landing route feather-light)
const AppLayout = React.lazy(() => import('./components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const SettingsOverlay = React.lazy(() => import('./components/settings/SettingsOverlay').then(m => ({ default: m.SettingsOverlay })));
const ImportProgress = React.lazy(() => import('./components/settings/ImportProgress').then(m => ({ default: m.ImportProgress })));
const CreateCollectionModal = React.lazy(() => import('./components/ui/CreateCollectionModal').then(m => ({ default: m.CreateCollectionModal })));
const CustomCursor = React.lazy(() => import('./components/ui/CustomCursor').then(m => ({ default: m.CustomCursor })));

// Lazy Load secondary routes
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const ExploreWorld = React.lazy(() => import('./pages/ExploreWorld').then(m => ({ default: m.ExploreWorld })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Books = React.lazy(() => import('./pages/Books').then(m => ({ default: m.Books })));
const Films = React.lazy(() => import('./pages/Films').then(m => ({ default: m.Films })));
const Collections = React.lazy(() => import('./pages/Collections').then(m => ({ default: m.Collections })));
const Library = React.lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const TvShows = React.lazy(() => import('./pages/TvShows').then(m => ({ default: m.TvShows })));
const Places = React.lazy(() => import('./pages/Places').then(m => ({ default: m.Places })));
const Shops = React.lazy(() => import('./pages/Shops').then(m => ({ default: m.Shops })));
const Music = React.lazy(() => import('./pages/Music').then(m => ({ default: m.Music })));
const ExperiencePage = React.lazy(() => import('./pages/ExperiencePage').then(m => ({ default: m.ExperiencePage })));
const PatternThreadViewer = React.lazy(() => import('./pages/PatternThreadViewer').then(m => ({ default: m.PatternThreadViewer })));
const CulturalReplay = React.lazy(() => import('./pages/CulturalReplay').then(m => ({ default: m.CulturalReplay })));
const SerendipityMode = React.lazy(() => import('./pages/SerendipityMode').then(m => ({ default: m.SerendipityMode })));
const ColorMemory = React.lazy(() => import('./pages/ColorMemory').then(m => ({ default: m.ColorMemory })));
const MuseumPage = React.lazy(() => import('./pages/Museum').then(m => ({ default: m.MuseumPage })));
const MuseumRoomPage = React.lazy(() => import('./pages/MuseumRoom').then(m => ({ default: m.MuseumRoomPage })));
const CulturalDNAPage = React.lazy(() => import('./pages/CulturalDNA').then(m => ({ default: m.CulturalDNAPage })));

export default function App() {
  useInitializeApp();
  const isSettingsOpen = useSettingsStore(s => s.isSettingsOpen);
  const isDiscoveryActive = useSettingsStore(s => s.discoveryTask?.isActive);
  const isCreateCollectionOpen = useStore(s => s.isCreateCollectionOpen);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <CustomCursor />
            {isSettingsOpen && <SettingsOverlay />}
            {isDiscoveryActive && <ImportProgress />}
            {isCreateCollectionOpen && <CreateCollectionModal />}
          </Suspense>

          <Routes>
            {/* Root Landing Route renders instantly with zero blocking imports */}
            <Route path="/" element={<LandingPage />} />
            
            {/* App Layout & Nested Secondary Routes */}
            <Route 
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <AppLayout />
                </Suspense>
              }
            >
              <Route path="home" element={<Suspense fallback={<RouteSkeleton />}><Home /></Suspense>} />
              <Route path="explore" element={<Suspense fallback={<RouteSkeleton />}><ExploreWorld /></Suspense>} />
              <Route path="books" element={<Suspense fallback={<RouteSkeleton />}><Books /></Suspense>} />
              <Route path="films" element={<Suspense fallback={<RouteSkeleton />}><Films /></Suspense>} />
              <Route path="tv-shows" element={<Suspense fallback={<RouteSkeleton />}><TvShows /></Suspense>} />
              <Route path="places" element={<Suspense fallback={<RouteSkeleton />}><Places /></Suspense>} />
              <Route path="shops" element={<Suspense fallback={<RouteSkeleton />}><Shops /></Suspense>} />
              <Route path="collections" element={<Suspense fallback={<RouteSkeleton />}><Collections /></Suspense>} />
              <Route path="library" element={<Suspense fallback={<RouteSkeleton />}><Library /></Suspense>} />
              <Route path="music" element={<Suspense fallback={<RouteSkeleton />}><Music /></Suspense>} />
              <Route path="experiences" element={<Suspense fallback={<RouteSkeleton />}><Profile /></Suspense>} />
              <Route path="experience/:id" element={<Suspense fallback={<RouteSkeleton />}><ExperiencePage /></Suspense>} />
              <Route path="patterns/:id" element={<Suspense fallback={<RouteSkeleton />}><PatternThreadViewer /></Suspense>} />
              <Route path="replay" element={<Suspense fallback={<RouteSkeleton />}><CulturalReplay /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<RouteSkeleton />}><Profile /></Suspense>} />
              <Route path="profile/:id" element={<Suspense fallback={<RouteSkeleton />}><Profile /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<RouteSkeleton />}><Home /></Suspense>} />
              <Route path="serendipity" element={<Suspense fallback={<RouteSkeleton />}><SerendipityMode /></Suspense>} />
              <Route path="color-memory" element={<Suspense fallback={<RouteSkeleton />}><ColorMemory /></Suspense>} />
              <Route path="museum" element={<Suspense fallback={<RouteSkeleton />}><MuseumPage /></Suspense>} />
              <Route path="museum/:roomId" element={<Suspense fallback={<RouteSkeleton />}><MuseumRoomPage /></Suspense>} />
              <Route path="dna" element={<Suspense fallback={<RouteSkeleton />}><CulturalDNAPage /></Suspense>} />
              {/* Fallback for unbuilt pages */}
              <Route path="*" element={<div className="p-8 text-center text-text-secondary">Page coming soon.</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
