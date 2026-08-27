import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';

const REST_ANGLE = 5;
const START_ANGLE = 10;
const END_ANGLE = 32;

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function TurntableUnit() {
  const { audioElement, duration, currentSong } = useMusicStore();
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';

  const containerRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetAngleRef = useRef(REST_ANGLE);
  const visualAngleRef = useRef(REST_ANGLE);
  const vinylRotationRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  const pendingSeekTimeRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  // Unified Animation Loop for Tonearm and Vinyl
  useEffect(() => {
    let frameId: number;

    const updatePosition = (timestamp: number) => {
      const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 0;
      lastFrameTimeRef.current = timestamp;

      // 1. Flush pending seek to actual audio
      if (pendingSeekTimeRef.current !== null && audioElement) {
        if (!isDraggingRef.current || (timestamp - lastSeekTimeRef.current > 66)) {
           audioElement.currentTime = pendingSeekTimeRef.current;
           lastSeekTimeRef.current = timestamp;
           pendingSeekTimeRef.current = null;
        }
      }

      // 2. Vinyl Rotation
      if (vinylRef.current) {
        const isAudioPlaying = audioElement ? (!audioElement.paused && !audioElement.ended) : false;
        
        if (isAudioPlaying) {
          vinylRotationRef.current = (vinylRotationRef.current + (90 * (deltaTime / 1000))) % 360;
        }
        vinylRef.current.style.transform = `rotate(${vinylRotationRef.current}deg)`;
      }

      // 3. Tonearm Physics
      if (armRef.current && !isDraggingRef.current) {
        if (!currentSong || !duration || isNaN(duration) || !isFinite(duration)) {
          targetAngleRef.current = REST_ANGLE;
        } else if (audioElement && audioElement.paused && audioElement.currentTime === 0) {
          targetAngleRef.current = REST_ANGLE;
        } else if (audioElement) {
          const progress = audioElement.currentTime / duration;
          const clampedProgress = Math.max(0, Math.min(1, progress));
          targetAngleRef.current = START_ANGLE + (clampedProgress * (END_ANGLE - START_ANGLE));
        }

        const damping = 1 - Math.pow(1 - 0.1, Math.max(1, Math.min(deltaTime, 32)) / 16.66);
        const diff = targetAngleRef.current - visualAngleRef.current;
        visualAngleRef.current += diff * damping;
        
        if (isFinite(visualAngleRef.current)) {
          armRef.current.style.transform = `rotate(${visualAngleRef.current}deg)`;
        }
      }

      frameId = requestAnimationFrame(updatePosition);
    };

    frameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frameId);
  }, [audioElement, duration, currentSong]);

  // Handle Dragging
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !armRef.current || !duration || !isFinite(duration)) return;
    
    // Dynamically query the LIVE pivot rect size, so it perfectly matches `@container` scaled dimensions
    const rect = armRef.current.getBoundingClientRect();
    const pivotWidth = rect.width; // 10cqi at current viewport size
    
    // The transform-origin is 50% 50% of the pivot square (which is the top width x width of the arm container)
    const pivotX = rect.left + (pivotWidth / 2);
    const pivotY = rect.top + (pivotWidth / 2); // The top of the bounding client rect of the ARM container is the pivot
    
    const dx = e.clientX - pivotX;
    const dy = e.clientY - pivotY;
    
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
    
    while (angle <= -180) angle += 360;
    while (angle > 180) angle -= 360;
    
    if (e.shiftKey) {
      let deltaAngle = angle - targetAngleRef.current;
      while (deltaAngle > 180) deltaAngle -= 360;
      while (deltaAngle < -180) deltaAngle += 360;
      angle = targetAngleRef.current + (deltaAngle * 0.10); 
    }
    
    const clampedAngle = Math.max(REST_ANGLE, Math.min(END_ANGLE, angle));
    
    targetAngleRef.current = clampedAngle;
    visualAngleRef.current = clampedAngle;
    armRef.current.style.transform = `rotate(${clampedAngle}deg)`;
    
    let progress = 0;
    if (clampedAngle >= START_ANGLE) {
      progress = (clampedAngle - START_ANGLE) / (END_ANGLE - START_ANGLE);
    }
    progress = Math.max(0, Math.min(1, progress));
    
    const targetTime = progress * duration;
    
    pendingSeekTimeRef.current = targetTime;
    
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
    window.removeEventListener('pointercancel', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration || !isFinite(duration)) return;
    
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
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2" style={{ containerType: 'size' }}>
      {/* The strict container query wrapper. It must never overflow the parent's flex/grid cell. */}
      <div 
        ref={containerRef}
        className="relative @container flex items-center justify-center group"
        style={{
          width: 'min(100cqw, 100cqh)',
          height: 'min(100cqw, 100cqh)'
        }}
      >
      
      {/* Platter & Vinyl Area (Scaled purely by cqi) */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Physical Turntable Platter (90% of container) */}
        <div 
          className={clsx(
            "absolute rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-[2cqmin] transition-colors",
            isTron ? "bg-[#050505] border-cyan-500/20" : "bg-[#0a0a0a] border-[#161616]"
          )}
          style={{ width: '90cqmin', height: '90cqmin' }}
        />
        
        {/* Platter Edge Highlight */}
        <div 
          className="absolute rounded-full border border-white/10 pointer-events-none" 
          style={{ width: '90cqmin', height: '90cqmin' }} 
        />

        {/* Vinyl Disc (82% of container) */}
        <div 
          ref={vinylRef}
          className={clsx(
            "rounded-full border relative overflow-hidden flex items-center justify-center z-10 shadow-[0_5px_15px_rgba(0,0,0,0.9)]",
            isTron ? "border-cyan-500/30 bg-[#050505]" : "border-[#1c1c1c] bg-[#0c0c0c]"
          )}
          style={{ 
            width: '82cqmin', 
            height: '82cqmin',
            willChange: 'transform' 
          }}
        >
          {/* Micro-grooves */}
          <div className="absolute inset-[1cqmin] rounded-full opacity-50 mix-blend-overlay pointer-events-none" style={{
            background: 'repeating-radial-gradient(circle at 50% 50%, transparent, transparent 3px, rgba(255,255,255,0.06) 4px, rgba(0,0,0,0.2) 5px, transparent 6px)'
          }} />

          {/* Macro-groove zones */}
          <div className="absolute inset-0 rounded-full opacity-60 pointer-events-none" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 15%, rgba(0,0,0,0.8) 25%, transparent 35%, rgba(0,0,0,0.9) 55%, transparent 65%, rgba(0,0,0,0.7) 85%, transparent 95%)'
          }} />
          
          {/* Vinyl Sheen/Reflection */}
          <div className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen opacity-20" style={{
            background: 'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.3) 0deg, transparent 40deg, transparent 140deg, rgba(255,255,255,0.3) 180deg, transparent 220deg, transparent 320deg, rgba(255,255,255,0.3) 360deg)'
          }} />
          
          {/* Edge highlight */}
          <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />

          {/* Center Label Area (32% of vinyl) */}
          <div className="w-[32%] h-[32%] rounded-full relative z-10 flex items-center justify-center shadow-[inset_0_0_10cqmin_rgba(0,0,0,0.5),0_0_8cqmin_rgba(0,0,0,0.8)] bg-bg-secondary overflow-hidden border-[0.6cqmin] border-[#111]">
            {currentSong?.artworkUrl ? (
              <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full h-full object-cover opacity-95 transition-opacity duration-500" draggable={false} />
            ) : (
              <div className="text-xl font-serif text-text-muted">{currentSong?.title?.charAt(0)}</div>
            )}
            
            {/* Label Inner Ring */}
            <div className="absolute inset-[10%] rounded-full border border-black/20 pointer-events-none" />

            {/* Spindle hole & Pin (4% of vinyl) */}
            <div className="absolute w-[12%] h-[12%] rounded-full bg-black shadow-[inset_0_1cqmin_3cqmin_rgba(0,0,0,0.8)] z-20 flex items-center justify-center">
              <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 shadow-[0_1cqmin_2cqmin_rgba(0,0,0,0.8)] z-30" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Tonearm (Scaled relative to @container) */}
      <div 
        ref={armRef}
        onPointerDown={handlePointerDown}
        className="absolute z-30 group cursor-pointer drop-shadow-2xl"
        style={{ 
          width: '8cqmin', // Base width is 8% of the container
          height: '60cqmin', // Properly scaled length to reach the center of the record
          top: '5cqmin', // Anchored inside the container's top right
          right: '5cqmin', // Anchored inside the right bounds
          transformOrigin: '4cqmin 4cqmin', // Exact center of the 8x8 top pivot bounding box
          transform: `rotate(${REST_ANGLE}deg)`,
          willChange: 'transform',
          touchAction: 'none'
        }}
      >
        {/* Expanded Invisible Grab Area */}
        <div className="absolute inset-y-0 -inset-x-[150%]" />
        
        {/* Live Tooltip Feedback while dragging */}
        <div 
          ref={tooltipRef}
          className={clsx(
            "absolute bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-xl pointer-events-none transition-opacity duration-200 whitespace-nowrap text-sm",
            isDragging ? "opacity-100" : "opacity-0",
            isTron ? "border-cyan-500/50 text-cyan-400 font-mono" : "border-white/10 text-white font-medium"
          )}
          style={{ top: '15cqmin', left: '12cqmin' }}
        >
          {formatTime(audioElement?.currentTime || 0)} / {duration ? formatTime(duration) : '0:00'}
        </div>

        {/* Mechanical Pivot Assembly */}
        <div className={clsx(
          "absolute top-0 left-0 w-full aspect-square rounded-full shadow-[0_1cqmin_2cqmin_rgba(0,0,0,0.8)] z-20 flex items-center justify-center transition-colors",
          isTron ? "bg-[#050505] shadow-[0_0_1.5cqmin_rgba(6,182,212,0.5)]" : "bg-[#111]"
        )} style={{ border: '0.6cqmin solid #222' }}>
          {/* Inner bearing */}
          <div className={clsx(
            "w-[40%] h-[40%] rounded-full border shadow-inner flex items-center justify-center",
            isTron ? "bg-black border-cyan-500/50" : "bg-gradient-to-br from-gray-600 to-gray-900 border-black"
          )}>
             <div className={clsx(
               "w-[30%] h-[30%] rounded-full",
               isTron ? "bg-cyan-400 shadow-[0_0_1cqmin_cyan]" : "bg-gray-400"
             )} />
          </div>
        </div>
        
        {/* Counterweight */}
        <div className={clsx(
          "absolute rounded-[0.2cqmin] shadow-2xl z-10",
          isTron ? "bg-[#050505] border border-cyan-500/30" : "bg-gradient-to-b from-gray-500 to-gray-700 border border-gray-400/50"
        )} style={{ top: '-8cqmin', left: '20%', width: '60%', height: '10cqmin' }}>
          <div className="absolute top-[20%] inset-x-0 h-[0.4cqmin] bg-black/60 shadow-sm" />
          <div className="absolute top-[50%] inset-x-0 h-[0.4cqmin] bg-black/60 shadow-sm" />
          <div className="absolute top-[80%] inset-x-0 h-[0.4cqmin] bg-black/60 shadow-sm" />
        </div>

        {/* Main Arm Tube */}
        <div 
          className={clsx(
            "absolute rounded-full shadow-2xl z-10",
            isTron ? "bg-cyan-950/80 border-x border-cyan-500/40" : "bg-gradient-to-r from-gray-300 via-white to-gray-400 border-x border-gray-200/50"
          )} 
          style={{ top: '8cqmin', left: '42%', width: '16%', height: 'calc(100% - 10cqmin)' }}
        >
          {/* Highlight along the tube */}
          <div className={clsx(
            "absolute inset-y-0 left-[20%] w-[10%]",
            isTron ? "bg-cyan-300 opacity-60" : "bg-white opacity-80"
          )} />
        </div>
        
        {/* Headshell & Cartridge Assembly */}
        <div className={clsx(
          "absolute shadow-2xl origin-top z-20 flex flex-col items-center",
          isTron ? "bg-[#050505] border border-cyan-500/60" : "bg-[#1a1a1a] border-t border-r border-[#333]"
        )} style={{ 
            bottom: '-2cqmin', 
            left: '10%', 
            width: '180%', 
            height: '16cqmin', 
            rotate: '22deg', 
            borderRadius: '0.4cqmin' 
        }}>
          {/* Mount connecting headshell to arm */}
          <div className={clsx(
            "w-[40%] h-[15%] -mt-[15%] shadow-inner",
            isTron ? "bg-cyan-800" : "bg-gray-400"
          )} style={{ borderTopLeftRadius: '0.4cqmin', borderTopRightRadius: '0.4cqmin' }} />
          
          {/* Cartridge Body */}
          <div className="w-[60%] h-[35%] mt-[10%] border border-black/50 bg-[#111] flex items-center justify-center shadow-lg">
             {/* Stylus indicator / needle housing */}
             <div className={clsx(
               "w-[35%] h-[20%] rounded-full shadow-md",
               isTron ? "bg-cyan-500 shadow-[0_0_1cqmin_cyan]" : "bg-red-600 shadow-[0_0_0.8cqmin_rgba(255,0,0,0.5)]"
             )} />
          </div>

          {/* Needle guard / tip highlight */}
          <div className={clsx(
            "absolute -bottom-[15%] left-1/2 -translate-x-1/2 w-[4%] h-[25%] shadow-md",
            isTron ? "bg-cyan-300" : "bg-gray-300"
          )} />
        </div>
      </div>
      </div>
    </div>
  );
}
