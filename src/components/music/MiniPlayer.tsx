import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Play, Pause, X, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import clsx from 'clsx';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function MiniPlayer() {
  const { currentSong, isPlaying, togglePlay, closePlayer, progress, currentTime, duration, setMaximized, isMaximized } = useMusicStore();
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';
  const progressRef = useRef<HTMLDivElement>(null);

  if (!currentSong || isMaximized) return null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, x / rect.width));
    // Set progress will just update the store for now, but we actually need to seek the audio engine.
    // A clean way is to let the audio element handle seeking.
    // For now, this just updates the visual state, we need to dispatch an event or expose audio ref to truly seek.
    // We'll dispatch a custom event to the AudioEngine.
    const seekEvent = new CustomEvent('seekAudio', { detail: newProgress * duration });
    window.dispatchEvent(seekEvent);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className={clsx(
          "fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[60] w-72 md:w-80 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-xl transition-colors duration-500",
          isTron 
            ? "bg-black/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
            : "bg-bg-elevated/90 border-border-subtle"
        )}
      >
        <div className="flex items-center p-4 gap-4">
          {/* Artwork / Spinning Disc */}
          <div className="relative flex-shrink-0">
            <div 
              className={clsx(
                "w-14 h-14 rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center border border-border-subtle relative shadow-sm",
                isPlaying ? "animate-spin" : "",
                isTron && "border-cyan-500/30"
              )}
              style={isPlaying ? { animationDuration: '4s' } : undefined}
            >
              {currentSong.artworkUrl ? (
                <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-text-muted/20 to-transparent flex items-center justify-center text-xs font-serif text-text-muted">
                  {currentSong.title.charAt(0)}
                </div>
              )}
              {/* Record Hole */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-bg-elevated rounded-full border border-border-subtle shadow-inner" />
              </div>
            </div>
            
            {/* Tone arm decorative element (Optional, but adds to the player feel) */}
            <div className={clsx(
              "absolute -top-1 -right-2 w-4 h-10 origin-top transition-transform duration-500 ease-in-out pointer-events-none",
              isPlaying ? "rotate-[20deg]" : "-rotate-12"
            )}>
              <div className="w-1 h-8 bg-text-muted rounded-full mx-auto" />
              <div className="w-2.5 h-3 bg-text-secondary rounded-sm -mt-1 mx-auto" />
            </div>
          </div>

          {/* Info & Time */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className={clsx(
              "text-sm font-medium truncate mb-0.5",
              isTron ? "text-cyan-400 font-mono tracking-wider" : "text-text-primary"
            )}>
              {currentSong.title}
            </h4>
            <div className="flex items-center gap-2">
              <p className={clsx(
                "text-xs truncate max-w-[100px]",
                isTron ? "text-cyan-500/60" : "text-text-secondary"
              )}>
                {currentSong.artist}
              </p>
              
              <div className="flex-1" />
              
              <span className={clsx(
                "text-[10px] font-medium tabular-nums",
                isTron ? "text-cyan-400/80" : "text-text-muted"
              )}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button 
              onClick={togglePlay}
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isTron ? "text-cyan-400 hover:bg-cyan-500/10" : "text-text-primary hover:bg-bg-secondary"
              )}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button 
              onClick={() => setMaximized(true)}
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isTron ? "text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10" : "text-text-muted hover:text-text-primary hover:bg-bg-secondary"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8M9 9 3 3M9 9v-4.8M9 9H4.2"/></svg>
            </button>
            <button 
              onClick={closePlayer}
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isTron ? "text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10" : "text-text-muted hover:text-text-primary hover:bg-bg-secondary"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div 
          ref={progressRef}
          onClick={handleProgressClick}
          className={clsx(
            "h-1 w-full cursor-pointer transition-colors relative group",
            isTron ? "bg-cyan-900/30" : "bg-bg-secondary"
          )}
        >
          <div 
            className={clsx(
              "h-full transition-all duration-100 ease-linear",
              isTron ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-text-primary"
            )}
            style={{ width: `${progress * 100}%` }}
          />
          {/* Time popup on hover could be added here */}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
