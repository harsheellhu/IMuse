import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';

const REST_ANGLE = 5;
const START_ANGLE = 22;
const END_ANGLE = 55;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function TurntableUnit() {
  const { audioElement, duration, currentSong, isPlaying } = useMusicStore();
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';

  const armRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetAngleRef = useRef(REST_ANGLE);
  const visualAngleRef = useRef(REST_ANGLE);
  const vinylRotationRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Pending seek requested by dragging, flushed once per frame
  const pendingSeekTimeRef = useRef<number | null>(null);

  // Unified Animation Loop for Tonearm and Vinyl
  useEffect(() => {
    let frameId: number;

    const updatePosition = (timestamp: number) => {
      const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 0;
      lastFrameTimeRef.current = timestamp;

      // 1. Flush pending seek to actual audio (throttle to avoid crashing audio engine)
      if (pendingSeekTimeRef.current !== null && audioElement) {
        // Only seek if we're not spamming it too fast (e.g., max 10 times a second)
        const lastSeek = parseInt(audioElement.dataset.lastSeek || '0', 10);
        if (!isDraggingRef.current || (timestamp - lastSeek > 100)) {
           audioElement.currentTime = pendingSeekTimeRef.current;
           audioElement.dataset.lastSeek = timestamp.toString();
           pendingSeekTimeRef.current = null;
        }
      }

      // 2. Vinyl Rotation (Constant 4s per revolution when playing = 90 deg/s)
      if (vinylRef.current) {
        // We read from the actual audio paused state, not just React state, for perfect sync
        const isAudioPlaying = audioElement ? !audioElement.paused : false;
        
        if (isAudioPlaying) {
          vinylRotationRef.current = (vinylRotationRef.current + (90 * (deltaTime / 1000))) % 360;
        }
        vinylRef.current.style.transform = `rotate(${vinylRotationRef.current}deg)`;
      }

      // 3. Tonearm Physics
      if (armRef.current && !isDraggingRef.current) {
        if (!currentSong || !duration || isNaN(duration)) {
          // No song loaded
          targetAngleRef.current = REST_ANGLE;
        } else if (audioElement && audioElement.paused && audioElement.currentTime === 0) {
          // Stopped at beginning
          targetAngleRef.current = REST_ANGLE;
        } else if (audioElement) {
          // Playing or paused mid-song
          const progress = audioElement.currentTime / duration;
          const clampedProgress = Math.max(0, Math.min(1, progress));
          targetAngleRef.current = START_ANGLE + (clampedProgress * (END_ANGLE - START_ANGLE));
        }

        // Apply delta-time aware damped spring interpolation (approx 0.1 at 60fps -> 16ms)
        const damping = 1 - Math.pow(1 - 0.1, deltaTime / 16.66);
        const diff = targetAngleRef.current - visualAngleRef.current;
        visualAngleRef.current += diff * damping;
        
        armRef.current.style.transform = `rotate(${visualAngleRef.current}deg)`;
      }

      frameId = requestAnimationFrame(updatePosition);
    };

    frameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frameId);
  }, [audioElement, duration, currentSong]); // Minimal dependencies

  // Handle Dragging
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !armRef.current || !duration) return;
    
    // Determine pivot center
    const rect = armRef.current.getBoundingClientRect();
    const pivotX = rect.left + 24;
    const pivotY = rect.top + 24;
    
    const dx = e.clientX - pivotX;
    const dy = e.clientY - pivotY;
    
    // Calculate raw angle from pivot pointing straight down
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
    
    if (angle < -180) angle += 360;
    if (angle > 180) angle -= 360;
    
    // Fine control mode (Shift)
    if (e.shiftKey) {
      const deltaAngle = angle - targetAngleRef.current;
      let normalizedDelta = deltaAngle;
      if (normalizedDelta > 180) normalizedDelta -= 360;
      if (normalizedDelta < -180) normalizedDelta += 360;
      
      angle = targetAngleRef.current + (normalizedDelta * 0.15); // Heavily reduced sensitivity
    }
    
    // Clamp to valid physical range
    const clampedAngle = Math.max(REST_ANGLE, Math.min(END_ANGLE + 2, angle));
    
    // Visually update the DOM immediately (1:1 when dragging)
    targetAngleRef.current = clampedAngle;
    visualAngleRef.current = clampedAngle;
    armRef.current.style.transform = `rotate(${clampedAngle}deg)`;
    
    // Map to audio progress
    let progress = 0;
    if (clampedAngle >= START_ANGLE) {
      progress = (clampedAngle - START_ANGLE) / (END_ANGLE - START_ANGLE);
    }
    progress = Math.max(0, Math.min(1, progress));
    
    const targetTime = progress * duration;
    
    // Schedule seek for the next RAF to avoid blocking main thread with dense audio seeking
    pendingSeekTimeRef.current = targetTime;
    
    // Update tooltip DOM directly to avoid React re-renders on pointer move
    if (tooltipRef.current) {
      tooltipRef.current.textContent = `${formatTime(targetTime)} / ${formatTime(duration)}`;
    }
    
  }, [duration]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (armRef.current) {
      armRef.current.releasePointerCapture(e.pointerId);
    }
    
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    e.preventDefault(); 
    
    isDraggingRef.current = true;
    setIsDragging(true);
    
    if (armRef.current) {
      armRef.current.setPointerCapture(e.pointerId);
    }
    
    if (tooltipRef.current) {
      tooltipRef.current.textContent = `${formatTime(audioElement?.currentTime || 0)} / ${formatTime(duration)}`;
    }
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className={clsx(
      "relative w-full max-w-[480px] md:max-w-[560px] aspect-[4/3] rounded-3xl p-6 md:p-10 shadow-2xl flex items-center border",
      isTron ? "bg-black border-cyan-500/20 shadow-[0_0_80px_rgba(6,182,212,0.1)]" : "bg-[#111] border-[#222] shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
    )}>
      {/* Platter & Vinyl Area */}
      <div className="relative h-full aspect-square flex items-center justify-center ml-2 md:ml-4">
        
        {/* Turntable Platter (Base under record) */}
        <div className={clsx(
          "absolute -inset-3 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.9)] border-2",
          isTron ? "bg-[#050505] border-cyan-500/10" : "bg-[#0a0a0a] border-[#1a1a1a]"
        )} />
        
        {/* Platter Edge Highlight */}
        <div className="absolute -inset-3 rounded-full border border-white/5 pointer-events-none" />

        {/* Vinyl Disc - Rotation is handled purely by the ref and RAF loop, NOT css spin animations */}
        <div 
          ref={vinylRef}
          className={clsx(
            "w-full h-full rounded-full border relative overflow-hidden flex items-center justify-center z-10",
            isTron ? "border-cyan-500/30 bg-[#050505]" : "border-[#1c1c1c] bg-[#0c0c0c]"
          )}
          style={{ willChange: 'transform' }} // Optimize GPU rendering
        >
          {/* Micro-grooves */}
          <div className="absolute inset-1 rounded-full opacity-60 pointer-events-none" style={{
            background: 'repeating-radial-gradient(circle at 50% 50%, transparent, transparent 2px, rgba(255,255,255,0.02) 3px, transparent 4px)'
          }} />

          {/* Macro-groove zones (Outer, Middle, Inner) */}
          <div className="absolute inset-0 rounded-full opacity-40 pointer-events-none" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.5) 30%, transparent 35%, rgba(0,0,0,0.6) 60%, transparent 65%, rgba(0,0,0,0.4) 85%, transparent 90%)'
          }} />
          
          {/* Vinyl Sheen/Reflection */}
          <div className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen opacity-20" style={{
            background: 'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.2) 0deg, transparent 40deg, transparent 140deg, rgba(255,255,255,0.2) 180deg, transparent 220deg, transparent 320deg, rgba(255,255,255,0.2) 360deg)'
          }} />
          
          {/* Edge highlight */}
          <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />

          {/* Center Label Area */}
          <div className="w-[32%] h-[32%] rounded-full relative z-10 flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.6),0_0_5px_rgba(0,0,0,0.5)] bg-bg-secondary overflow-hidden border border-[#222]">
            {currentSong?.artworkUrl ? (
              <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full h-full object-cover opacity-90" />
            ) : (
              <div className="text-2xl font-serif text-text-muted">{currentSong?.title?.charAt(0)}</div>
            )}
            
            {/* Label Inner Ring */}
            <div className="absolute inset-2 rounded-full border border-black/20 pointer-events-none" />

            {/* Spindle hole */}
            <div className="absolute w-3.5 h-3.5 rounded-full bg-black shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)] border border-white/10 z-20" />
            {/* Spindle Pin */}
            <div className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-gray-300 to-gray-600 shadow-[0_2px_5px_rgba(0,0,0,0.8)] z-30" />
          </div>
        </div>
      </div>
      
      {/* Interactive Tonearm directly integrated */}
      <div 
        ref={armRef}
        onPointerDown={handlePointerDown}
        className={clsx(
          "absolute top-8 right-8 md:top-12 md:right-12 z-30 touch-none group cursor-pointer"
        )} 
        style={{ 
          width: '48px',
          height: '80%', 
          transformOrigin: '24px 24px', // Center of the 48px pivot
          transform: `rotate(${REST_ANGLE}deg)`,
          willChange: 'transform' // Optimize GPU rendering
        }}
      >
        {/* Expanded Invisible Grab Area */}
        <div className="absolute inset-y-0 -inset-x-12" />
        
        {/* Live Tooltip Feedback while dragging */}
        <div 
          ref={tooltipRef}
          className={clsx(
            "absolute top-16 left-16 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-xl pointer-events-none transition-opacity duration-200 whitespace-nowrap",
            isDragging ? "opacity-100" : "opacity-0",
            isTron ? "border-cyan-500/50 text-cyan-400 font-mono" : "border-white/10 text-white font-medium text-sm"
          )}
        >
          {formatTime(audioElement?.currentTime || 0)} / {duration ? formatTime(duration) : '0:00'}
        </div>

        {/* Mechanical Pivot Assembly */}
        <div className={clsx(
          "absolute top-0 left-0 w-12 h-12 rounded-full border-4 shadow-xl z-20 flex items-center justify-center transition-colors",
          isTron ? "bg-[#050505] border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-[#1a1a1a] border-[#333]",
          isDragging && (isTron ? "border-cyan-400" : "border-gray-400")
        )}>
          <div className={clsx(
            "w-5 h-5 rounded-full border shadow-inner",
            isTron ? "bg-black border-cyan-500/50" : "bg-gradient-to-br from-gray-700 to-gray-900 border-black"
          )}>
             <div className={clsx(
               "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
               isTron ? "bg-cyan-400" : "bg-gray-400"
             )} />
          </div>
        </div>
        
        {/* Counterweight */}
        <div className={clsx(
          "absolute -top-8 left-[14px] w-5 h-10 rounded-sm shadow-xl z-10",
          isTron ? "bg-[#050505] border border-cyan-500/30" : "bg-gradient-to-b from-gray-500 to-gray-700 border border-gray-400/50"
        )}>
          <div className="absolute top-2 inset-x-0 h-px bg-black/40" />
          <div className="absolute top-4 inset-x-0 h-px bg-black/40" />
          <div className="absolute top-6 inset-x-0 h-px bg-black/40" />
        </div>

        {/* Main Arm Tube */}
        <div 
          className={clsx(
            "absolute top-10 left-[20px] w-2 rounded-full shadow-2xl z-10",
            isTron ? "bg-cyan-950/80 border-x border-cyan-500/40" : "bg-gradient-to-r from-gray-300 via-white to-gray-400 border-x border-gray-200/50"
          )} 
          style={{ height: 'calc(100% - 40px)' }}
        >
          <div className={clsx(
            "absolute inset-y-0 left-0 w-[1px] opacity-60",
            isTron ? "bg-cyan-300" : "bg-white"
          )} />
        </div>
        
        {/* Headshell & Cartridge */}
        <div className={clsx(
          "absolute bottom-[-10px] left-[6px] w-7 h-14 rounded-sm shadow-2xl rotate-[22deg] origin-top z-20 flex flex-col items-center",
          isTron ? "bg-[#050505] border border-cyan-500/60" : "bg-[#181818] border-t border-r border-[#333]"
        )}>
          <div className={clsx(
            "w-3 h-2 -mt-2",
            isTron ? "bg-cyan-800" : "bg-gray-400"
          )} />
          
          <div className="w-5 h-6 mt-1 border border-black/50 bg-[#111] flex items-center justify-center">
             <div className={clsx(
               "w-2 h-1 rounded-full",
               isTron ? "bg-cyan-500" : "bg-red-600"
             )} />
          </div>

          <div className={clsx(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-[1px] h-3",
            isTron ? "bg-cyan-300 shadow-[0_0_8px_cyan]" : "bg-gray-300"
          )} />
        </div>
      </div>
    </div>
  );
}
