import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { SlideshowLanding } from '../components/landing/SlideshowLanding';
import { landingFeatures } from '../utils/landingData';
import { useStore } from '../store/useStore';

export function LandingPage() {
  const { skipLandingPage } = useSettingsStore();
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    // Idle pre-warm AppLayout, Home, and Content feed in background
    const schedule = (typeof window !== 'undefined' && 'requestIdleCallback' in window) 
      ? (window as any).requestIdleCallback 
      : ((cb: () => void) => setTimeout(cb, 800));

    const handle = schedule(() => {
      import('../components/layout/AppLayout');
      import('./Home');
      if (useStore.getState().posts.length === 0) {
        import('../api/content').then(({ contentApi }) => {
          contentApi.getAll('post', 50).then((data) => {
            useStore.setState({ posts: data as any });
          }).catch(() => {});
        }).catch(() => {});
      }
    });

    return () => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof handle === 'number') {
        (window as any).cancelIdleCallback(handle);
      }
    };
  }, []);

  const handleWarmHome = () => {
    import('../components/layout/AppLayout');
    import('./Home');
  };

  const handleLaunchApp = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    if (isLaunching) return;
    setIsLaunching(true);

    handleWarmHome();

    // Smooth warp transition into the personal cultural universe
    setTimeout(() => {
      navigate('/home');
    }, 450);
  }, [isLaunching, navigate]);

  // Keyboard shortcut: Press Enter or Space to Launch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          handleLaunchApp();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunchApp]);

  if (skipLandingPage) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-bg-base overflow-hidden selection:bg-text-primary selection:text-bg-base">
      {/* 
        The SlideshowLanding component handles the immersive background, captions, 
        and the ambient background coloring. We pass our curated landing dataset.
      */}
      <SlideshowLanding features={landingFeatures} isLaunching={isLaunching} />

      {/* 
        Restrained, minimal Navigation overlay for the Landing Page.
        This sits ABOVE the slideshow z-index.
      */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isLaunching ? 0 : 1, 
          y: isLaunching ? -16 : 0 
        }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="absolute top-0 left-0 right-0 z-50 p-6 md:p-12 flex justify-between items-center pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Link to="/" className="text-base md:text-lg font-serif font-medium tracking-wide text-white drop-shadow-md mix-blend-normal opacity-90 hover:opacity-100 transition-opacity">
            IMuse
          </Link>
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          <button 
            onClick={handleLaunchApp}
            onMouseEnter={handleWarmHome}
            onTouchStart={handleWarmHome}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-white/90 hover:text-white transition-all group mix-blend-normal drop-shadow-md cursor-pointer hover:scale-105 active:scale-95"
            title="Launch iMUSE (or press Enter)"
            aria-label="Enter iMUSE"
          >
            <Sparkles className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
            <span>Enter IMuse</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </motion.div>

      {/* Cinematic Warp Iris Portal (Activates on Launch) */}
      <AnimatePresence>
        {isLaunching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {/* Hyperspace Radial Flare */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.8, 3.5], opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-96 h-96 rounded-full bg-gradient-to-r from-accent-primary/40 via-white/30 to-transparent blur-3xl"
            />
            {/* Concentric Portal Ring */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 2.4, opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-64 h-64 rounded-full border border-white/50"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
