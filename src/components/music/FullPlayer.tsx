import React, { useRef, useState, useEffect } from 'react';
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
          isTron ? "bg-black/70 backdrop-blur-3xl" : "bg-[#0a0a0a]/80 backdrop-blur-3xl"
        )}
      >
        {/* Ambient Background */}
        <AnimatePresence mode="wait">
          {currentSong.artworkUrl && (
            <motion.div
              key={currentSong.artworkUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: isTron ? 0.3 : 0.4 }}
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
                filter: 'blur(140px) saturate(200%)',
                transform: 'scale(1.4)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Ambient Overlay to pull dominant color across the screen softly */}
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-1000 opacity-60 mix-blend-screen"
          style={{ 
            background: palette 
              ? `radial-gradient(circle at 20% 50%, ${palette.primary}40, transparent 50%), radial-gradient(circle at 80% 50%, ${palette.secondary || palette.primary}30, transparent 60%)` 
              : 'radial-gradient(circle at 50% 50%, rgba(100,100,100,0.1), transparent 80%)'
          }}
        />
        
        {/* Center shadow protection for the record so it doesn't get washed out */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] bg-radial from-transparent via-black/20 to-black/40 pointer-events-none mix-blend-multiply" />

        {/* Header - Condensed to save vertical space */}
        <header className="relative z-10 px-6 py-4 md:px-8 md:py-6 flex items-center justify-between flex-shrink-0">
          <button 
            onClick={() => setMaximized(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-secondary/50 backdrop-blur-md hover:bg-bg-secondary transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-text-primary" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Now Playing</span>
            <span className={clsx("text-xs font-medium", isTron && "text-cyan-400 font-mono")}>
              From Library
            </span>
          </div>
          
          <div className="w-10 h-10" /> {/* Spacer */}
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)] w-full max-w-[2000px] mx-auto overflow-hidden">
          
          {/* Column 1: Giant Turntable */}
          <div className="w-full h-[45vh] min-h-[300px] lg:h-full flex items-center justify-center p-4 md:p-8 lg:p-12 xl:p-16 relative overflow-hidden min-w-0">
            <TurntableUnit />
          </div>

          {/* Column 2: Info & Control Panel */}
          <div className="w-full flex-1 lg:h-full min-w-0 flex flex-col justify-start lg:justify-center pt-2 pb-12 px-6 lg:px-8 xl:pr-16 gap-6 lg:gap-8 overflow-y-auto scrollbar-hide">
            
            {/* Info */}
            <div className="flex flex-col gap-1.5 w-full text-center lg:text-left flex-shrink-0 mt-auto lg:mt-0 min-w-0">
              <h2 className={clsx(
                "font-serif font-medium w-full tracking-tight leading-none break-words",
                isTron ? "text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]" : "text-white drop-shadow-lg"
              )} style={{ fontSize: 'clamp(2rem, 3.5vw, 4.5rem)', textWrap: 'balance' }}>
                {currentSong.title}
              </h2>
              <p className={clsx(
                "text-lg md:text-xl font-light tracking-wide truncate",
                isTron ? "text-cyan-200" : "text-white/70"
              )}>
                {currentSong.artist}
              </p>
              
              {/* Optional minimal metadata row */}
              {(currentSong.album || currentSong.genre) && (
                <div className="flex items-center justify-center lg:justify-start gap-3 mt-1.5 text-xs uppercase tracking-[0.2em] text-white/40">
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
            
            {/* Lyrics Section */}
            <div className="w-full max-w-[480px] mx-auto lg:mx-0 h-44 md:h-52 lg:h-64 overflow-hidden flex flex-col mb-auto lg:mb-0">
              <Lyrics />
            </div>
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
