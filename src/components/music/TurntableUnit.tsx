import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';

// Unified Geometry Constants (Shared between Seeking Physics and Visual Rendering)
const REST_ANGLE = 4;        // Rest clip position outside the vinyl
const START_ANGLE = 11.5;    // Outer lead-in groove (0% progress)
const END_ANGLE = 31.5;      // Inner lead-out groove (100% progress)

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function TurntableUnit() {
  const { audioElement, duration, currentSong, isPlaying } = useMusicStore(useShallow(s => ({
    audioElement: s.audioElement,
    duration: s.duration,
    currentSong: s.currentSong,
    isPlaying: s.isPlaying
  })));
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);
  const armShadowRef = useRef<HTMLDivElement>(null);
  const needleShadowRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Cached geometry to eliminate layout thrashing
  const pivotGeoRef = useRef({ x: 0, y: 0 });
  const containerGeoRef = useRef({ left: 0, top: 0, width: 1, height: 1 });

  // Physics & Animation state
  const targetAngleRef = useRef(REST_ANGLE);
  const visualAngleRef = useRef(REST_ANGLE);
  const vinylRotationRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef(false);

  const pendingSeekTimeRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  // Parallax tilt state
  const parallaxRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });

  // Update cached container geometry via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerGeo = () => {
      const rect = container.getBoundingClientRect();
      containerGeoRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width || 1,
        height: rect.height || 1
      };
    };

    updateContainerGeo();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateContainerGeo);
      ro.observe(container);
    }

    window.addEventListener('resize', updateContainerGeo, { passive: true });
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateContainerGeo);
    };
  }, []);

  // Subtle 3D parallax on mouse move (cached coordinates, zero layout reads on move)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const geo = containerGeoRef.current;
      const normX = ((e.clientX - geo.left) / geo.width - 0.5) * 2;
      const normY = ((e.clientY - geo.top) / geo.height - 0.5) * 2;
      parallaxRef.current.targetX = Math.max(-1, Math.min(1, normX)) * 2.2;
      parallaxRef.current.targetY = Math.max(-1, Math.min(1, normY)) * -2.2;
      wakeLoop();
    };

    const handleMouseLeave = () => {
      parallaxRef.current.targetX = 0;
      parallaxRef.current.targetY = 0;
      wakeLoop();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Main Unified Animation & Physics Loop
  const animate = useCallback((timestamp: number) => {
    const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 0;
    lastFrameTimeRef.current = timestamp;

    const isAudioPlaying = audioElement ? (!audioElement.paused && !audioElement.ended) : false;

    // 1. Flush pending seek to audio element
    if (pendingSeekTimeRef.current !== null && audioElement) {
      if (!isDraggingRef.current || (timestamp - lastSeekTimeRef.current > 66)) {
        audioElement.currentTime = pendingSeekTimeRef.current;
        lastSeekTimeRef.current = timestamp;
        pendingSeekTimeRef.current = null;
      }
    }

    // 2. Smooth 3D Stage Parallax Tilt
    const p = parallaxRef.current;
    p.currentX += (p.targetX - p.currentX) * 0.08;
    p.currentY += (p.targetY - p.currentY) * 0.08;
    if (stageRef.current) {
      const baseRotX = 12 + p.currentY;
      const baseRotY = -3 + p.currentX;
      stageRef.current.style.transform = `rotateX(${baseRotX}deg) rotateY(${baseRotY}deg)`;
    }

    // 3. Vinyl Continuous Rotation
    if (vinylRef.current && isAudioPlaying) {
      vinylRotationRef.current = (vinylRotationRef.current + (90 * (deltaTime / 1000))) % 360;
      vinylRef.current.style.transform = `translateZ(1.8cqmin) rotate(${vinylRotationRef.current}deg)`;
    }

    // 4. Tonearm Tracking & Physical Contact Interpolation
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

      const damping = 1 - Math.pow(1 - 0.12, Math.max(1, Math.min(deltaTime, 32)) / 16.66);
      const diff = targetAngleRef.current - visualAngleRef.current;
      visualAngleRef.current += diff * damping;
      
      if (isFinite(visualAngleRef.current)) {
        const angle = visualAngleRef.current;
        armRef.current.style.transform = `rotate(${angle}deg)`;
        if (armShadowRef.current) {
          armShadowRef.current.style.transform = `rotate(${angle}deg)`;
        }
        if (needleShadowRef.current) {
          needleShadowRef.current.style.transform = `rotate(${angle}deg)`;
        }
      }
    }

    // Check if loop can sleep
    const parallaxSettled = Math.abs(p.targetX - p.currentX) < 0.01 && Math.abs(p.targetY - p.currentY) < 0.01;
    const tonearmSettled = Math.abs(targetAngleRef.current - visualAngleRef.current) < 0.02;

    if (!isAudioPlaying && !isDraggingRef.current && parallaxSettled && tonearmSettled) {
      isLoopRunningRef.current = false;
      rafIdRef.current = null;
      return;
    }

    rafIdRef.current = requestAnimationFrame(animate);
  }, [audioElement, duration, currentSong]);

  const wakeLoop = useCallback(() => {
    if (!isLoopRunningRef.current) {
      isLoopRunningRef.current = true;
      lastFrameTimeRef.current = performance.now();
      rafIdRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  useEffect(() => {
    wakeLoop();
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isLoopRunningRef.current = false;
    };
  }, [wakeLoop, audioElement, duration, currentSong, isPlaying]);

  // Handle Dragging with cached pivot coordinates
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !armRef.current || !duration || !isFinite(duration)) return;
    
    const { x: pivotX, y: pivotY } = pivotGeoRef.current;
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
    
    // Strict Safety Boundary: Clamped to playable groove band (never crosses spindle/label)
    const clampedAngle = Math.max(REST_ANGLE, Math.min(END_ANGLE, angle));
    
    targetAngleRef.current = clampedAngle;
    visualAngleRef.current = clampedAngle;
    armRef.current.style.transform = `rotate(${clampedAngle}deg)`;
    if (armShadowRef.current) {
      armShadowRef.current.style.transform = `rotate(${clampedAngle}deg)`;
    }
    if (needleShadowRef.current) {
      needleShadowRef.current.style.transform = `rotate(${clampedAngle}deg)`;
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

    wakeLoop();
  }, [duration, wakeLoop]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (armRef.current) {
      try {
        armRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }
    
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);

    wakeLoop();
  }, [handlePointerMove, wakeLoop]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration || !isFinite(duration) || !armRef.current) return;
    
    e.preventDefault(); 
    
    // Cache pivot point ONCE at pointerdown to eliminate layout reads on move
    const rect = armRef.current.getBoundingClientRect();
    const pivotWidth = rect.width;
    pivotGeoRef.current = {
      x: rect.left + (pivotWidth / 2),
      y: rect.top + (pivotWidth / 2)
    };

    isDraggingRef.current = true;
    setIsDragging(true);
    
    try {
      armRef.current.setPointerCapture(e.pointerId);
    } catch {}
    
    if (tooltipRef.current) {
      tooltipRef.current.textContent = `${formatTime(audioElement?.currentTime || 0)} / ${formatTime(duration)}`;
    }
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    wakeLoop();
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
          perspective: '1400px',
        }}
      >
        
        {/* 3D Turntable Coherent Stage (Shared Single Perspective Stage) */}
        <div
          ref={stageRef}
          className="relative w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(12deg) rotateY(-3deg)',
          }}
        >

          {/* 1. 3D CHASSIS / SOLID PLINTH */}
          <div 
            className={clsx(
              "absolute rounded-[5cqmin] transition-all duration-500",
              isTron 
                ? "bg-[#040810] border border-cyan-500/30 shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.18)]"
                : "bg-gradient-to-b from-[#1c1c20] via-[#141417] to-[#0c0c0e] border border-white/10 shadow-[0_35px_80px_rgba(0,0,0,0.9),0_10px_30px_rgba(0,0,0,0.7)]"
            )}
            style={{
              width: '98cqmin',
              height: '98cqmin',
              transform: 'translateZ(-4cqmin)',
            }}
          >
            {/* Top Chamfer Edge Highlight */}
            <div className="absolute inset-0 rounded-[5cqmin] border-t border-l border-white/20 pointer-events-none" />
            <div className="absolute inset-0 rounded-[5cqmin] border-b border-r border-black/90 pointer-events-none" />

            {/* Brushed Plinth Surface Sheen */}
            <div 
              className="absolute inset-0 rounded-[5cqmin] opacity-35 pointer-events-none mix-blend-overlay"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 45%, rgba(0,0,0,0.6) 100%)',
              }}
            />

            {/* Power / Strobe Pillar */}
            <div 
              className={clsx(
                "absolute top-[6cqmin] left-[6cqmin] w-[4.5cqmin] h-[7.5cqmin] rounded-t-[1.2cqmin] border shadow-md flex items-center justify-center pointer-events-none",
                isTron 
                  ? "bg-[#010814] border-cyan-500/50 shadow-[0_0_15px_cyan]" 
                  : "bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-950 border-white/20"
              )}
            >
              <div 
                className={clsx(
                  "w-[1.6cqmin] h-[3.2cqmin] rounded-full",
                  isTron 
                    ? "bg-cyan-400 shadow-[0_0_10px_cyan] animate-pulse" 
                    : (isPlaying ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "bg-amber-700/60")
                )} 
              />
            </div>

            {/* Speed Selector (33 RPM Dial) */}
            <div 
              className={clsx(
                "absolute bottom-[5.5cqmin] right-[6cqmin] w-[6.5cqmin] h-[6.5cqmin] rounded-full border flex items-center justify-center shadow-lg pointer-events-none",
                isTron 
                  ? "bg-[#02060d] border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "bg-gradient-to-b from-zinc-700 to-zinc-950 border-white/20 text-zinc-300"
              )}
            >
              <span className="text-[1.5cqmin] font-mono font-bold tracking-tighter">33</span>
            </div>

            {/* INTEGRATED DISC-SIDE TRACK IDENTITY (Now Playing Badge) */}
            {currentSong && (
              <div className="absolute bottom-[4.8cqmin] left-[6cqmin] max-w-[58%] pointer-events-none flex flex-col z-20">
                <div className="flex items-center gap-1.5">
                  <span className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    isPlaying ? (isTron ? "bg-cyan-400 shadow-[0_0_6px_cyan] animate-pulse" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse") : "bg-zinc-500"
                  )} />
                  <span className={clsx(
                    "text-[1.1cqmin] uppercase tracking-[0.22em] font-mono font-semibold",
                    isTron ? "text-cyan-400/80" : "text-zinc-400"
                  )}>
                    {isPlaying ? 'Now Spinning' : 'Paused'}
                  </span>
                </div>
                <div className={clsx(
                  "text-[2.3cqmin] font-serif font-medium tracking-tight truncate leading-tight mt-0.5",
                  isTron ? "text-cyan-50 drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]" : "text-white drop-shadow-md"
                )}>
                  {currentSong.title}
                </div>
                <div className={clsx(
                  "text-[1.3cqmin] font-light truncate mt-0.5 opacity-70",
                  isTron ? "text-cyan-200" : "text-zinc-300"
                )}>
                  {currentSong.artist} {currentSong.album ? `• ${currentSong.album}` : ''}
                </div>
              </div>
            )}

            {/* Recessed Platter Well */}
            <div 
              className="absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/95 shadow-[inset_0_6px_25px_rgba(0,0,0,0.98)] pointer-events-none"
              style={{
                width: '84cqmin',
                height: '84cqmin',
                background: isTron ? '#010307' : '#050507',
              }}
            />
          </div>

          {/* 2. 3D DIE-CAST ALUMINUM PLATTER WITH STROBE BEVEL */}
          <div 
            className={clsx(
              "absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1cqmin] transition-colors shadow-[0_20px_45px_rgba(0,0,0,0.95)] pointer-events-none",
              isTron 
                ? "bg-[#050b14] border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)]" 
                : "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border-zinc-600/50"
            )}
            style={{
              width: '81cqmin',
              height: '81cqmin',
              transform: 'translateZ(-1.5cqmin)',
            }}
          >
            {/* Platter Strobe Rim Dots */}
            <div 
              className="absolute inset-0 rounded-full opacity-45 pointer-events-none"
              style={{
                background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.35) 0deg 1.2deg, transparent 1.2deg 4.8deg)',
              }}
            />
          </div>

          {/* Platter Rubber Slipmat */}
          <div 
            className={clsx(
              "absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-[inset_0_3px_12px_rgba(0,0,0,0.9)] pointer-events-none",
              isTron ? "bg-[#02050a] border-cyan-500/20" : "bg-[#111113] border-white/10"
            )}
            style={{
              width: '78cqmin',
              height: '78cqmin',
              transform: 'translateZ(0cqmin)',
            }}
          >
            <div className="absolute inset-[3.5cqmin] rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-[8.5cqmin] rounded-full border border-white/5 pointer-events-none" />
          </div>

          {/* 3. PHYSICAL 3D VINYL LP (Thickness Rim & Bottom Edge Depth) */}
          <div 
            className={clsx(
              "absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.98)] border pointer-events-none",
              isTron ? "bg-[#010408] border-cyan-500/35" : "bg-[#08080a] border-white/15"
            )}
            style={{
              width: '76.4cqmin',
              height: '76.4cqmin',
              transform: 'translateZ(1.0cqmin)',
            }}
          />

          {/* Top Vinyl Disc Face (Rotates during playback at translateZ(1.8cqmin)) */}
          <div 
            ref={vinylRef}
            className={clsx(
              "absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full border relative overflow-hidden flex items-center justify-center z-10 pointer-events-none",
              isTron 
                ? "border-cyan-500/40 bg-[#03060c] shadow-[0_0_25px_rgba(6,182,212,0.25)]" 
                : "border-[#202024] bg-[#0c0c0e] shadow-[0_6px_20px_rgba(0,0,0,0.9)]"
            )}
            style={{ 
              width: '76cqmin', 
              height: '76cqmin',
              transform: 'translateZ(1.8cqmin)',
              willChange: 'transform',
            }}
          >
            {/* Outer Rim Highlight */}
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
            <div className="absolute inset-[1cqmin] rounded-full border border-black/90 pointer-events-none" />

            {/* Fine Micro-Grooves Layer */}
            <div 
              className="absolute inset-[1.6cqmin] rounded-full opacity-70 mix-blend-overlay pointer-events-none" 
              style={{
                background: 'repeating-radial-gradient(circle at 50% 50%, transparent, transparent 1.8px, rgba(255,255,255,0.08) 2.4px, rgba(0,0,0,0.4) 3.2px, transparent 4px)',
              }} 
            />

            {/* Song Tracks / Groove Band Separations */}
            <div 
              className="absolute inset-0 rounded-full opacity-65 pointer-events-none" 
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 18%, rgba(0,0,0,0.9) 25%, transparent 27%, rgba(0,0,0,0.9) 44%, transparent 46%, rgba(0,0,0,0.9) 66%, transparent 68%, rgba(0,0,0,0.85) 86%, transparent 90%)',
              }} 
            />
            
            {/* Anisotropic Specular Light Sheen 1 (Rotates with record) */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen opacity-30" 
              style={{
                background: 'conic-gradient(from 35deg at 50% 50%, rgba(255,255,255,0.45) 0deg, transparent 40deg, transparent 140deg, rgba(255,255,255,0.45) 180deg, transparent 220deg, transparent 320deg, rgba(255,255,255,0.45) 360deg)',
              }} 
            />

            {/* Anisotropic Specular Light Sheen 2 (Secondary reflective fan) */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none mix-blend-overlay opacity-35" 
              style={{
                background: 'conic-gradient(from 125deg at 50% 50%, rgba(255,255,255,0.35) 0deg, transparent 55deg, transparent 125deg, rgba(255,255,255,0.35) 180deg, transparent 235deg, transparent 305deg, rgba(255,255,255,0.35) 360deg)',
              }} 
            />
            
            {/* Run-out Groove Rim */}
            <div className="absolute inset-[28%] rounded-full border border-white/10 pointer-events-none" />

            {/* Center Label Area (Rotates with the record) */}
            <div 
              className={clsx(
                "w-[33%] h-[33%] rounded-full relative z-10 flex items-center justify-center overflow-hidden border-[0.6cqmin]",
                isTron 
                  ? "border-cyan-500/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.3)] bg-[#040810]" 
                  : "border-[#141416] shadow-[inset_0_0_14px_rgba(0,0,0,0.8),0_0_10px_rgba(0,0,0,0.9)] bg-[#18181b]"
              )}
            >
              {currentSong?.artworkUrl ? (
                <img 
                  src={currentSong.artworkUrl} 
                  alt={currentSong.title} 
                  decoding="async"
                  className="w-full h-full object-cover opacity-95 pointer-events-none" 
                  draggable={false} 
                />
              ) : (
                <div className="text-xl font-serif text-text-muted">{currentSong?.title?.charAt(0)}</div>
              )}
              
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.7)] pointer-events-none" />
              <div className="absolute inset-[8%] rounded-full border border-black/40 pointer-events-none" />

              {/* Polished Center Spindle Pin */}
              <div className="absolute w-[15%] h-[15%] rounded-full bg-black shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] z-20 flex items-center justify-center">
                <div 
                  className={clsx(
                    "w-[70%] h-[70%] rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.9)] z-30 border",
                    isTron 
                      ? "bg-gradient-to-b from-cyan-100 via-cyan-400 to-cyan-800 border-cyan-300"
                      : "bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-600 border-white/50"
                  )} 
                />
              </div>
            </div>
          </div>

          {/* 4. DYNAMIC TONEARM BODY SHADOW ON PLATTER */}
          <div 
            ref={armShadowRef}
            className="absolute z-20 pointer-events-none opacity-30 blur-[0.4cqmin]"
            style={{ 
              width: '8cqmin',
              height: '58cqmin',
              top: '5.5cqmin',
              right: '4.5cqmin',
              transformOrigin: '4cqmin 4cqmin',
              transform: `rotate(${REST_ANGLE}deg)`,
              willChange: 'transform',
            }}
          >
            <div 
              className="absolute bg-black rounded-full" 
              style={{ top: '8cqmin', left: '38%', width: '24%', height: 'calc(100% - 10cqmin)' }} 
            />
            <div 
              className="absolute bg-black rounded-md" 
              style={{ bottom: '-2.5cqmin', left: '4%', width: '190%', height: '16cqmin', rotate: '22deg' }} 
            />
          </div>

          {/* 5. PRECISION NEEDLE-TO-RECORD CONTACT SHADOW */}
          {/* Positioned directly under the stylus tip on the vinyl surface (translateZ(1.8cqmin)) */}
          <div 
            ref={needleShadowRef}
            className="absolute z-25 pointer-events-none"
            style={{
              width: '8cqmin',
              height: '58cqmin',
              top: '5cqmin',
              right: '5cqmin',
              transformOrigin: '4cqmin 4cqmin',
              transform: `rotate(${REST_ANGLE}deg)`,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
          >
            <div 
              className="absolute w-[2cqmin] h-[1cqmin] bg-black/85 rounded-full blur-[0.15cqmin]"
              style={{
                bottom: '-2.8cqmin',
                left: '75%',
                transform: 'translateZ(1.85cqmin)',
              }}
            />
          </div>

          {/* 6. 3D PRECISION MECHANICAL TONEARM ASSEMBLY */}
          <div 
            ref={armRef}
            data-cursor="grab"
            onPointerDown={handlePointerDown}
            className="absolute z-30 group cursor-grab active:cursor-grabbing drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] turntable-tonearm"
            style={{ 
              width: '8cqmin', 
              height: '58cqmin', 
              top: '5cqmin', 
              right: '5cqmin', 
              transformOrigin: '4cqmin 4cqmin', 
              transform: `rotate(${REST_ANGLE}deg)`,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              touchAction: 'none',
            }}
          >
            {/* Expanded Hitbox */}
            <div className="absolute inset-y-0 -inset-x-[160%]" />
            
            {/* Tooltip */}
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

            {/* Pivot Gimbal Base Collar */}
            <div 
              className={clsx(
                "absolute top-0 left-0 w-full aspect-square rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.9)] z-20 flex items-center justify-center border",
                isTron 
                  ? "bg-[#030814] border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                  : "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border-white/20"
              )}
              style={{ transform: 'translateZ(3.4cqmin)' }}
            >
              <div 
                className={clsx(
                  "w-[80%] h-[80%] rounded-full border shadow-inner flex items-center justify-center",
                  isTron 
                    ? "bg-[#02050c] border-cyan-400/40" 
                    : "bg-gradient-to-br from-zinc-500 via-zinc-700 to-zinc-900 border-black/60"
                )}
              >
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
            
            {/* Rear Counterweight (Elevated behind pivot) */}
            <div 
              className={clsx(
                "absolute rounded-[0.4cqmin] shadow-2xl z-10 border",
                isTron 
                  ? "bg-gradient-to-r from-cyan-950 via-[#040e20] to-cyan-950 border-cyan-500/40" 
                  : "bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-white/30"
              )} 
              style={{ 
                top: '-8cqmin', 
                left: '15%', 
                width: '70%', 
                height: '10.5cqmin',
                transform: 'translateZ(3.0cqmin)',
              }}
            >
              <div className="absolute top-[22%] inset-x-0 h-[0.3cqmin] bg-black/70 shadow-xs" />
              <div className="absolute top-[48%] inset-x-0 h-[0.5cqmin] bg-black/80 shadow-xs" />
              <div className="absolute top-[75%] inset-x-0 h-[0.3cqmin] bg-black/70 shadow-xs" />
            </div>

            {/* Arm Tube (Descends in 3D space from pivot at Z=3.4 down towards vinyl at Z=2.0) */}
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
                height: 'calc(100% - 9cqmin)',
                transform: 'translateZ(2.6cqmin) rotateX(1.8deg)',
              }}
            >
              <div 
                className={clsx(
                  "absolute inset-y-0 left-[25%] w-[20%]",
                  isTron ? "bg-cyan-300 opacity-80" : "bg-white opacity-95"
                )} 
              />
            </div>
            
            {/* Headshell, Cartridge & Stylus (Physically contacting the vinyl at translateZ(1.8cqmin)) */}
            <div 
              className={clsx(
                "absolute shadow-2xl origin-top z-20 flex flex-col items-center border",
                isTron 
                  ? "bg-[#030916] border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                  : "bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-white/20"
              )} 
              style={{ 
                bottom: '-2.2cqmin', 
                left: '10%', 
                width: '180%', 
                height: '15.5cqmin', 
                rotate: '22deg', 
                borderRadius: '0.5cqmin',
                transform: 'translateZ(1.85cqmin)',
              }}
            >
              {/* Arm Connector Collar */}
              <div 
                className={clsx(
                  "w-[45%] h-[16%] -mt-[16%] shadow-inner border-t border-x",
                  isTron ? "bg-cyan-700 border-cyan-400" : "bg-gradient-to-r from-zinc-400 via-white to-zinc-400 border-white/40"
                )} 
                style={{ borderTopLeftRadius: '0.4cqmin', borderTopRightRadius: '0.4cqmin' }} 
              />
              
              {/* Headshell Finger Lift */}
              <div 
                className={clsx(
                  "absolute top-[20%] -right-[35%] w-[40%] h-[15%] border-t border-r rounded-tr-[1cqmin]",
                  isTron ? "border-cyan-400" : "border-zinc-300"
                )} 
              />

              {/* Audiophile Cartridge Body */}
              <div 
                className={clsx(
                  "w-[65%] h-[38%] mt-[10%] border flex items-center justify-center shadow-lg",
                  isTron ? "bg-black border-cyan-500/60" : "bg-zinc-950 border-black"
                )}
              >
                 <div 
                   className={clsx(
                     "w-[40%] h-[25%] rounded-sm shadow-md",
                     isTron 
                       ? "bg-cyan-400 shadow-[0_0_6px_cyan]" 
                       : "bg-red-600 shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                   )} 
                 />
              </div>

              {/* Cantilever & Diamond Stylus Tip (Touches directly onto the record surface plane) */}
              <div 
                className={clsx(
                  "absolute -bottom-[14%] left-1/2 -translate-x-1/2 w-[5%] h-[26%] shadow-md",
                  isTron ? "bg-cyan-300 shadow-[0_0_4px_cyan]" : "bg-zinc-200 shadow-xs"
                )} 
              >
                {/* Micro Stylus Diamond Dot */}
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-xs" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
