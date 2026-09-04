import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStore } from '../../store/useStore';
import { useMusicStore } from '../../store/useMusicStore';
import { Activity, X, Eye, Music, Cpu, Layers } from 'lucide-react';
import clsx from 'clsx';

export function PerformanceHUD() {
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState(60);
  const [memoryMB, setMemoryMB] = useState<number | null>(null);
  const location = useLocation();

  const { appearance, motion: motionMode, typography } = useSettingsStore();
  const { activeViewerItem } = useStore();
  const { isPlaying, currentSong } = useMusicStore();

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Toggle HUD with Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time FPS and Memory Monitor Loop
  useEffect(() => {
    if (!isOpen) return;

    let rafId: number;

    const measure = (now: number) => {
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Check Chromium performance.memory
        if ((performance as any).memory) {
          const used = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
          setMemoryMB(Math.round(used * 10) / 10);
        }
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-[999999] w-72 p-4 rounded-2xl bg-black/90 text-white font-mono text-xs border border-white/20 backdrop-blur-2xl shadow-2xl select-none animate-in fade-in slide-in-from-bottom-3 duration-200"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
    >
      <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>iMUSE Diagnostics</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Frame Rate</span>
          <span className={clsx("font-bold text-sm", fps >= 55 ? "text-emerald-400" : fps >= 30 ? "text-yellow-400" : "text-red-400")}>
            {fps} FPS
          </span>
        </div>

        {memoryMB !== null && (
          <div className="flex items-center justify-between">
            <span className="text-white/60">Heap Memory</span>
            <span className="text-cyan-400 font-medium">{memoryMB} MB</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-white/60">Route</span>
          <span className="text-white truncate max-w-[140px]">{location.pathname}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Theme / Motion</span>
          <span className="text-cyan-300 capitalize">{appearance} · {motionMode}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Active Viewer</span>
          <span className="text-purple-300 capitalize">
            {activeViewerItem ? `${activeViewerItem.type} (${activeViewerItem.mode || 'detail'})` : 'None'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Audio Playback</span>
          <span className={clsx("font-medium truncate max-w-[130px]", isPlaying ? "text-emerald-400" : "text-white/40")}>
            {currentSong ? `${isPlaying ? '▶' : '⏸'} ${currentSong.title}` : 'Stopped'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
        <span>Toggle: Shift + P</span>
        <span>Antigravity Build</span>
      </div>
    </div>
  );
}
