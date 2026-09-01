import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useShallow } from 'zustand/react/shallow';
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
  const { audioElement, duration, currentSong } = useMusicStore(useShallow(s => ({
    audioElement: s.audioElement,
    duration: s.duration,
    currentSong: s.currentSong
  })));
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);
  const armShadowRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetAngleRef = useRef(REST_ANGLE);
  const visualAngleRef = useRef(REST_ANGLE);
  const vinylRotationRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  const pendingSeekTimeRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  // Parallax tilt state
  const parallaxRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });

  // Mouse move for subtle 3D scene parallax (respects prefers-reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
      parallaxRef.current.targetX = Math.max(-1, Math.min(1, normX)) * 2.5; // Max +-2.5 deg tilt
      parallaxRef.current.targetY = Math.max(-1, Math.min(1, normY)) * -2.5;
    };

    const handleMouseLeave = () => {
      parallaxRef.current.targetX = 0;
      parallaxRef.current.targetY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Unified Animation Loop for Tonearm, Vinyl & 3D Stage Parallax
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

      // 2. Smooth 3D Stage Parallax Tilt
      if (stageRef.current) {
        const p = parallaxRef.current;
        p.currentX += (p.targetX - p.currentX) * 0.08;
        p.currentY += (p.targetY - p.currentY) * 0.08;
        const baseRotX = 13 + p.currentY;
        const baseRotY = -3.5 + p.currentX;
        stageRef.current.style.transform = `rotateX(${baseRotX}deg) rotateY(${baseRotY}deg)`;
      }

      // 3. Vinyl Rotation (Smooth continuous spinning)
      if (vinylRef.current) {
        const isAudioPlaying = audioElement ? (!audioElement.paused && !audioElement.ended) : false;
        
        if (isAudioPlaying) {
          vinylRotationRef.current = (vinylRotationRef.current + (90 * (deltaTime / 1000))) % 360;
        }
        vinylRef.current.style.transform = `rotate(${vinylRotationRef.current}deg)`;
      }

      // 4. Tonearm Physics & Dynamic Contact Shadow
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
          if (armShadowRef.current) {
            armShadowRef.current.style.transform = `rotate(${visualAngleRef.current}deg)`;
          }
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
    
    // Query live pivot rect size for exact container query coordinate matching
    const rect = armRef.current.getBoundingClientRect();
    const pivotWidth = rect.width;
    
    const pivotX = rect.left + (pivotWidth / 2);
    const pivotY = rect.top + (pivotWidth / 2);
    
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
    if (armShadowRef.current) {
      armShadowRef.current.style.transform = `rotate(${clampedAngle}deg)`;
    }
    
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
    <div 
      className="relative w-full h-full flex items-center justify-center p-2 select-none" 
      style={{ containerType: 'size' }}
    >
      {/* Container query root */}
      <div 
        ref={containerRef}
        className="relative @container flex items-center justify-center group"
        style={{
          width: 'min(100cqw, 100cqh)',
          height: 'min(100cqw, 100cqh)',
          perspective: '1300px',
        }}
      >
        
        {/* 3D Turntable Scene Stage */}
        <div
          ref={stageRef}
          className="relative w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(13deg) rotateY(-3.5deg)',
          }}
        >

          {/* =========================================================================
              1. 3D CHASSIS / PLINTH (Hi-Fi Base Deck)
             ========================================================================= */}
          <div 
            className={clsx(
              "absolute rounded-[5cqmin] transition-all duration-500",
              isTron 
                ? "bg-[#040810] border border-cyan-500/30 shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.15)]"
                : "bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0c0c0e] border border-white/10 shadow-[0_35px_80px_rgba(0,0,0,0.85),0_10px_25px_rgba(0,0,0,0.6)]"
            )}
            style={{
              width: '98cqmin',
              height: '98cqmin',
              transform: 'translateZ(-4cqmin)',
            }}
          >
            {/* Top Chamfer Edge Highlight */}
            <div className="absolute inset-0 rounded-[5cqmin] border-t border-l border-white/15 pointer-events-none" />
            <div className="absolute inset-0 rounded-[5cqmin] border-b border-r border-black/80 pointer-events-none" />

            {/* Brushed Texture Sheen */}
            <div 
              className="absolute inset-0 rounded-[5cqmin] opacity-30 pointer-events-none mix-blend-overlay"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)',
              }}
            />

            {/* Speed Selector (33 / 45 RPM Button) */}
            <div 
              className={clsx(
                "absolute bottom-[5cqmin] left-[6cqmin] w-[6cqmin] h-[6cqmin] rounded-full border flex items-center justify-center shadow-lg",
                isTron 
                  ? "bg-[#02060d] border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "bg-gradient-to-b from-gray-700 to-gray-900 border-white/20 text-gray-300"
              )}
            >
              <span className="text-[1.4cqmin] font-mono font-bold tracking-tighter">33</span>
            </div>

            {/* Power Strobe Light Pillar */}
            <div 
              className={clsx(
                "absolute top-[6cqmin] left-[6cqmin] w-[4cqmin] h-[7cqmin] rounded-t-[1cqmin] border shadow-md flex items-center justify-center",
                isTron 
                  ? "bg-[#010814] border-cyan-500/50 shadow-[0_0_15px_cyan]" 
                  : "bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-950 border-white/15"
              )}
            >
              <div 
                className={clsx(
                  "w-[1.5cqmin] h-[3cqmin] rounded-full",
                  isTron 
                    ? "bg-cyan-400 shadow-[0_0_8px_cyan] animate-pulse" 
                    : "bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                )} 
              />
            </div>

            {/* Hi-Fi Logo Badge */}
            <div className="absolute bottom-[5.5cqmin] right-[24cqmin] flex items-center gap-1 opacity-60">
              <span className={clsx("text-[1.4cqmin] font-serif tracking-widest uppercase", isTron ? "text-cyan-400 font-mono" : "text-gray-400")}>
                iMUSE • HI-FI
              </span>
            </div>

            {/* Platter Recessed Basin (Circular Well) */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/90 shadow-[inset_0_5px_20px_rgba(0,0,0,0.95)]"
              style={{
                width: '91cqmin',
                height: '91cqmin',
                background: isTron ? '#020408' : '#070709',
              }}
            />
          </div>

          {/* =========================================================================
              2. 3D MACHINED PLATTER & SLIPMAT (Physical Rotary Disc)
             ========================================================================= */}
          
          {/* Platter Lower Machined Rim (Cast Drop Shadow & Strobe Rim) */}
          <div 
            className={clsx(
              "absolute rounded-full border-[1.2cqmin] transition-colors shadow-[0_20px_50px_rgba(0,0,0,0.95)]",
              isTron 
                ? "bg-[#050b14] border-cyan-500/25 shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
                : "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border-zinc-600/40"
            )}
            style={{
              width: '89cqmin',
              height: '89cqmin',
              transform: 'translateZ(-1.5cqmin)',
            }}
          >
            {/* Platter Strobe Marks (High-precision perimeter dots) */}
            <div 
              className="absolute inset-0 rounded-full opacity-40 pointer-events-none"
              style={{
                background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.25) 0deg 1deg, transparent 1deg 4deg)',
              }}
            />
          </div>

          {/* Platter Rubber Slipmat */}
          <div 
            className={clsx(
              "absolute rounded-full border shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]",
              isTron ? "bg-[#02050a] border-cyan-500/20" : "bg-[#111113] border-white/5"
            )}
            style={{
              width: '85cqmin',
              height: '85cqmin',
              transform: 'translateZ(0cqmin)',
            }}
          >
            {/* Slipmat concentric grip rings */}
            <div 
              className="absolute inset-[4cqmin] rounded-full border border-white/5 pointer-events-none" 
            />
            <div 
              className="absolute inset-[10cqmin] rounded-full border border-white/5 pointer-events-none" 
            />
          </div>

          {/* =========================================================================
              3. 3D REAL VINYL LP (Thickness, Edge Chamfer, Grooves, Sheen, Label)
             ========================================================================= */}
          
          {/* Vinyl Edge 3D Extrusion (Dark Charcoal Physical Edge Layer) */}
          <div 
            className={clsx(
              "absolute rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.95)] border",
              isTron ? "bg-[#020408] border-cyan-500/30" : "bg-[#08080a] border-white/10"
            )}
            style={{
              width: '82.4cqmin',
              height: '82.4cqmin',
              transform: 'translateZ(1.2cqmin)',
            }}
          />

          {/* Top Vinyl Disc Face */}
          <div 
            ref={vinylRef}
            className={clsx(
              "rounded-full border relative overflow-hidden flex items-center justify-center z-10",
              isTron 
                ? "border-cyan-500/40 bg-[#03060c] shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                : "border-[#222225] bg-[#0c0c0e] shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            )}
            style={{ 
              width: '82cqmin', 
              height: '82cqmin',
              transform: 'translateZ(2cqmin)',
              willChange: 'transform',
            }}
          >
            {/* Outer Lead-in Groove Rim */}
            <div className="absolute inset-0 rounded-full border border-white/15 pointer-events-none" />
            <div className="absolute inset-[1.2cqmin] rounded-full border border-black/80 pointer-events-none" />

            {/* Micro-grooves Matrix (High-Fidelity Radial Audio Grooves) */}
            <div 
              className="absolute inset-[2cqmin] rounded-full opacity-65 mix-blend-overlay pointer-events-none" 
              style={{
                background: 'repeating-radial-gradient(circle at 50% 50%, transparent, transparent 2px, rgba(255,255,255,0.07) 3px, rgba(0,0,0,0.3) 4px, transparent 5px)',
              }} 
            />

            {/* Track Separation Bands (Distinct song tracks on vinyl surface) */}
            <div 
              className="absolute inset-0 rounded-full opacity-60 pointer-events-none" 
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 16%, rgba(0,0,0,0.85) 26%, transparent 28%, rgba(0,0,0,0.9) 45%, transparent 47%, rgba(0,0,0,0.85) 68%, transparent 70%, rgba(0,0,0,0.8) 88%, transparent 92%)',
              }} 
            />
            
            {/* Anisotropic Light Sheen / Directional Vinyl Reflections */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen opacity-25" 
              style={{
                background: 'conic-gradient(from 30deg at 50% 50%, rgba(255,255,255,0.4) 0deg, transparent 45deg, transparent 135deg, rgba(255,255,255,0.4) 180deg, transparent 225deg, transparent 315deg, rgba(255,255,255,0.4) 360deg)',
              }} 
            />

            {/* Secondary Cross Light Specular Sheen */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none mix-blend-overlay opacity-30" 
              style={{
                background: 'conic-gradient(from 120deg at 50% 50%, rgba(255,255,255,0.3) 0deg, transparent 60deg, transparent 120deg, rgba(255,255,255,0.3) 180deg, transparent 240deg, transparent 300deg, rgba(255,255,255,0.3) 360deg)',
              }} 
            />
            
            {/* Inner Run-Out Spiral Groove */}
            <div className="absolute inset-[27%] rounded-full border border-white/10 pointer-events-none" />

            {/* Center Label Area (32% of vinyl LP) */}
            <div 
              className={clsx(
                "w-[32%] h-[32%] rounded-full relative z-10 flex items-center justify-center overflow-hidden border-[0.6cqmin]",
                isTron 
                  ? "border-cyan-500/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.3)] bg-[#040810]" 
                  : "border-[#141416] shadow-[inset_0_0_12px_rgba(0,0,0,0.7),0_0_10px_rgba(0,0,0,0.9)] bg-[#1a1a1d]"
              )}
            >
              {currentSong?.artworkUrl ? (
                <img 
                  src={currentSong.artworkUrl} 
                  alt={currentSong.title} 
                  className="w-full h-full object-cover opacity-95 transition-opacity duration-500" 
                  draggable={false} 
                />
              ) : (
                <div className="text-xl font-serif text-text-muted">{currentSong?.title?.charAt(0)}</div>
              )}
              
              {/* Label Recessed Shadow Ring */}
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] pointer-events-none" />
              <div className="absolute inset-[8%] rounded-full border border-black/30 pointer-events-none" />

              {/* 3D Center Spindle & Pin */}
              <div className="absolute w-[14%] h-[14%] rounded-full bg-black shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)] z-20 flex items-center justify-center">
                {/* 3D Machined Chrome Center Spindle */}
                <div 
                  className={clsx(
                    "w-[65%] h-[65%] rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.9)] z-30 border",
                    isTron 
                      ? "bg-gradient-to-b from-cyan-200 via-cyan-500 to-cyan-900 border-cyan-300"
                      : "bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-700 border-white/40"
                  )} 
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              4. DYNAMIC TONEARM CONTACT SHADOW (Casts on Vinyl Surface)
             ========================================================================= */}
          <div 
            ref={armShadowRef}
            className="absolute z-20 pointer-events-none opacity-30 blur-[0.4cqmin]"
            style={{ 
              width: '8cqmin',
              height: '60cqmin',
              top: '5.5cqmin',
              right: '4.5cqmin',
              transformOrigin: '4cqmin 4cqmin',
              transform: `rotate(${REST_ANGLE}deg)`,
              willChange: 'transform',
            }}
          >
            {/* Arm Tube Shadow */}
            <div 
              className="absolute bg-black rounded-full" 
              style={{ top: '8cqmin', left: '40%', width: '20%', height: 'calc(100% - 10cqmin)' }} 
            />
            {/* Headshell Shadow */}
            <div 
              className="absolute bg-black rounded-md" 
              style={{ bottom: '-2cqmin', left: '8%', width: '180%', height: '16cqmin', rotate: '22deg' }} 
            />
          </div>

          {/* =========================================================================
              5. 3D PRECISION MECHANICAL TONEARM ASSEMBLY
             ========================================================================= */}
          <div 
            ref={armRef}
            data-cursor="grab"
            onPointerDown={handlePointerDown}
            className="absolute z-30 group cursor-grab active:cursor-grabbing drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] turntable-tonearm"
            style={{ 
              width: '8cqmin', 
              height: '60cqmin', 
              top: '5cqmin', 
              right: '5cqmin', 
              transformOrigin: '4cqmin 4cqmin', 
              transform: `rotate(${REST_ANGLE}deg)`,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              touchAction: 'none',
            }}
          >
            {/* Expanded Invisible Grab Hitbox for effortless seeking */}
            <div className="absolute inset-y-0 -inset-x-[160%]" />
            
            {/* Live Tooltip Feedback while dragging */}
            <div 
              ref={tooltipRef}
              className={clsx(
                "absolute bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-2xl pointer-events-none transition-opacity duration-200 whitespace-nowrap text-sm z-50",
                isDragging ? "opacity-100" : "opacity-0",
                isTron ? "border-cyan-500/50 text-cyan-400 font-mono" : "border-white/15 text-white font-medium"
              )}
              style={{ top: '15cqmin', left: '14cqmin', transform: 'translateZ(10cqmin)' }}
            >
              {formatTime(audioElement?.currentTime || 0)} / {duration ? formatTime(duration) : '0:00'}
            </div>

            {/* --- Pivot Gimbal Mounting Collar --- */}
            <div 
              className={clsx(
                "absolute top-0 left-0 w-full aspect-square rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.9)] z-20 flex items-center justify-center border",
                isTron 
                  ? "bg-[#030814] border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                  : "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border-white/20"
              )}
              style={{ transform: 'translateZ(3.5cqmin)' }}
            >
              {/* Outer Gimbal Ring */}
              <div 
                className={clsx(
                  "w-[80%] h-[80%] rounded-full border shadow-inner flex items-center justify-center",
                  isTron 
                    ? "bg-[#02050c] border-cyan-400/40" 
                    : "bg-gradient-to-br from-zinc-500 via-zinc-700 to-zinc-900 border-black/60"
                )}
              >
                {/* Center Pivot Bearing Ball */}
                <div 
                  className={clsx(
                    "w-[45%] h-[45%] rounded-full shadow-md",
                    isTron 
                      ? "bg-cyan-400 shadow-[0_0_8px_cyan]" 
                      : "bg-gradient-to-b from-white via-zinc-300 to-zinc-600 border border-white/40"
                  )} 
                />
              </div>
            </div>
            
            {/* --- Rear Counterweight Cylinder --- */}
            <div 
              className={clsx(
                "absolute rounded-[0.4cqmin] shadow-2xl z-10 border",
                isTron 
                  ? "bg-gradient-to-r from-cyan-950 via-[#040e20] to-cyan-950 border-cyan-500/40" 
                  : "bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-white/30"
              )} 
              style={{ 
                top: '-8.5cqmin', 
                left: '15%', 
                width: '70%', 
                height: '11cqmin',
                transform: 'translateZ(3cqmin)',
              }}
            >
              {/* Calibration Measurement Rings */}
              <div className="absolute top-[22%] inset-x-0 h-[0.3cqmin] bg-black/70 shadow-xs" />
              <div className="absolute top-[48%] inset-x-0 h-[0.5cqmin] bg-black/80 shadow-xs" />
              <div className="absolute top-[75%] inset-x-0 h-[0.3cqmin] bg-black/70 shadow-xs" />
            </div>

            {/* --- 3D Main Brushed Metal Arm Tube --- */}
            <div 
              className={clsx(
                "absolute rounded-full shadow-[0_6px_15px_rgba(0,0,0,0.8)] z-10 border-x",
                isTron 
                  ? "bg-gradient-to-r from-cyan-950 via-cyan-800 to-cyan-950 border-cyan-400/50" 
                  : "bg-gradient-to-r from-zinc-400 via-white to-zinc-400 border-white/60"
              )} 
              style={{ 
                top: '8cqmin', 
                left: '42%', 
                width: '16%', 
                height: 'calc(100% - 10cqmin)',
                transform: 'translateZ(3.2cqmin)',
              }}
            >
              {/* Specular Cylindrical Longitudinal Highlight */}
              <div 
                className={clsx(
                  "absolute inset-y-0 left-[25%] w-[20%]",
                  isTron ? "bg-cyan-300 opacity-80" : "bg-white opacity-95"
                )} 
              />
            </div>
            
            {/* --- 3D Headshell & Cartridge Assembly --- */}
            <div 
              className={clsx(
                "absolute shadow-2xl origin-top z-20 flex flex-col items-center border",
                isTron 
                  ? "bg-[#030916] border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                  : "bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-white/20"
              )} 
              style={{ 
                bottom: '-2cqmin', 
                left: '10%', 
                width: '180%', 
                height: '16cqmin', 
                rotate: '22deg', 
                borderRadius: '0.5cqmin',
                transform: 'translateZ(3cqmin)',
              }}
            >
              {/* Metal Coupler Collar connecting tube to headshell */}
              <div 
                className={clsx(
                  "w-[45%] h-[16%] -mt-[16%] shadow-inner border-t border-x",
                  isTron ? "bg-cyan-700 border-cyan-400" : "bg-gradient-to-r from-zinc-400 via-white to-zinc-400 border-white/40"
                )} 
                style={{ borderTopLeftRadius: '0.4cqmin', borderTopRightRadius: '0.4cqmin' }} 
              />
              
              {/* Finger Lift Cueing Hook (Classic Hi-Fi Feature) */}
              <div 
                className={clsx(
                  "absolute top-[20%] -right-[35%] w-[40%] h-[15%] border-t border-r rounded-tr-[1cqmin]",
                  isTron ? "border-cyan-400" : "border-zinc-300"
                )} 
              />

              {/* Cartridge Housing Block */}
              <div 
                className={clsx(
                  "w-[65%] h-[38%] mt-[10%] border flex items-center justify-center shadow-lg",
                  isTron ? "bg-black border-cyan-500/60" : "bg-zinc-950 border-black"
                )}
              >
                 {/* Stylus Cartridge Brand Accent / Indicator */}
                 <div 
                   className={clsx(
                     "w-[40%] h-[25%] rounded-sm shadow-md",
                     isTron 
                       ? "bg-cyan-400 shadow-[0_0_6px_cyan]" 
                       : "bg-red-600 shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                   )} 
                 />
              </div>

              {/* Stylus Cantilever & Diamond Needle Tip (Visually contacts vinyl groove) */}
              <div 
                className={clsx(
                  "absolute -bottom-[16%] left-1/2 -translate-x-1/2 w-[5%] h-[28%] shadow-md",
                  isTron ? "bg-cyan-300 shadow-[0_0_4px_cyan]" : "bg-zinc-200 shadow-sm"
                )} 
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
