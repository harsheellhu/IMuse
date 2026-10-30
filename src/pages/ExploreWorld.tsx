import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { useStore, ActiveViewerItem } from '../store/useStore';
import clsx from 'clsx';
import { Post, Book, Film, Collection, TvShow, Place } from '../types';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Film as FilmIcon, 
  BookOpen, 
  MapPin, 
  Image as ImageIcon,
  Tv as TvIcon
} from 'lucide-react';

type WorldItemType = 'post' | 'book' | 'film' | 'collection' | 'tv_show' | 'place';

interface WorldItem {
  id: string;
  type: WorldItemType;
  x: number;
  y: number;
  scale: number;
  data: Post | Book | Film | Collection | TvShow | Place;
}

// Deterministic pseudo-random float generator based on string
function stringHashToFloat(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return ((hash >>> 0) % 10000) / 10000;
}

const CATEGORY_FILTERS: { type: WorldItemType | 'all'; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All Artifacts', icon: Layers },
  { type: 'post', label: 'Visuals', icon: ImageIcon },
  { type: 'film', label: 'Cinema', icon: FilmIcon },
  { type: 'book', label: 'Books', icon: BookOpen },
  { type: 'place', label: 'Spaces', icon: MapPin },
  { type: 'tv_show', label: 'Television', icon: TvIcon },
];

