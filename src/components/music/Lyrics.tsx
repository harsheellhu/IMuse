import React, { useRef, useEffect, useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';

export function Lyrics() {
  const { currentSong, audioElement } = useMusicStore(useShallow(s => ({
    currentSong: s.currentSong,
    audioElement: s.audioElement
  })));
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';
  
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);

  const lyrics = currentSong?.lyrics;

  // Synchronize active line on audio time updates (no dedicated per-frame RAF loop)
  useEffect(() => {
    if (!lyrics || lyrics.length === 0 || !audioElement) return;

    let lastIndex = -1;

    const checkTime = () => {
      const time = audioElement.currentTime;
      let newIndex = -1;

      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (time >= lyrics[i].time) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== lastIndex) {
        lastIndex = newIndex;
        setActiveLineIndex(newIndex);

        // Smoothly scroll active line to center
        const lineEl = linesRef.current[newIndex];
        const container = containerRef.current;
        if (lineEl && container) {
          const containerCenter = container.clientHeight / 2;
          const lineOffset = lineEl.offsetTop;
          const lineHeight = lineEl.clientHeight;
          
          container.scrollTo({
            top: lineOffset - containerCenter + (lineHeight / 2),
            behavior: 'smooth'
          });
        }
      }
    };

    audioElement.addEventListener('timeupdate', checkTime);
    checkTime(); // Initial check

    return () => {
      audioElement.removeEventListener('timeupdate', checkTime);
    };
  }, [lyrics, audioElement]);

  // Reset scroll and refs when song changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setActiveLineIndex(-1);
  }, [currentSong?.id]);

  if (!lyrics || lyrics.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full overflow-y-auto pr-3 space-y-3.5 pb-16 relative select-none scrollbar-hide"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: '-webkit-linear-gradient(top, transparent, black 15%, black 85%, transparent)'
      }}
    >
      <div className="pt-16" /> {/* Top spacer */}
      
      {lyrics.map((line, idx) => {
        const isActive = idx === activeLineIndex;
        const isPast = idx < activeLineIndex;
        
        return (
          <div 
            key={`lyric-${idx}`}
            ref={(el) => { linesRef.current[idx] = el; }}
            className={clsx(
              "transition-all duration-300 ease-out origin-left break-words cursor-pointer",
              isActive 
                ? clsx(
                    "text-xl md:text-2xl font-semibold scale-100", 
                    isTron 
                      ? "text-cyan-400 drop-shadow-[0_0_12px_rgba(0,255,255,0.4)]" 
                      : "text-white drop-shadow-md"
                  ) 
                : isPast 
                  ? "text-base md:text-lg font-medium text-white/30 scale-95 hover:text-white/60"
                  : "text-base md:text-lg font-medium text-white/50 scale-95 hover:text-white/80"
            )}
            onClick={() => {
              if (audioElement && line.time !== undefined) {
                audioElement.currentTime = line.time;
              }
            }}
          >
            {line.text}
          </div>
        );
      })}
      
      <div className="pb-24" /> {/* Bottom spacer */}
    </div>
  );
}
