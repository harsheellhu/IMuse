/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cinematic Landing-to-Home Launch Transition State Store
 * Coordinates the 5-phase fluid morph between the Landing Page ('/')
 * and Home Cultural Feed ('/home').
 */

import { create } from 'zustand';

export type LaunchPhase = 'idle' | 'launching' | 'expanding' | 'revealing' | 'settled';

export interface ArtworkTransitionMeta {
  url: string;
  title: string;
  category?: string;
  palette?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
}

interface LaunchTransitionStore {
  isTransitioning: boolean;
  phase: LaunchPhase;
  artwork: ArtworkTransitionMeta | null;

  startLaunch: (
    artwork: ArtworkTransitionMeta,
    navigate: (to: string) => void,
    isReducedMotion?: boolean
  ) => void;

  setPhase: (phase: LaunchPhase) => void;
  reset: () => void;
}

export const useLaunchTransitionStore = create<LaunchTransitionStore>((set, get) => ({
  isTransitioning: false,
  phase: 'idle',
  artwork: null,

  startLaunch: (artwork, navigate, isReducedMotion = false) => {
    // Prevent re-triggering if already transitioning
    if (get().isTransitioning) return;

    if (isReducedMotion) {
      // Reduced motion mode: clean, rapid opacity fade without dramatic scale/blur
      set({
        isTransitioning: true,
        phase: 'expanding',
        artwork
      });

      // Navigate quickly
      setTimeout(() => {
        navigate('/home');
      }, 80);

      // Settle quickly
      setTimeout(() => {
        set({ phase: 'revealing' });
      }, 160);

      setTimeout(() => {
        set({ isTransitioning: false, phase: 'settled', artwork: null });
      }, 300);

      return;
    }

    // Standard 5-Phase Cinematic Choreography:
    // Phase A: Launch Interaction (0 - 150ms)
    // - Button compresses, artwork zoom begins, subtle brightness flare
    set({
      isTransitioning: true,
      phase: 'launching',
      artwork
    });

    // Phase B & C: Atmospheric Expansion & Logo Transformation (150ms - 450ms)
    // - Background expands, blur increases, logo begins glide to navbar
    const tExpansion = setTimeout(() => {
      set({ phase: 'expanding' });
    }, 150);

    // Trigger route change at 420ms while transition surface seamlessly covers screen
    const tNavigate = setTimeout(() => {
      navigate('/home');
    }, 420);

    // Phase D: Homepage Reveal (750ms - 1200ms)
    // - Background dissolves into theme base, navbar and home cards stagger in
    const tReveal = setTimeout(() => {
      set({ phase: 'revealing' });
    }, 750);

    // Phase E: Final Settle (1350ms)
    // - Transition completes, normal interaction restored
    const tSettle = setTimeout(() => {
      set({ isTransitioning: false, phase: 'settled', artwork: null });
    }, 1350);

    // Store cleanup timers if needed
    return () => {
      clearTimeout(tExpansion);
      clearTimeout(tNavigate);
      clearTimeout(tReveal);
      clearTimeout(tSettle);
    };
  },

  setPhase: (phase) => set({ phase }),
  reset: () => set({ isTransitioning: false, phase: 'idle', artwork: null })
}));
