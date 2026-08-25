import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, MobileNav } from './Navbar';
import { SearchOverlay } from './SearchOverlay';
import { PostDetailViewer } from '../viewer/PostDetailViewer';
import { AuthModal } from '../auth/AuthModal';
import { useStore } from '../../store/useStore';
import { useMusicStore } from '../../store/useMusicStore';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { AudioEngine } from '../music/AudioEngine';
import { MiniPlayer } from '../music/MiniPlayer';
import { FullPlayer } from '../music/FullPlayer';
import { CollectionCarouselViewer } from '../viewer/CollectionCarouselViewer';

export function AppLayout() {
  const { bgGradient } = useStore();
  const { isMiniPlayerVisible } = useMusicStore();
  const location = useLocation();

  return (
    <div 
      className="min-h-screen text-text-primary font-sans antialiased selection:bg-text-primary selection:text-bg-base transition-all duration-700 ease-in-out"
      style={{ backgroundImage: bgGradient || 'none' }}
    >
      <Navbar />
      <main className="pt-24 pb-32 md:pb-12 min-h-screen max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileNav />
      <SearchOverlay />
      <PostDetailViewer />
      <CollectionCarouselViewer />
      <AuthModal />
      
      {/* Global Music Components */}
      <AudioEngine />
      {isMiniPlayerVisible && <MiniPlayer />}
      <FullPlayer />
    </div>
  );
}
