import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  Globe, 
  Eye, 
  Sparkles, 
  AlertCircle, 
  Compass, 
  Orbit, 
  Disc, 
  Layers, 
  LayoutGrid, 
  Film, 
  Wand2,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { engineApi } from '../../api/engine';
import { contentApi } from '../../api/content';
import { useStore } from '../../store/useStore';
import { useSettingsStore, UniverseLayoutMode } from '../../store/useSettingsStore';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useImagePalette } from '../../hooks/useImagePalette';
import { computeUniverseLayout } from './universeLayoutEngine';
import { UniverseConnections } from './UniverseConnections';
import clsx from 'clsx';

interface UniverseGraphViewerProps {
  key?: React.Key;
  initialContentId?: string;
  onClose?: () => void;
}

// In-memory cache for universe relationship graphs so backtracking & re-opening is instantaneous
const universeCache = new Map<string, any>();

interface HistoryItem {
  id: string;
  title: string;
  type: string;
}

export function UniverseGraphViewer({ initialContentId, onClose }: UniverseGraphViewerProps) {
  const { activeViewerItem, closeViewer, openViewer } = useStore();
  const { 
    typography, 
    appearance, 
    motion: motionSetting, 
    universeLayout, 
    setSettings
  } = useSettingsStore();

  const startingId = initialContentId || activeViewerItem?.id || '';
  
  // Navigation & History State
  const [historyTrail, setHistoryTrail] = useState<HistoryItem[]>([]);
  const [currentGraph, setCurrentGraph] = useState<any>(null);
  const [centerItem, setCenterItem] = useState<any>(activeViewerItem?.data || null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Transition and Interaction Lock
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitioningTargetId, setTransitioningTargetId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  // Hover & Keyboard Selection
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedKeyboardIndex, setFocusedKeyboardIndex] = useState<number>(-1);

  // Camera & Pan Coordinates
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);

  // Zero-rerender DOM refs for mouse parallax
  const backdropParallaxRef = useRef<HTMLDivElement>(null);
  const canvasParallaxRef = useRef<HTMLDivElement>(null);
  const mouseCoordsRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const parallaxRafRef = useRef<number | null>(null);

  // Viewport geometry
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false
  });

  // Diagnostics Overlay (Shift+D)
  const [showDebug, setShowDebug] = useState(false);
  const [fps, setFps] = useState(60);

  // Layout mode switcher state
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);

  // Lock body scroll while Universe Viewer is active
  useBodyScrollLock(true);

  const currentId = historyTrail.length > 0 ? historyTrail[historyTrail.length - 1].id : startingId;

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance FPS counter for debug overlay
  useEffect(() => {
    if (!showDebug) return;
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showDebug]);

  // Extract ambient palette from center item
  const centerImageUrl = centerItem?.image_url || centerItem?.imageUrl || centerItem?.poster_url || centerItem?.posterImage || centerItem?.cover_image || centerItem?.coverImage;
  const { palette } = useImagePalette(centerImageUrl || null);
  const primaryColor = palette?.primary;

  const isTron = appearance === 'tron';
  const isReducedMotion = motionSetting === 'reduced' || motionSetting === 'static';
  const isCinematic = motionSetting === 'cinematic';

  // Smooth direct DOM parallax loop (ZERO React re-renders on mouse movement!)
  useEffect(() => {
    if (isReducedMotion) return;

    let isRunning = false;

    const updateParallax = () => {
      const coords = mouseCoordsRef.current;
      coords.currentX += (coords.x - coords.currentX) * 0.1;
      coords.currentY += (coords.y - coords.currentY) * 0.1;

      if (backdropParallaxRef.current) {
        backdropParallaxRef.current.style.transform = `translate3d(${coords.currentX * -1.2}px, ${coords.currentY * -1.2}px, 0)`;
      }

      if (canvasParallaxRef.current) {
        canvasParallaxRef.current.style.transform = `translate3d(${coords.currentX * 0.4}px, ${coords.currentY * 0.4}px, 0) scale(${camera.zoom})`;
      }

      const diff = Math.abs(coords.x - coords.currentX) + Math.abs(coords.y - coords.currentY);
      if (diff > 0.05) {
        parallaxRafRef.current = requestAnimationFrame(updateParallax);
      } else {
        isRunning = false;
        parallaxRafRef.current = null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) return;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const normX = (e.clientX - centerX) / centerX;
      const normY = (e.clientY - centerY) / centerY;

      mouseCoordsRef.current.x = normX * 14;
      mouseCoordsRef.current.y = normY * 10;

      if (!isRunning) {
        isRunning = true;
        parallaxRafRef.current = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
    };
  }, [isReducedMotion, isDragging, camera.zoom]);

  // Fetch universe graph for contentId
  const fetchUniverse = useCallback(async (contentId: string) => {
    if (!contentId) return;

    setIsLoading(true);
    setLoadError(null);

    // 1. Fast path from in-memory cache
    if (universeCache.has(contentId)) {
      const cached = universeCache.get(contentId);
      setCurrentGraph(cached);
      const center = cached.nodes.find((n: any) => n.id === contentId) || cached.nodes[0];
      if (center) {
        setCenterItem(center);
        setHistoryTrail(prev => {
          if (prev.length === 0 || prev[prev.length - 1].id !== center.id) {
            return [...prev, { id: center.id, title: center.title || center.name || 'Untitled', type: center.type || 'post' }];
          }
          return prev;
        });
      }
      setIsLoading(false);
      return;
    }

    try {
      const graph = await engineApi.getUniverse(contentId);
      universeCache.set(contentId, graph);
      setCurrentGraph(graph);
      const center = graph.nodes?.find((n: any) => n.id === contentId) || graph.nodes?.[0];
      if (center) {
        setCenterItem(center);
        setHistoryTrail(prev => {
          if (prev.length === 0 || prev[prev.length - 1].id !== center.id) {
            return [...prev, { id: center.id, title: center.title || center.name || 'Untitled', type: center.type || 'post' }];
          }
          return prev;
        });
      }
    } catch (err: any) {
      console.warn('[UniverseGraphViewer] Relationship query failed, falling back to single item fetch:', err);
      try {
        let fallbackCenter = centerItem;
        if (!fallbackCenter || fallbackCenter.id !== contentId) {
          fallbackCenter = await contentApi.getById(contentId);
          setCenterItem(fallbackCenter);
        }
        if (fallbackCenter) {
          const fallbackGraph = {
            nodes: [fallbackCenter],
            edges: []
          };
          setCurrentGraph(fallbackGraph);
          setHistoryTrail(prev => {
            if (prev.length === 0 || prev[prev.length - 1].id !== fallbackCenter.id) {
              return [...prev, { id: fallbackCenter.id, title: fallbackCenter.title || fallbackCenter.name || 'Untitled', type: fallbackCenter.type || 'post' }];
            }
            return prev;
          });
        } else {
          setLoadError('Content not found in universe catalog');
        }
      } catch (fallbackErr) {
        setLoadError('No additional connections available for this item');
      }
    } finally {
      setIsLoading(false);
    }
  }, [centerItem]);

  // Initial load
  useEffect(() => {
    if (startingId && historyTrail.length === 0) {
      fetchUniverse(startingId);
    }
  }, [startingId, fetchUniverse, historyTrail.length]);

  // Sync URL when currentId changes without page reload
  useEffect(() => {
    if (typeof window !== 'undefined' && currentId) {
      const url = new URL(window.location.href);
      if (url.searchParams.get('universe') !== currentId) {
        url.searchParams.delete('viewer');
        url.searchParams.delete('collection');
        url.searchParams.set('universe', currentId);
        window.history.replaceState({ viewerOpen: true, mode: 'universe', id: currentId }, '', url.toString());
      }
    }
  }, [currentId]);

  // Transition to a newly selected node
  const handleSelectNode = useCallback(async (targetNode: any) => {
    if (isTransitioning || !targetNode || targetNode.id === currentId) return;

    setIsTransitioning(true);
    setTransitioningTargetId(targetNode.id);
    setFocusedKeyboardIndex(-1);

    setStepIndex(prev => prev + 1);

    const newTrailItem: HistoryItem = {
      id: targetNode.id,
      title: targetNode.title || targetNode.name || 'Untitled',
      type: targetNode.type || 'post'
    };
    setHistoryTrail(prev => [...prev, newTrailItem]);

    const animDuration = isReducedMotion ? 50 : (isCinematic ? 500 : 400);

    setCenterItem(targetNode);
    await fetchUniverse(targetNode.id);

    setTimeout(() => {
      setIsTransitioning(false);
      setTransitioningTargetId(null);
    }, animDuration);
  }, [isTransitioning, currentId, isReducedMotion, isCinematic, fetchUniverse]);

  // Step back within universe navigation history
  const handleHistoryBack = useCallback(() => {
    if (isTransitioning || historyTrail.length <= 1) return;

    setIsTransitioning(true);
    setStepIndex(prev => Math.max(0, prev - 1));

    const newTrail = historyTrail.slice(0, -1);
    const targetItem = newTrail[newTrail.length - 1];
    setHistoryTrail(newTrail);

    fetchUniverse(targetItem.id);

    const animDuration = isReducedMotion ? 50 : 350;
    setTimeout(() => {
      setIsTransitioning(false);
    }, animDuration);
  }, [isTransitioning, historyTrail, isReducedMotion, fetchUniverse]);

  // Jump to specific ancestor in breadcrumb trail
  const handleJumpToHistory = useCallback((index: number) => {
    if (isTransitioning || index >= historyTrail.length - 1 || index < 0) return;

    setIsTransitioning(true);
    const newTrail = historyTrail.slice(0, index + 1);
    const targetItem = newTrail[newTrail.length - 1];
    setHistoryTrail(newTrail);
    setStepIndex(index);

    fetchUniverse(targetItem.id);

    const animDuration = isReducedMotion ? 50 : 350;
    setTimeout(() => {
      setIsTransitioning(false);
    }, animDuration);
  }, [isTransitioning, historyTrail, isReducedMotion, fetchUniverse]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      closeViewer();
    }
  }, [onClose, closeViewer]);

  const handleInspectCenterNode = useCallback(() => {
    if (!centerItem) return;
    openViewer({
      id: centerItem.id,
      type: (centerItem.type as any) || 'place',
      data: centerItem,
      mode: 'detail'
    });
  }, [centerItem, openViewer]);

  // Compute Layout Positions via the Layout Engine
  const nodes = currentGraph?.nodes || (centerItem ? [centerItem] : []);
  const edges = currentGraph?.edges || [];

  const { centerNodeLayout, orbitNodesLayout, activeLayoutMode } = useMemo(() => {
    return computeUniverseLayout({
      layoutMode: universeLayout,
      centerId: currentId,
      nodes,
      edges,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      isMobile: viewport.isMobile,
      stepIndex
    });
  }, [universeLayout, currentId, nodes, edges, viewport, stepIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setShowDebug(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (isLayoutMenuOpen) {
          setIsLayoutMenuOpen(false);
        } else if (historyTrail.length > 1) {
          handleHistoryBack();
        } else {
          handleClose();
        }
        return;
      }

      if (e.key === 'Backspace' && historyTrail.length > 1 && !e.target?.toString().includes('Input')) {
        e.preventDefault();
        handleHistoryBack();
        return;
      }

      if (orbitNodesLayout.length === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedKeyboardIndex(prev => (prev + 1) % orbitNodesLayout.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedKeyboardIndex(prev => (prev - 1 + orbitNodesLayout.length) % orbitNodesLayout.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (focusedKeyboardIndex >= 0 && focusedKeyboardIndex < orbitNodesLayout.length) {
          e.preventDefault();
          handleSelectNode(orbitNodesLayout[focusedKeyboardIndex].data);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyTrail.length, isLayoutMenuOpen, orbitNodesLayout, focusedKeyboardIndex, handleHistoryBack, handleClose, handleSelectNode]);

  // Center node details
  const centerTitle = centerItem?.title || centerItem?.name || 'Untitled';
  const centerCreator = centerItem?.creator || centerItem?.author || centerItem?.director || centerItem?.location || '';
  const centerImage = centerImageUrl;
  const centerType = centerItem?.type || 'post';

  const getLayoutIcon = (mode: UniverseLayoutMode) => {
    switch (mode) {
      case 'orbit': return <Orbit className="w-3.5 h-3.5" />;
      case 'flow': return <Disc className="w-3.5 h-3.5" />;
      case 'stack': return <Layers className="w-3.5 h-3.5" />;
      case 'gallery': return <LayoutGrid className="w-3.5 h-3.5" />;
      case 'constellation': return <Sparkles className="w-3.5 h-3.5" />;
      case 'cinematic': return <Film className="w-3.5 h-3.5" />;
      case 'auto': return <Wand2 className="w-3.5 h-3.5" />;
      default: return <Orbit className="w-3.5 h-3.5" />;
    }
  };

  const activeHighlightedNodeId = hoveredNodeId || (focusedKeyboardIndex >= 0 ? orbitNodesLayout[focusedKeyboardIndex]?.id : null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isReducedMotion ? 0.05 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "fixed inset-0 z-[1000] flex flex-col justify-between overflow-hidden select-none bg-black text-text-primary",
        `typography-${typography}`
      )}
      style={{
        backgroundColor: isTron ? '#000000' : 'var(--color-background, #070709)',
        perspective: '1200px'
      }}
    >
      {/* 1. Atmospheric Ambient Backdrop (direct ref transforms, zero re-renders) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          ref={backdropParallaxRef}
          className="absolute inset-0 opacity-25 transition-colors duration-700 ease-out"
          style={{
            background: primaryColor 
              ? `radial-gradient(circle 800px at 50% 50%, ${primaryColor}35, transparent 75%)` 
              : isTron 
                ? 'radial-gradient(circle 800px at 50% 50%, rgba(0, 240, 255, 0.14), transparent 75%)'
                : 'radial-gradient(circle 800px at 50% 50%, rgba(255, 255, 255, 0.06), transparent 75%)'
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

        {isTron && (
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(0, 240, 255, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.12) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
        )}
      </div>

      {/* 2. Top Header Navigation Bar & Breadcrumbs */}
      <header className="relative z-50 w-full px-4 md:px-8 py-3.5 flex items-center justify-between pointer-events-auto border-b border-border-subtle/30 bg-bg-base/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <Globe className={clsx("w-4 h-4", isTron ? "text-[#00f0ff] animate-pulse" : "text-accent-primary opacity-90")} />
            <span className="text-[11px] tracking-[0.25em] uppercase font-mono font-medium text-text-secondary hidden sm:inline">
              iMuse / Universe
            </span>
          </div>

          <div className="h-4 w-px bg-border-subtle/60 shrink-0" />

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            {historyTrail.map((item, idx) => {
              const isCurrent = idx === historyTrail.length - 1;
              return (
                <React.Fragment key={`crumb-${item.id}-${idx}`}>
                  {idx > 0 && (
                    <ChevronRight className="w-3 h-3 text-text-muted/60 shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleJumpToHistory(idx)}
                    disabled={isCurrent || isTransitioning}
                    className={clsx(
                      "truncate max-w-[120px] md:max-w-[180px] font-serif transition-colors px-2 py-0.5 rounded cursor-pointer",
                      isCurrent 
                        ? (isTron ? "text-[#00f0ff] font-medium" : "text-text-primary font-medium")
                        : "text-text-muted hover:text-text-primary hover:bg-bg-elevated/60"
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {historyTrail.length > 1 && (
            <button
              type="button"
              onClick={handleHistoryBack}
              disabled={isTransitioning}
              aria-label="Previous Universe Node"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider bg-bg-elevated hover:bg-bg-secondary text-text-primary border border-border-subtle transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Back</span>
            </button>
          )}

          {/* Layout Mode Quick Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLayoutMenuOpen(prev => !prev)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer",
                isTron
                  ? "border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20"
                  : "border-border-subtle bg-bg-elevated/70 text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
              title="Change Universe Navigation Layout"
            >
              {getLayoutIcon(universeLayout)}
              <span className="hidden sm:inline text-[10px] capitalize font-medium">{universeLayout}</span>
            </button>

            {/* Layout Dropdown Menu */}
            <AnimatePresence>
              {isLayoutMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 py-1.5 rounded-xl bg-bg-elevated/95 border border-border-subtle backdrop-blur-xl shadow-2xl z-50"
                >
                  <div className="px-3 py-1 text-[9px] uppercase tracking-widest text-text-muted font-mono border-b border-border-subtle/50 mb-1">
                    Universe Style
                  </div>
                  {([
                    { id: 'orbit', label: 'Orbit', icon: <Orbit className="w-3.5 h-3.5" /> },
                    { id: 'flow', label: 'Flow', icon: <Disc className="w-3.5 h-3.5" /> },
                    { id: 'stack', label: 'Stack', icon: <Layers className="w-3.5 h-3.5" /> },
                    { id: 'gallery', label: 'Gallery', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                    { id: 'constellation', label: 'Constellation', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { id: 'cinematic', label: 'Cinematic', icon: <Film className="w-3.5 h-3.5" /> },
                    { id: 'auto', label: 'Auto (Smart)', icon: <Wand2 className="w-3.5 h-3.5" /> },
                  ] as const).map(item => (
                    <button
                      key={`layout-opt-${item.id}`}
                      type="button"
                      onClick={() => {
                        setSettings({ universeLayout: item.id });
                        setIsLayoutMenuOpen(false);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer",
                        universeLayout === item.id 
                          ? (isTron ? "text-[#00f0ff] bg-[#00f0ff]/10 font-medium" : "text-text-primary bg-bg-secondary font-medium")
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Universe View"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-text-primary/80 hover:text-text-primary bg-bg-elevated/70 hover:bg-bg-elevated border border-border-subtle/80 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Spatial Canvas Viewport */}
      <main 
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {isLoading && !centerNodeLayout && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3">
            <Compass className={clsx("w-8 h-8 animate-spin", isTron ? "text-[#00f0ff]" : "text-accent-primary opacity-80")} />
            <span className="text-[10px] tracking-[0.3em] uppercase text-text-muted animate-pulse font-mono">
              Mapping Coordinates...
            </span>
          </div>
        )}

        {loadError && !centerNodeLayout && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 p-6 text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-accent-primary opacity-70" />
            <p className="text-sm text-text-secondary font-light">{loadError}</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 rounded-full bg-text-primary text-bg-base text-xs uppercase tracking-widest font-medium cursor-pointer"
            >
              Return
            </button>
          </div>
        )}

        {centerNodeLayout && (
          <div
            ref={canvasParallaxRef}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
            data-cursor="grab"
          >
            {/* SVG Relationship Connection Lines Layer */}
            <UniverseConnections
              centerNode={centerNodeLayout}
              orbitNodes={orbitNodesLayout}
              isTron={isTron}
              isReducedMotion={isReducedMotion}
              activeHoverId={activeHighlightedNodeId}
              primaryColor={primaryColor}
            />

            {/* Orbiting Related Secondary Nodes */}
            {orbitNodesLayout.map((node) => {
              const nodeImage = node.data.image_url || node.data.imageUrl || node.data.poster_url || node.data.posterImage || node.data.cover_image || node.data.coverImage;
              const isHovered = activeHighlightedNodeId === node.id;
              const isSelectedTarget = transitioningTargetId === node.id;

              return (
                <div
                  key={`orbit-node-${node.id}`}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="absolute flex flex-col items-center pointer-events-auto transition-transform duration-300 ease-out"
                  style={{
                    width: viewport.isMobile ? 120 : 150,
                    transform: `translate3d(${isSelectedTarget ? 0 : node.x}px, ${isSelectedTarget ? 0 : node.y}px, 0) scale(${isSelectedTarget ? 1.0 : (isHovered ? node.scale * 1.08 : node.scale)}) rotate(${node.rotation}deg)`,
                    opacity: node.opacity,
                    zIndex: isHovered ? 45 : node.zIndex
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectNode(node.data);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Focus ${node.data.title || 'item'}`}
                    className={clsx(
                      "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-xl",
                      viewport.isMobile ? "w-20 h-28" : "w-28 h-38 md:w-32 md:h-42",
                      isTron
                        ? clsx(
                            "border",
                            isHovered
                              ? "border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.45)] scale-105"
                              : "border-[#00f0ff]/40 bg-black/80"
                          )
                        : clsx(
                            "border bg-bg-elevated",
                            isHovered
                              ? "border-text-primary shadow-2xl scale-105"
                              : "border-border-subtle/80 hover:border-text-primary/70"
                          )
                    )}
                  >
                    {nodeImage ? (
                      <img
                        src={nodeImage}
                        alt={node.data.title || ''}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-bg-secondary flex flex-col items-center justify-center p-2 text-center">
                        <span className="text-[9px] uppercase tracking-widest text-text-muted font-mono">{node.data.type}</span>
                        <span className="text-xs font-serif italic text-text-secondary mt-1 line-clamp-2">{node.data.title}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 p-2 text-center backdrop-blur-[2px]">
                      <Compass className={clsx("w-4 h-4 animate-spin", isTron ? "text-[#00f0ff]" : "text-white")} />
                      <span className="text-[9px] uppercase tracking-[0.2em] text-white font-mono font-medium">
                        Center
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-center flex flex-col items-center max-w-[130px] pointer-events-none">
                    <span 
                      className={clsx(
                        "text-[8.5px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border mb-1 line-clamp-1 transition-all",
                        isTron
                          ? "text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/10"
                          : node.strength === 'primary'
                            ? "text-accent-primary border-accent-primary/30 bg-accent-primary/10 font-medium"
                            : "text-text-muted border-border-subtle bg-bg-elevated/70"
                      )}
                    >
                      {node.label}
                    </span>
                    <h4 className="font-serif text-xs leading-snug line-clamp-2 text-text-primary/90 font-light">
                      {node.data.title || 'Untitled'}
                    </h4>
                  </div>
                </div>
              );
            })}

            {/* 4. Focal Center Node (Current Universe Anchor) */}
            <motion.div
              key={`center-node-${currentId}`}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1.0, opacity: 1.0 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: isReducedMotion ? 0.05 : 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-30 flex flex-col items-center pointer-events-auto"
            >
              <div
                onClick={handleInspectCenterNode}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${centerTitle}`}
                className={clsx(
                  "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-2xl",
                  viewport.isMobile ? "w-44 h-60" : "w-56 h-76 md:w-64 md:h-84",
                  isTron
                    ? "border-2 border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.4)]"
                    : "border border-border-subtle hover:border-text-primary shadow-[0_16px_50px_rgba(0,0,0,0.6)] bg-bg-elevated"
                )}
              >
                {centerImage ? (
                  <img
                    src={centerImage}
                    alt={centerTitle}
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-bg-secondary flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-xs uppercase tracking-widest text-text-muted font-mono">{centerType}</span>
                    <span className="font-serif text-lg text-text-primary mt-2">{centerTitle}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-xs uppercase tracking-widest text-white font-medium font-mono">
                    View Details
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center max-w-xs md:max-w-sm pointer-events-none px-2">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={clsx(
                    "text-[10px] uppercase tracking-[0.25em] font-mono",
                    isTron ? "text-[#00f0ff]" : "text-text-secondary"
                  )}>
                    Focal Center
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-50">
                    · {centerType}
                  </span>
                </div>
                <h2 className="font-serif text-xl md:text-2xl font-light text-text-primary leading-snug tracking-tight">
                  {centerTitle}
                </h2>
                {centerCreator && (
                  <p className="text-xs font-serif italic text-text-secondary mt-1">
                    {centerCreator}
                  </p>
                )}
              </div>
            </motion.div>

            {orbitNodesLayout.length === 0 && !isLoading && (
              <div className="absolute bottom-16 z-20 flex items-center gap-2 px-5 py-2.5 rounded-full bg-bg-elevated/90 backdrop-blur-md border border-border-subtle text-xs text-text-secondary shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                <span className="font-serif italic">This thread ends here · Backtrack or explore new focal nodes</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. Development Diagnostics Overlay (Shift+D) */}
      {showDebug && (
        <div className="absolute bottom-14 left-4 z-50 p-4 rounded-xl bg-black/90 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-[11px] backdrop-blur-xl shadow-2xl pointer-events-auto space-y-1">
          <div className="flex items-center gap-2 border-b border-[#00f0ff]/30 pb-1 mb-2 font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Universe Spatial Diagnostics</span>
          </div>
          <div>Active Node ID: <span className="text-white">{currentId}</span></div>
          <div>Active Layout: <span className="text-white uppercase">{activeLayoutMode}</span></div>
          <div>Nodes Visible: <span className="text-white">{orbitNodesLayout.length + 1}</span></div>
          <div>Edges Count: <span className="text-white">{edges.length}</span></div>
          <div>FPS: <span className={fps > 45 ? "text-green-400" : "text-yellow-400"}>{fps}</span></div>
          <div>Step Index: <span className="text-white">{stepIndex}</span></div>
          <div>History Depth: <span className="text-white">{historyTrail.length}</span></div>
        </div>
      )}

      {/* 6. Footer Navigation Instructions Bar */}
      <footer className="relative z-50 w-full px-4 md:px-8 py-3 flex items-center justify-between text-[11px] font-mono text-text-secondary/70 border-t border-border-subtle/30 bg-bg-base/80 backdrop-blur-xl pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">
            Hover & select any node to travel deeper
          </span>
          <span className="md:hidden">
            Tap node to travel deeper
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline opacity-60">
            [↑↓←→] Navigate · [Enter] Focus · [Esc] Exit
          </span>
          <button
            type="button"
            onClick={() => setShowDebug(prev => !prev)}
            className="pointer-events-auto text-[10px] px-2 py-0.5 rounded border border-border-subtle hover:border-text-primary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            {showDebug ? 'Hide Dev Info' : 'Shift+D Dev'}
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
