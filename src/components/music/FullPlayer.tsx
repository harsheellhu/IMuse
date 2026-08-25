import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Play, Pause, SkipBack, SkipForward, Minimize2 } from 'lucide-react';
import clsx from 'clsx';
import { useImagePalette } from '../../hooks/useImagePalette';
import { TurntableUnit } from './TurntableUnit';
import { PlaybackControls } from './PlaybackControls';

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
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                backgroundImage: `url(${currentSong.artworkUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(100px) saturate(150%)',
                transform: 'scale(1.2)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Gradient Background */}
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-1000 opacity-60"
          style={{ 
            background: palette 
              ? `radial-gradient(circle at 50% 30%, ${palette.primary}40, transparent 70%), radial-gradient(circle at 80% 80%, ${palette.secondary || palette.primary}20, transparent 50%)` 
              : 'radial-gradient(circle at 50% 30%, rgba(120,120,120,0.15), transparent 70%)'
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
        <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center w-full max-w-[1400px] mx-auto p-6 md:p-8 lg:p-12 gap-8 lg:gap-20 overflow-y-auto lg:overflow-hidden">
          {/* Column 1: Turntable Unit */}
          <div className="flex-shrink-0 w-full max-w-[480px] lg:max-w-[560px] flex items-center justify-center">
            <TurntableUnit />
          </div>

          {/* Column 2: Info & Control Panel */}
          <div className={clsx(
            "flex flex-col w-full max-w-lg gap-8 p-6 md:p-8 rounded-3xl transition-colors",
            "lg:bg-black/20 lg:backdrop-blur-md lg:border lg:border-white/5 lg:shadow-2xl"
          )}>
            {/* Info */}
            <div className="flex flex-col gap-2 w-full text-center lg:text-left">
              <h2 className={clsx(
                "text-2xl md:text-4xl font-serif font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap",
                isTron ? "text-cyan-400" : "text-text-primary"
              )}>
                {currentSong.title}
              </h2>
              <p className="text-lg md:text-xl text-text-secondary w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {currentSong.artist}
              </p>
            </div>

            {/* Scrubber & Controls */}
            <PlaybackControls />
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
