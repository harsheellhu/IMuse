import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore, ActiveViewerItem } from '../store/useStore';
import clsx from 'clsx';
import { Post, Book, Film, Collection, TvShow, Place } from '../types';
import { Link } from 'react-router-dom';
import { Sparkles, Compass } from 'lucide-react';

type WorldItemType = 'post' | 'book' | 'film' | 'collection' | 'tv_show' | 'place';

interface WorldItem {
  id: string;
  type: WorldItemType;
  x: number;
  y: number;
  scale: number;
  data: Post | Book | Film | Collection | TvShow | Place;
}

export function ExploreWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { posts, books, films, collections, activeViewerItem, openViewer } = useStore();
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    import('../api/content').then(({ contentApi }) => {
      if (posts.length === 0) contentApi.getAll('post').then(d => useStore.setState({ posts: d as any })).catch(console.error);
      if (books.length === 0) contentApi.getAll('book').then(d => useStore.setState({ books: d as any })).catch(console.error);
      if (films.length === 0) contentApi.getAll('film').then(d => useStore.setState({ films: d as any })).catch(console.error);
      if (useStore.getState().tvShows.length === 0) contentApi.getAll('tv_show').then(d => useStore.setState({ tvShows: d as any })).catch(console.error);
      if (useStore.getState().places.length === 0) contentApi.getAll('place').then(d => useStore.setState({ places: d as any })).catch(console.error);
    });
    import('../api/collections').then(({ collectionsApi }) => {
      if (collections.length === 0) collectionsApi.getAll().then(d => useStore.setState({ collections: d as any })).catch(console.error);
    });
  }, []);

  // Generate organic spatial coordinates
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
    const radius = 3000;
    const totalItems = Math.min(160, Math.max(allAvailable.length, 60));
    
    const generatePoint = (i: number, total: number) => {
      const golden_ratio = (Math.sqrt(5) + 1) / 2 - 1;
      const r = (Math.sqrt(i + 0.5) / Math.sqrt(total)) * radius;
      const theta = 2 * Math.PI * golden_ratio * i;
      return {
        x: r * Math.cos(theta),
        y: r * Math.sin(theta)
      };
    };

    for (let i = 0; i < totalItems; i++) {
      const sample = allAvailable[i % allAvailable.length];
      if (!sample || !sample.data) continue;

      const { x, y } = generatePoint(i, totalItems);

      items.push({
        id: `world-${sample.type}-${sample.data.id}-${i}`,
        type: sample.type,
        x: x + (Math.random() - 0.5) * 200,
        y: y + (Math.random() - 0.5) * 200,
        scale: sample.scale * (0.8 + Math.random() * 0.4),
        data: sample.data
      });
    }

    setWorldItems(items);
  }, [posts, books, films, collections]);

  const handleItemClick = (item: WorldItem) => {
    if (isDraggingRef.current) return;
    openViewer({
      id: item.id,
      type: item.type,
      data: item.data
    });
  };

  return (
    <div className="fixed inset-0 pt-20 z-0 bg-bg-base overflow-hidden selection:bg-transparent">
      {/* HUD Info */}
      <div className="absolute top-24 left-6 md:left-12 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-bg-elevated/80 backdrop-blur-md border border-border-subtle text-xs text-text-secondary pointer-events-none shadow-sm">
        <Compass className="w-3.5 h-3.5 text-text-primary" />
        <span className="font-medium text-text-primary">Infinite Spatial Canvas</span>
        <span className="opacity-40">·</span>
        <span>Drag to explore</span>
      </div>

      {/* Drag Canvas */}
      <motion.div 
        ref={containerRef}
        className="w-[10000px] h-[10000px] absolute left-1/2 top-1/2 -ml-[5000px] -mt-[5000px] cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: -3000, right: 3000, top: -3000, bottom: 3000 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.1, timeConstant: 300 }}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 50); }}
      >
        {worldItems.map(item => (
          <WorldItemNode 
            key={item.id} 
            item={item} 
            onClick={() => handleItemClick(item)} 
            isSelected={activeViewerItem?.id === item.id}
            isDimmed={activeViewerItem !== null && activeViewerItem?.id !== item.id}
          />
        ))}
      </motion.div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50">
        <Link 
          to="/serendipity" 
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-text-primary text-bg-base border border-border-subtle hover:scale-105 transition-transform shadow-2xl backdrop-blur-md font-medium text-xs uppercase tracking-widest"
        >
          <Sparkles className="w-4 h-4" />
          <span>Lose Me</span>
        </Link>
      </div>
    </div>
  );
}

function WorldItemNode({ item, onClick, isSelected, isDimmed }: { key?: React.Key; item: WorldItem; onClick: () => void; isSelected: boolean; isDimmed: boolean }) {
  const { data, type, x, y, scale } = item;

  let imageUrl = '';
  let title = '';
  
  if (type === 'post') {
    imageUrl = (data as Post).imageUrl || '';
    title = (data as Post).title || '';
  } else if (type === 'book') {
    imageUrl = (data as Book).coverImage || '';
    title = (data as Book).title || '';
  } else if (type === 'film') {
    imageUrl = (data as Film).posterImage || '';
    title = (data as Film).title || '';
  } else if (type === 'collection') {
    imageUrl = (data as Collection).coverImage || '';
    title = (data as Collection).title || '';
  } else if (type === 'tv_show') {
    imageUrl = (data as any).imageUrl || (data as any).posterImage || '';
    title = (data as any).title || '';
  } else if (type === 'place') {
    imageUrl = (data as any).imageUrl || (data as any).coverImage || '';
    title = (data as any).title || '';
  }

  // Base dimensions before scale
  let width = 300;
  let height = 400;

  if (type === 'book') { width = 250; height = 380; }
  if (type === 'film' || type === 'tv_show') { width = 280; height = 420; }
  if (type === 'collection') { width = 400; height = 300; }
  if (type === 'place') { width = 480; height = 300; }

  return (
    <div
      onClick={onClick}
      className="absolute flex flex-col items-center group origin-center cursor-pointer will-change-transform"
      style={{ 
        left: '50%', top: '50%', 
        transform: `translate3d(${x}px, ${y}px, 0) scale(${isSelected ? 1 : scale})`,
        width, height,
        zIndex: isSelected ? 50 : Math.floor(scale * 10),
        opacity: isDimmed ? 0.2 : 1,
        transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className={clsx(
        "relative w-full h-full overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-500",
        type === 'collection' ? 'rounded-md' : 'rounded-sm'
      )}>
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
        
        {/* Subtle hover metadata */}
        {!isSelected && (
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="bg-bg-elevated/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-text-primary shadow-sm border border-border-subtle">
              {type}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