export function ExploreWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { posts, books, films, collections, activeViewerItem, openViewer } = useStore();
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<WorldItemType | 'all'>('all');
  const [zoom, setZoom] = useState(1);
  const canvasX = useMotionValue(0);
  const canvasY = useMotionValue(0);
  const isDraggingRef = useRef(false);

  // Parallax background grid follows canvas motion with zero React re-renders
  const bgPosition = useTransform(
    [canvasX, canvasY],
    ([x, y]: [number, number]) => `${x}px ${y}px`
  );

  // 1. Unified, atomic batch load to eliminate multi-phase layout shifts
  useEffect(() => {
    let isMounted = true;
    const state = useStore.getState();
    const needsPosts = state.posts.length === 0;
    const needsBooks = state.books.length === 0;
    const needsFilms = state.films.length === 0;
    const needsShows = state.tvShows.length === 0;
    const needsPlaces = state.places.length === 0;
    const needsCollections = state.collections.length === 0;

    const hasSomeData = state.posts.length > 0 || state.books.length > 0 || state.films.length > 0;
    if (hasSomeData) {
      setIsLoading(false);
    }

    if (!needsPosts && !needsBooks && !needsFilms && !needsShows && !needsPlaces && !needsCollections) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      import('../api/content'),
      import('../api/collections')
    ]).then(([{ contentApi }, { collectionsApi }]) => {
      Promise.allSettled([
        needsPosts ? contentApi.getAll('post', 40) : Promise.resolve(state.posts),
        needsBooks ? contentApi.getAll('book', 40) : Promise.resolve(state.books),
        needsFilms ? contentApi.getAll('film', 40) : Promise.resolve(state.films),
        needsShows ? contentApi.getAll('tv_show', 40) : Promise.resolve(state.tvShows),
        needsPlaces ? contentApi.getAll('place', 40) : Promise.resolve(state.places),
        needsCollections ? collectionsApi.getAll() : Promise.resolve(state.collections)
      ]).then(([postsRes, booksRes, filmsRes, showsRes, placesRes, collsRes]) => {
        if (!isMounted) return;
        useStore.setState({
          posts: postsRes.status === 'fulfilled' ? (postsRes.value as any) : state.posts,
          books: booksRes.status === 'fulfilled' ? (booksRes.value as any) : state.books,
          films: filmsRes.status === 'fulfilled' ? (filmsRes.value as any) : state.films,
          tvShows: showsRes.status === 'fulfilled' ? (showsRes.value as any) : state.tvShows,
          places: placesRes.status === 'fulfilled' ? (placesRes.value as any) : state.places,
          collections: collsRes.status === 'fulfilled' ? (collsRes.value as any) : state.collections,
        });
        setIsLoading(false);
      });
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  // 2. Generate stable, golden-ratio sunflower phyllotaxis coordinates
  useEffect(() => {
    const { tvShows, places } = useStore.getState();
    const allAvailable = [
      ...posts.map(d => ({ type: 'post' as WorldItemType, data: d, scale: 0.85 })),
      ...books.map(d => ({ type: 'book' as WorldItemType, data: d, scale: 0.8 })),
      ...films.map(d => ({ type: 'film' as WorldItemType, data: d, scale: 0.9 })),
      ...tvShows.map(d => ({ type: 'tv_show' as WorldItemType, data: d, scale: 0.9 })),
      ...places.map(d => ({ type: 'place' as WorldItemType, data: d, scale: 1.1 })),
      ...collections.map(d => ({ type: 'collection' as WorldItemType, data: d, scale: 1.2 }))
    ].filter(item => item.data && item.data.id);

    if (allAvailable.length === 0) return;

    const items: WorldItem[] = [];
    const radius = 3200;
    const totalItems = Math.min(180, Math.max(allAvailable.length, 60));
    const goldenRatio = 1.618033988749895;

    for (let i = 0; i < totalItems; i++) {
      const sample = allAvailable[i % allAvailable.length];
      if (!sample || !sample.data) continue;

      const seedId = sample.data.id || String(i);
      const theta = 2 * Math.PI * (i / goldenRatio);
      const r = (Math.sqrt((i + 1) / totalItems)) * radius;

      // Deterministic jitter ensures zero layout jitter across renders
      const jitterX = (stringHashToFloat(seedId + '-x') - 0.5) * 160;
      const jitterY = (stringHashToFloat(seedId + '-y') - 0.5) * 160;
      const scaleVariance = 0.85 + stringHashToFloat(seedId + '-s') * 0.3;

      items.push({
        id: `world-${sample.type}-${seedId}-${i}`,
        type: sample.type,
        x: r * Math.cos(theta) + jitterX,
        y: r * Math.sin(theta) + jitterY,
        scale: sample.scale * scaleVariance,
        data: sample.data
      });
    }

    setWorldItems(items);
  }, [posts, books, films, collections]);

  const handleItemClick = useCallback((item: WorldItem) => {
    if (isDraggingRef.current) return;
    openViewer({
      id: item.id,
      type: item.type,
      data: item.data
    });
  }, [openViewer]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(1.6, Math.max(0.55, Number((prev + delta).toFixed(2)))));
  };

  const handleRecenter = () => {
    setZoom(1);
    animate(canvasX, 0, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
    animate(canvasY, 0, { duration: 0.6, ease: [0.16, 1, 0.3, 1] });
  };

  return (
    <div className="fixed inset-0 pt-20 z-0 bg-bg-base overflow-hidden selection:bg-transparent">
      {/* Background Spatial Coordinate Grid & Ambient Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--color-surface) 60%, transparent) 0%, var(--color-background) 100%)'
        }}
      >
        {/* Subtle Spatial Coordinate Grid */}
        <motion.div 
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--canvas-grid, var(--color-border-subtle)) 1px, transparent 1px),
              linear-gradient(to bottom, var(--canvas-grid, var(--color-border-subtle)) 1px, transparent 1px)
            `,
            backgroundSize: `${60 * zoom}px ${60 * zoom}px`,
            backgroundPosition: bgPosition,
            transition: 'background-size 0.2s ease-out'
          }}
        />
        {/* Ambient Spatial Center Glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-accent-primary/10 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* Top Floating Category Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-full bg-bg-elevated/75 backdrop-blur-xl border border-border-subtle shadow-xl max-w-[92vw] overflow-x-auto scrollbar-none"
      >
        {CATEGORY_FILTERS.map(filter => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.type;
          return (
            <button
              key={filter.type}
              onClick={() => setActiveFilter(filter.type)}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-text-primary text-bg-base shadow-sm scale-105" 
                  : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Top Left HUD Info Badge */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-24 left-6 md:left-12 z-20 hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-bg-elevated/70 backdrop-blur-md border border-border-subtle text-xs text-text-secondary pointer-events-none shadow-sm"
      >
        <Compass className="w-3.5 h-3.5 text-text-primary animate-pulse" />
        <span className="font-medium text-text-primary">Infinite Spatial Canvas</span>
        <span className="opacity-40">·</span>
        <span className="font-mono text-[10px] text-text-muted">{worldItems.length} Nodes</span>
        <span className="opacity-40">·</span>
        <span>Drag & Zoom to navigate</span>
      </motion.div>

      {/* Bottom Right Floating Canvas Controls (Zoom & Recenter) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-10 right-6 md:right-12 z-30 flex flex-col items-center gap-2 p-1.5 rounded-2xl bg-bg-elevated/80 backdrop-blur-xl border border-border-subtle shadow-2xl"
      >
        <button
          onClick={() => handleZoom(0.15)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-4 h-[1px] bg-border-subtle my-0.5" />
        <button
          onClick={handleRecenter}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          title="Recenter Canvas"
          aria-label="Recenter Canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Loading Skeleton / Cosmic Hub Preloader */}
      <AnimatePresence>
        {isLoading && worldItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Orbital Rings */}
              <div className="w-44 h-44 rounded-full border border-border-subtle/40 animate-[spin_12s_linear_infinite]" />
              <div className="w-32 h-32 rounded-full border border-dashed border-accent-primary/40 animate-[spin_8s_linear_infinite_reverse] absolute" />
              <div className="w-20 h-20 rounded-full bg-accent-primary/10 backdrop-blur-md border border-accent-primary/50 flex items-center justify-center absolute shadow-2xl animate-pulse">
                <Compass className="w-7 h-7 text-accent-primary" />
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center gap-1.5 text-center">
              <span className="text-xs uppercase tracking-[0.25em] font-medium text-text-primary">
                Aligning Universe Coordinates
              </span>
              <span className="text-[11px] text-text-muted font-mono tracking-widest">
                Computing Spatial Graph Layout...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag Canvas Container */}
      <motion.div 
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: zoom }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-[10000px] h-[10000px] absolute left-1/2 top-1/2 -ml-[5000px] -mt-[5000px] cursor-grab active:cursor-grabbing will-change-transform"
        drag
        dragConstraints={{ left: -3600, right: 3600, top: -3600, bottom: 3600 }}
        dragElastic={0.06}
        dragTransition={{ power: 0.15, timeConstant: 320 }}
        style={{ x: canvasX, y: canvasY }}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 60); }}
      >
        {worldItems.map((item, index) => {
          const isFilterMatch = activeFilter === 'all' || item.type === activeFilter;
          const isSelected = activeViewerItem?.id === item.id;
          const isDimmed = !isFilterMatch || (activeViewerItem !== null && !isSelected);

          return (
            <WorldItemNode 
              key={item.id} 
              item={item} 
              index={index}
              onClick={() => handleItemClick(item)} 
              isSelected={isSelected}
              isDimmed={isDimmed}
              isHighlighted={activeFilter !== 'all' && isFilterMatch}
            />
          );
        })}
      </motion.div>
      
      {/* Bottom Center "Lose Me" Action CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30"
      >
        <Link 
          to="/serendipity" 
          className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-text-primary text-bg-base border border-border-subtle hover:scale-105 active:scale-95 transition-all shadow-2xl backdrop-blur-md font-medium text-xs uppercase tracking-widest group cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-bg-base group-hover:rotate-12 transition-transform" />
          <span>Lose Me</span>
        </Link>
      </motion.div>
    </div>
  );
}

const WorldItemNode = React.memo(function WorldItemNode({ 
  item, 
  index,
  onClick, 
  isSelected, 
  isDimmed,
  isHighlighted 
}: { 
  item: WorldItem; 
  index: number;
  onClick: () => void; 
  isSelected: boolean; 
  isDimmed: boolean; 
  isHighlighted: boolean;
}) {
  const { data, type, x, y, scale } = item;
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      hasMountedRef.current = true;
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  let imageUrl = '';
  let title = '';
  let subtitle = '';
  
  if (type === 'post') {
    imageUrl = (data as Post).imageUrl || '';
    title = (data as Post).title || '';
    subtitle = (data as Post).category || 'Visual';
  } else if (type === 'book') {
    imageUrl = (data as Book).coverImage || '';
    title = (data as Book).title || '';
    subtitle = (data as Book).author || 'Book';
  } else if (type === 'film') {
    imageUrl = (data as Film).posterImage || '';
    title = (data as Film).title || '';
    subtitle = (data as Film).releaseYear ? String((data as Film).releaseYear) : 'Cinema';
  } else if (type === 'collection') {
    imageUrl = (data as Collection).coverImage || '';
    title = (data as Collection).title || '';
    subtitle = 'Curated Collection';
  } else if (type === 'tv_show') {
    imageUrl = (data as any).imageUrl || (data as any).posterImage || '';
    title = (data as any).title || '';
    subtitle = 'Series';
  } else if (type === 'place') {
    imageUrl = (data as any).imageUrl || (data as any).coverImage || '';
    title = (data as any).title || '';
    subtitle = (data as any).location || 'Location';
  }

  // Adaptive dimensions
  let width = 300;
  let height = 400;

  if (type === 'book') { width = 250; height = 380; }
  if (type === 'film' || type === 'tv_show') { width = 280; height = 420; }
  if (type === 'collection') { width = 420; height = 310; }
  if (type === 'place') { width = 460; height = 300; }

  // Staggered entry animation delay (applied only on initial canvas entrance)
  const entryDelay = Math.min(index * 0.012, 0.6);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ 
        opacity: isDimmed ? 0.15 : 1, 
        scale: isSelected ? 1.05 : (isHighlighted ? scale * 1.08 : scale)
      }}
      transition={{ 
        opacity: { duration: 0.35, ease: 'easeOut' },
        scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        delay: hasMountedRef.current ? 0 : entryDelay
      }}
      onClick={onClick}
      className={clsx(
        "absolute flex flex-col items-center group origin-center cursor-pointer will-change-transform select-none",
        isDimmed && "pointer-events-none"
      )}
      style={{ 
        left: '50%', 
        top: '50%', 
        x,
        y,
        width, 
        height,
        zIndex: isSelected ? 60 : (isHighlighted ? 40 : Math.floor(scale * 10))
      }}
    >
      <div className={clsx(
        "relative w-full h-full overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-out group-hover:scale-105 group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.6)] group-hover:border-text-primary/40",
        type === 'collection' ? 'rounded-2xl' : 'rounded-xl',
        isHighlighted ? 'border-2 border-accent-primary shadow-[0_0_30px_rgba(var(--color-accent-primary),0.3)]' : 'border border-border-subtle/50 shadow-2xl',
        "bg-surface/60 backdrop-blur-sm"
      )}>
        {/* Placeholder Shimmer Backdrop while loading */}
        <div 
          className={clsx(
            "absolute inset-0 bg-gradient-to-br from-surface to-bg-elevated transition-opacity duration-700",
            imageLoaded ? "opacity-0" : "opacity-100 animate-pulse"
          )}
        />

        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={title} 
            onLoad={() => setImageLoaded(true)}
            className={clsx(
              "w-full h-full object-cover pointer-events-none transition-all duration-700 select-none",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Ambient Darkened Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

        {/* Title & Metadata Card Footer */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1 pointer-events-none transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-widest uppercase bg-bg-base/80 backdrop-blur-md text-text-primary border border-white/10 shadow-sm">
              {subtitle}
            </span>
            <span className="text-[10px] text-white/50 tracking-wider font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              Explore ↗
            </span>
          </div>

          <h3 className="text-sm font-medium tracking-wide text-white drop-shadow-md line-clamp-1 mt-0.5">
            {title || 'Untitled Artifact'}
          </h3>
        </div>
      </div>
    </motion.div>
  );
});
