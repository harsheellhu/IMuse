import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore, MotionMode } from '../../store/useSettingsStore';

const CANONICAL_ROUTES = [
  '/',
  '/home',
  '/explore',
  '/books',
  '/films',
  '/tv-shows',
  '/places',
  '/shops',
  '/collections',
  '/music',
  '/library',
  '/museum',
  '/dna',
  '/color-memory',
  '/profile',
  '/experiences'
];

function getBaseRoute(pathname: string) {
  if (pathname === '/') return '/';
  const parts = pathname.split('/');
  return `/${parts[1]}`;
}

type Direction = 'forward' | 'backward' | 'neutral';

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { motion: motionMode } = useSettingsStore();
  const [direction, setDirection] = useState<Direction>('neutral');
  const prevPathRef = useRef<string>(location.pathname);

  // Compute direction synchronously on route change
  if (prevPathRef.current !== location.pathname) {
    const prevBase = getBaseRoute(prevPathRef.current);
    const currBase = getBaseRoute(location.pathname);

    const prevIndex = CANONICAL_ROUTES.indexOf(prevBase);
    const currIndex = CANONICAL_ROUTES.indexOf(currBase);

    let newDirection: Direction = 'neutral';
    if (prevIndex !== -1 && currIndex !== -1) {
      if (currIndex > prevIndex) {
        newDirection = 'forward';
      } else if (currIndex < prevIndex) {
        newDirection = 'backward';
      }
    }
    
    setDirection(newDirection);
    prevPathRef.current = location.pathname;
  }

  // Handle scroll reset safely in an effect
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Adjust transition based on motion mode
  const getTransitionSettings = (mode: MotionMode) => {
    switch (mode) {
      case 'static':
      case 'reduced':
        return { duration: 0.05, ease: 'linear' };
      case 'minimal':
        return { duration: 0.15, ease: 'easeOut' };
      case 'smooth':
      default:
        return { duration: 0.25, ease: [0.22, 1, 0.36, 1] };
      case 'fluid':
        return { type: 'spring', stiffness: 220, damping: 26 };
      case 'cinematic':
        return { duration: 0.35, ease: [0.25, 1, 0.5, 1] };
    }
  };

  const getVariants = () => {
    // If user prefers reduced motion, only do a simple fade
    if (motionMode === 'static' || motionMode === 'reduced') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }

    const offset = motionMode === 'minimal' ? 4 : (motionMode === 'cinematic' ? 10 : 6);

    if (direction === 'forward') {
      return {
        initial: { opacity: 0, x: offset },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -offset },
      };
    } else if (direction === 'backward') {
      return {
        initial: { opacity: 0, x: -offset },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: offset },
      };
    }

    // Default neutral
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={getVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={getTransitionSettings(motionMode)}
        className="w-full"
        style={{ gridArea: '1 / 1' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
