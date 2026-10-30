/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cinematic Launch Transition Component
 * Orchestrates the 5-phase morph between the Landing Page and Home Feed:
 * Phase A: Launch Interaction (Compression, bloom, initial artwork zoom)
 * Phase B: Atmospheric Expansion (Background scaling, blur softening, ambient radial bloom)
 * Phase C: Logo Transformation (Shared-element glide into Navbar position)
 * Phase D: Homepage Reveal (Overlay dissolves, revealing homepage surfaces)
 * Phase E: Final Settle (Smooth unmount, normal interaction restored)
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLaunchTransitionStore } from '../../store/useLaunchTransitionStore';
import { useSettingsStore } from '../../store/useSettingsStore';

// Quintic-out easing curve for natural, cinematic deceleration
const QUINTIC_OUT = [0.16, 1, 0.3, 1];

export function CinematicLaunchTransition() {
  const { isTransitioning, phase, artwork } = useLaunchTransitionStore();
  const { motion: motionMode } = useSettingsStore();
  const isReducedMotion = motionMode === 'reduced' || motionMode === 'static';

  const primaryColor = useMemo(() => {
    return artwork?.palette?.primary || 'var(--color-accent-primary, #6366F1)';
  }, [artwork?.palette]);

  if (!isTransitioning || !artwork) return null;

  // Reduced motion alternative: clean, gentle crossfade
  if (isReducedMotion) {
    return (
      <AnimatePresence>
        <motion.div
          key="reduced-motion-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'revealing' || phase === 'settled' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'linear' }}
          className="fixed inset-0 z-[9999] pointer-events-none bg-bg-base"
        />
      </AnimatePresence>
    );
  }

  const isExpandingOrLater = phase === 'expanding' || phase === 'revealing' || phase === 'settled';
  const isRevealingOrLater = phase === 'revealing' || phase === 'settled';

  return (
    <AnimatePresence>
      <motion.div
        key="cinematic-launch-portal"
        initial={{ opacity: 1 }}
        animate={{ opacity: isRevealingOrLater ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: QUINTIC_OUT }}
        className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden"
      >
        {/* Layer 1: Solid Theme Underlay */}
        <div className="absolute inset-0 bg-bg-base transition-colors duration-500" />

        {/* Layer 2: Expanding Landing Background Artwork */}
        {artwork.url && (
          <motion.div
            initial={{ scale: 1.0, filter: 'blur(0px) brightness(1)' }}
            animate={{
              scale: isExpandingOrLater ? 1.15 : 1.04,
              filter: isExpandingOrLater 
                ? 'blur(20px) brightness(1.08)' 
                : 'blur(4px) brightness(1.04)',
            }}
            transition={{
              scale: { duration: 1.1, ease: QUINTIC_OUT },
              filter: { duration: 0.9, ease: QUINTIC_OUT },
            }}
            className="absolute inset-0 will-change-transform"
            style={{
              backgroundImage: `url(${artwork.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        {/* Layer 3: Dynamic Palette Radial Mesh Bloom */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isExpandingOrLater ? 0.45 : 0.2,
            scale: isExpandingOrLater ? 1.6 : 1.0,
          }}
          transition={{ duration: 1.0, ease: QUINTIC_OUT }}
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            background: `
              radial-gradient(circle at 50% 45%, ${primaryColor}70, transparent 65%),
              radial-gradient(circle at 20% 80%, ${primaryColor}40, transparent 55%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2), transparent 50%)
            `
          }}
        />

        {/* Layer 4: Atmospheric Concentric Ring Flare */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{
            scale: isExpandingOrLater ? 2.8 : 0.9,
            opacity: isExpandingOrLater ? [0, 0.7, 0] : [0, 0.3],
          }}
          transition={{ duration: 0.9, ease: QUINTIC_OUT }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/40 pointer-events-none"
        />

        {/* Layer 5: Dark Vignette Gradient for Seamless Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Layer 6: Shared-Element Brand Logo Morph */}
        {/*
          Landing Initial: top: 24px (md: 48px), left: 24px (md: 48px), white text
          Navbar Target:   top: 20px, left: 24px (md: 48px), text-text-primary
        */}
        <motion.div
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            color: '#FFFFFF',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}
          animate={{
            y: isExpandingOrLater ? (window.innerWidth >= 768 ? -28 : -4) : 0,
            scale: isExpandingOrLater ? 1.12 : 1.0,
            color: isRevealingOrLater ? 'var(--color-text-primary, #FFFFFF)' : '#FFFFFF',
            textShadow: isRevealingOrLater ? 'none' : '0 2px 10px rgba(0,0,0,0.6)',
          }}
          transition={{
            duration: 0.75,
            ease: QUINTIC_OUT,
          }}
          className="fixed top-6 md:top-12 left-6 md:left-12 z-[10000] pointer-events-none origin-top-left font-serif font-medium text-base md:text-lg tracking-tight select-none"
        >
          IMuse
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
