import React, { useRef, useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import clsx from 'clsx';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function PlaybackControls() {
  // We subscribe to progress and currentTime here so ONLY this component re-renders
  const { currentSong, isPlaying, togglePlay, progress, currentTime, duration, playNext, playPrev } = useMusicStore(useShallow(s => ({
    currentSong: s.currentSong,
    isPlaying: s.isPlaying,
    togglePlay: s.togglePlay,
    progress: s.progress,
    currentTime: s.currentTime,
    duration: s.duration,
    playNext: s.playNext,
    playPrev: s.playPrev
  })));
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  if (!currentSong) return null;

  const handleProgressScrub = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    let clientX = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    
    const x = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, x / rect.width));
    setDragProgress(newProgress);
  };

  const commitScrub = () => {
    if (isDragging && duration) {
      const seekEvent = new CustomEvent('seekAudio', { detail: dragProgress * duration });
      window.dispatchEvent(seekEvent);
    }
    setIsDragging(false);
  };

  const displayProgress = isDragging ? dragProgress : progress;
  const displayTime = isDragging ? dragProgress * duration : currentTime;

  return (
    <div className="w-full flex flex-col gap-8 mt-2">
      {/* Progress */}
      <div className="flex flex-col gap-3">
        <div 
          ref={progressRef}
          className="h-2 w-full bg-bg-secondary rounded-full cursor-pointer relative group"
          onMouseDown={(e) => {
            setIsDragging(true);
            handleProgressScrub(e);
          }}
          onMouseMove={(e) => {
            if (isDragging) handleProgressScrub(e);
          }}
          onMouseUp={commitScrub}
          onMouseLeave={commitScrub}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleProgressScrub(e);
          }}
          onTouchMove={(e) => {
            if (isDragging) handleProgressScrub(e);
          }}
          onTouchEnd={commitScrub}
        >
          <div 
            className={clsx(
              "absolute top-0 left-0 h-full rounded-full transition-all",
              isTron ? "bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]" : "bg-text-primary",
              !isDragging && "duration-100 ease-linear"
            )}
            style={{ width: `${displayProgress * 100}%` }}
          />
          <div 
            className={clsx(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border border-gray-200 transition-opacity",
              isDragging || "opacity-0 group-hover:opacity-100"
            )}
            style={{ left: `calc(${displayProgress * 100}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-text-muted tabular-nums">
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-8">
        <button 
          onClick={playPrev}
          className={clsx(
            "w-12 h-12 flex items-center justify-center transition-colors hover:text-text-primary",
            isTron ? "text-cyan-500/70 hover:text-cyan-400" : "text-text-secondary"
          )}
        >
          <SkipBack className="w-6 h-6 fill-current" />
        </button>
        
        <button 
          onClick={togglePlay}
          className={clsx(
            "w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-xl",
            isTron ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/50" : "bg-text-primary text-bg-primary"
          )}
        >
          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-2" />}
        </button>

        <button 
          onClick={playNext}
          className={clsx(
            "w-12 h-12 flex items-center justify-center transition-colors hover:text-text-primary",
            isTron ? "text-cyan-500/70 hover:text-cyan-400" : "text-text-secondary"
          )}
        >
          <SkipForward className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
}
