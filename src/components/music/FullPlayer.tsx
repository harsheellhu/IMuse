import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusicStore } from '../../store/useMusicStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Minimize2 } from 'lucide-react';
import clsx from 'clsx';
import { useImagePalette } from '../../hooks/useImagePalette';
import { TurntableUnit } from './TurntableUnit';
import { PlaybackControls } from './PlaybackControls';
import { Lyrics } from './Lyrics';

export function FullPlayer() {
  const { currentSong, isMaximized, setMaximized } = useMusicStore(useShallow(s => ({
    currentSong: s.currentSong,
    isMaximized: s.isMaximized,
    setMaximized: s.setMaximized
  })));
  const { appearance, motion: motionSetting } = useSettingsStore();
  const isTron = appearance === 'tron';

  const { palette } = useImagePalette(currentSong?.artworkUrl || null);

  const isVisible = Boolean(currentSong && isMaximized);
  const isReducedMotion = motionSetting === 'reduced' || motionSetting === 'static';

  return (
    <AnimatePresence>
      {isVisible && currentSong && (
        <motion.div
          key="full-player-overlay"
          initial={{ opacity: 0, y: isReducedMotion ? 0 : '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isReducedMotion ? 0 : '100%' }}
          transition={{ 
            duration: isReducedMotion ? 0.05 : 0.35, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={clsx(
            "fixed inset-0 z-[100] flex flex-col overflow-hidden select-none",
            isTron ? "bg-black/90 backdrop-blur-2xl" : "bg-[#0a0a0a]/95 backdrop-blur-2xl"
          )}
        >
          {/* Optimized Ambient Radial Blend from Artwork Palette */}
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-40 mix-blend-screen"
            style={{ 
              background: palette 
                ? `radial-gradient(circle 800px at 30% 50%, ${palette.primary}40, transparent 65%), radial-gradient(circle 600px at 75% 50%, ${palette.secondary || palette.primary}25, transparent 60%)` 
                : isTron 
                  ? 'radial-gradient(circle 800px at 50% 50%, rgba(0, 240, 255, 0.15), transparent 75%)'
                  : 'radial-gradient(circle 800px at 50% 50%, rgba(255, 255, 255, 0.06), transparent 80%)'
            }}
          />
          
          {/* Contrast shadow zone for turntable */}
          <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] bg-radial from-transparent via-black/20 to-black/40 pointer-events-none mix-blend-multiply" />

          {/* Header */}
          <header className="relative z-20 px-6 py-4 md:px-8 md:py-6 flex items-center justify-between flex-shrink-0">
            <button 
              type="button"
              aria-label="Minimize player"
              onClick={() => setMaximized(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-secondary/60 backdrop-blur-md hover:bg-bg-secondary border border-border-subtle/50 transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Minimize2 className="w-5 h-5 text-text-primary" />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Now Playing</span>
              <span className={clsx("text-xs font-medium", isTron ? "text-cyan-400 font-mono" : "text-text-secondary")}>
                From Library
              </span>
            </div>
            
            <div className="w-10 h-10" />
          </header>

          {/* Main Content Layout */}
          <main className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)] w-full max-w-[2000px] mx-auto overflow-hidden">
            
            {/* Column 1: Mechanical Turntable */}
            <div className="w-full h-[45vh] min-h-[280px] lg:h-full flex items-center justify-center p-4 md:p-8 lg:p-12 xl:p-16 relative overflow-hidden min-w-0">
              <TurntableUnit />
            </div>

            {/* Column 2: Metadata, Playback Controls & Lyrics */}
            <div className="w-full flex-1 lg:h-full min-w-0 flex flex-col justify-start lg:justify-center pt-2 pb-10 px-6 lg:px-8 xl:pr-16 gap-5 lg:gap-7 overflow-y-auto scrollbar-hide">
              
              {/* Song Information */}
              <div className="flex flex-col gap-1.5 w-full text-center lg:text-left flex-shrink-0 mt-auto lg:mt-0 min-w-0">
                <h2 className={clsx(
                  "font-serif font-medium w-full tracking-tight leading-none break-words",
                  isTron ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]" : "text-white drop-shadow-lg"
                )} style={{ fontSize: 'clamp(1.75rem, 3.2vw, 4rem)', textWrap: 'balance' }}>
                  {currentSong.title}
                </h2>
                <p className={clsx(
                  "text-base md:text-lg font-light tracking-wide truncate",
                  isTron ? "text-cyan-200" : "text-white/70"
                )}>
                  {currentSong.artist}
                </p>
                
                {(currentSong.album || currentSong.genre) && (
                  <div className="flex items-center justify-center lg:justify-start gap-3 mt-1 text-xs uppercase tracking-[0.2em] text-white/40">
                    {currentSong.album && <span>{currentSong.album}</span>}
                    {currentSong.album && currentSong.genre && <span>•</span>}
                    {currentSong.genre && <span>{currentSong.genre}</span>}
                  </div>
                )}
              </div>

              {/* Scrubber & Controls */}
              <div className="flex-shrink-0 w-full max-w-[480px] mx-auto lg:mx-0">
                <PlaybackControls />
              </div>
              
              {/* Synchronized Lyrics */}
              <div className="w-full max-w-[480px] mx-auto lg:mx-0 h-40 md:h-48 lg:h-56 overflow-hidden flex flex-col mb-auto lg:mb-0">
                <Lyrics />
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
