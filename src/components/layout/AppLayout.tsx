import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, MobileNav } from './Navbar';
import { SearchOverlay } from './SearchOverlay';
import { ImmersiveViewer } from '../viewer/ImmersiveViewer';
import { AuthModal } from '../auth/AuthModal';
import { useStore } from '../../store/useStore';
import { useMusicStore } from '../../store/useMusicStore';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { AudioEngine } from '../music/AudioEngine';
import { MiniPlayer } from '../music/MiniPlayer';
import { FullPlayer } from '../music/FullPlayer';
import { RouteTransition } from './RouteTransition';

export function AppLayout() {
  const { bgGradient } = useStore();
  const { isMiniPlayerVisible } = useMusicStore();
  const location = useLocation();

  return (
    <div 
      className="min-h-screen text-text-primary antialiased selection:bg-text-primary selection:text-bg-base transition-all duration-700 ease-in-out"
      style={{ backgroundImage: bgGradient || 'none' }}
    >
      <Navbar />
      <main className="pt-24 pb-32 md:pb-12 min-h-screen max-w-full overflow-x-hidden grid">
        <RouteTransition>
          <Outlet />
        </RouteTransition>
      </main>
      <MobileNav />
      <SearchOverlay />
      <ImmersiveViewer />
      <AuthModal />
      
      {/* Global Music Components */}
      <AudioEngine />
      {isMiniPlayerVisible && <MiniPlayer />}
      <FullPlayer />
    </div>
  );
}
