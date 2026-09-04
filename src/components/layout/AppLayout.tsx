import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, MobileNav } from './Navbar';
import { ImmersiveViewer } from '../viewer/ImmersiveViewer';
import { useStore } from '../../store/useStore';
import { useMusicStore } from '../../store/useMusicStore';
import { AudioEngine } from '../music/AudioEngine';
import { MiniPlayer } from '../music/MiniPlayer';
import { RouteTransition } from './RouteTransition';
import { PerformanceHUD } from '../ui/PerformanceHUD';

const SearchOverlay = React.lazy(() => import('./SearchOverlay').then(m => ({ default: m.SearchOverlay })));
const AuthModal = React.lazy(() => import('../auth/AuthModal').then(m => ({ default: m.AuthModal })));
const FullPlayer = React.lazy(() => import('../music/FullPlayer').then(m => ({ default: m.FullPlayer })));

export function AppLayout() {
  const { bgGradient, isSearchOpen, isAuthModalOpen } = useStore();
  const { isMiniPlayerVisible, isMaximized } = useMusicStore();

  return (
    <div 
      className="min-h-screen text-text-primary antialiased selection:bg-text-primary selection:text-bg-base transition-all duration-700 ease-in-out bg-bg-base"
      style={{ backgroundImage: bgGradient || 'none' }}
    >
      <Navbar />
      <main className="pt-24 pb-32 md:pb-12 min-h-screen max-w-full overflow-x-hidden grid">
        <RouteTransition>
          <Outlet />
        </RouteTransition>
      </main>
      <MobileNav />
      <ImmersiveViewer />
      
      {/* Conditionally rendered lazy modals */}
      <Suspense fallback={null}>
        {isSearchOpen && <SearchOverlay />}
        {isAuthModalOpen && <AuthModal />}
        {isMaximized && <FullPlayer />}
      </Suspense>

      {/* Global Lightweight Audio Engine */}
      <AudioEngine />
      {isMiniPlayerVisible && <MiniPlayer />}

      {/* Dev Performance HUD (Shift+P) */}
      <PerformanceHUD />
    </div>
  );
}
