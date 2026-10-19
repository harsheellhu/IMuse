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

  useEffect(() => {
    if (!lyrics || lyrics.length === 0 || !audioElement) return;

    let frameId: number;

    const updateLyrics = () => {
      const time = audioElement.currentTime;
      let newIndex = -1;

      // Find current line based on time
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (time >= lyrics[i].time) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== activeLineIndex) {
        setActiveLineIndex(newIndex);
        // Scroll the active line into view smoothly
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

      frameId = requestAnimationFrame(updateLyrics);
    };

    frameId = requestAnimationFrame(updateLyrics);
    return () => cancelAnimationFrame(frameId);
  }, [lyrics, audioElement, activeLineIndex]);

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
      className="flex-1 w-full overflow-y-auto pr-4 space-y-4 pb-20 relative"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: '-webkit-linear-gradient(top, transparent, black 10%, black 90%, transparent)'
      }}
    >
      <div className="pt-20" /> {/* Top spacer */}
      
      {lyrics.map((line, idx) => {
        const isActive = idx === activeLineIndex;
        const isPast = idx < activeLineIndex;
        
        return (
          <div 
            key={idx}
            ref={(el) => (linesRef.current[idx] = el)}
            className={clsx(
              "transition-all duration-500 ease-out origin-left break-words",
              isActive 
                ? clsx("text-2xl md:text-3xl font-semibold scale-100", isTron ? "text-cyan-400 drop-shadow-[0_0_12px_rgba(0,255,255,0.4)]" : "text-white drop-shadow-lg") 
                : isPast 
                  ? "text-lg md:text-xl font-medium text-white/30 scale-95"
                  : "text-lg md:text-xl font-medium text-white/50 scale-95"
            )}
          >
            {line.text}
          </div>
        );
      })}
      
      <div className="pb-32" /> {/* Bottom spacer */}
    </div>
  );
}
