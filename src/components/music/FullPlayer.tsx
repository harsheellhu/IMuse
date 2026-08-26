import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Play, Pause, SkipBack, SkipForward, Minimize2 } from 'lucide-react';
import clsx from 'clsx';
import { useImagePalette } from '../../hooks/useImagePalette';
import { TurntableUnit } from './TurntableUnit';
import { PlaybackControls } from './PlaybackControls';
import { Lyrics } from './Lyrics';

export function FullPlayer() {
  const { currentSong, isMaximized, setMaximized } = useMusicStore();
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';

  const { palette } = useImagePalette(currentSong?.artworkUrl || null);

  if (!currentSong || !isMaximized) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={clsx(
          "fixed inset-0 z-[100] flex flex-col overflow-hidden",
          isTron ? "bg-black/70 backdrop-blur-3xl" : "bg-black/60 backdrop-blur-3xl"
        )}
      >
        {/* Ambient Background */}
        <AnimatePresence mode="wait">
          {currentSong.artworkUrl && (
            <motion.div
              key={currentSong.artworkUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: isTron ? 0.4 : 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className={clsx(
                "absolute inset-0 pointer-events-none transition-opacity duration-1000",
                isTron ? "mix-blend-lighten" : "mix-blend-screen"
              )}
              style={{
                backgroundImage: `url(${currentSong.artworkUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(120px) saturate(180%)',
                transform: 'scale(1.3)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Ambient Overlay to pull dominant color across the screen softly */}
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-1000 opacity-70 mix-blend-screen"
          style={{ 
            background: palette 
              ? `radial-gradient(circle at 30% 50%, ${palette.primary}50, transparent 60%), radial-gradient(circle at 80% 50%, ${palette.secondary || palette.primary}40, transparent 70%)` 
              : 'radial-gradient(circle at 50% 50%, rgba(100,100,100,0.1), transparent 80%)'
          }}
        />

        {/* Header */}
        <header className="relative z-10 p-6 md:p-8 flex items-center justify-between">
          <button 
            onClick={() => setMaximized(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-secondary/50 backdrop-blur-md hover:bg-bg-secondary transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-text-primary" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-text-muted font-medium">Now Playing</span>
            <span className={clsx("text-sm font-medium", isTron && "text-cyan-400 font-mono")}>
              From Library
            </span>
          </div>
          
          <div className="w-10 h-10" /> {/* Spacer */}
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[2000px] mx-auto overflow-hidden">
          {/* Column 1: Giant Turntable (65-70%) */}
          <div className="flex-shrink-0 w-full lg:w-[65%] xl:w-[70%] h-[50vh] lg:h-full flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
            <TurntableUnit />
          </div>

          {/* Column 2: Info & Control Panel (30-35%) */}
          <div className="flex-1 w-full lg:w-[35%] xl:w-[30%] h-full flex flex-col pt-6 lg:pt-12 pb-12 px-6 lg:pr-12 gap-8 lg:gap-12 overflow-y-auto scrollbar-hide">
            
            {/* Info */}
            <div className="flex flex-col gap-2 w-full text-center lg:text-left flex-shrink-0">
              <h2 className={clsx(
                "text-3xl md:text-5xl lg:text-6xl font-serif font-medium w-full tracking-tight leading-tight",
                isTron ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]" : "text-white drop-shadow-lg"
              )} style={{ textWrap: 'balance' }}>
                {currentSong.title}
              </h2>
              <p className={clsx(
                "text-xl md:text-2xl mt-2 font-light",
                isTron ? "text-cyan-200" : "text-white/80"
              )}>
                {currentSong.artist}
              </p>
              
              {/* Optional minimal metadata row */}
              {(currentSong.album || currentSong.genre) && (
                <div className="flex items-center justify-center lg:justify-start gap-4 mt-2 text-sm uppercase tracking-widest text-white/50">
                  {currentSong.album && <span>{currentSong.album}</span>}
                  {currentSong.album && currentSong.genre && <span>•</span>}
                  {currentSong.genre && <span>{currentSong.genre}</span>}
                </div>
              )}
            </div>

            {/* Scrubber & Controls */}
            <div className="flex-shrink-0">
              <PlaybackControls />
            </div>
            
            {/* Lyrics Section */}
            <Lyrics />
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
