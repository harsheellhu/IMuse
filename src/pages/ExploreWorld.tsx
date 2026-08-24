import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore, ActiveViewerItem } from '../store/useStore';
import clsx from 'clsx';
import { Post, Book, Film, Collection } from '../types';

type WorldItemType = 'post' | 'book' | 'film' | 'collection';

interface WorldItem {
  id: string;
  type: WorldItemType;
  x: number;
  y: number;
  scale: number;
  data: Post | Book | Film | Collection;
}

export function ExploreWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { posts, books, films, collections, activeViewerItem, openViewer } = useStore();
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);

  // Generate organic spatial coordinates
  useEffect(() => {
    const items: WorldItem[] = [];
    const radius = 3000; // Large 6000x6000 canvas roughly
    
    const generatePoint = (i: number, total: number) => {
      // Golden spiral distribution for organic but even spacing
      const golden_ratio = (Math.sqrt(5) + 1) / 2 - 1;
      const r = Math.sqrt(i + 0.5) / Math.sqrt(total) * radius;
      const theta = 2 * Math.PI * golden_ratio * i;
      return {
        x: r * Math.cos(theta),
        y: r * Math.sin(theta)
      };
    };

    const totalItems = 150; // Use subset for performance in canvas
    
    // Mix items
    for(let i=0; i<totalItems; i++) {
      const typeChance = Math.random();
      let type: WorldItemType = 'post';
      let data: Post | Book | Film | Collection = posts[i % posts.length];
      let scale = 1;

      if(typeChance > 0.8 && books.length > 0) {
        type = 'book';
        data = books[i % books.length];
        scale = 0.8;
      } else if (typeChance > 0.6 && films.length > 0) {
        type = 'film';
        data = films[i % films.length];
        scale = 0.9;
      } else if (typeChance > 0.9 && collections.length > 0) {
        type = 'collection';
        data = collections[i % collections.length];
        scale = 1.2;
      } else {
        // Post scales vary
        scale = 0.7 + Math.random() * 0.8;
      }

      const { x, y } = generatePoint(i, totalItems);

      // Add a little organic noise
      items.push({
        id: `world-${type}-${data.id}-${i}`,
        type,
        x: x + (Math.random() - 0.5) * 200,
        y: y + (Math.random() - 0.5) * 200,
        scale,
        data
      });
    }
    setWorldItems(items);
  }, [posts, books, films, collections]);

  const handleItemClick = (item: WorldItem) => {
    openViewer({
      id: item.id,
      type: item.type,
      data: item.data
    });
  };

  return (
    <div className="fixed inset-0 pt-20 z-0 bg-bg-base overflow-hidden selection:bg-transparent">
      {/* Drag Canvas */}
      <motion.div 
        ref={containerRef}
        className="w-[10000px] h-[10000px] absolute left-1/2 top-1/2 -ml-[5000px] -mt-[5000px] cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: -3000, right: 3000, top: -3000, bottom: 3000 }}
        dragElastic={0.1}
        dragTransition={{ power: 0.1, timeConstant: 300 }}
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
    </div>
  );
}

function WorldItemNode({ item, onClick, isSelected, isDimmed }: { key?: React.Key, item: WorldItem, onClick: () => void, isSelected: boolean, isDimmed: boolean }) {
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
  }

  // Base dimensions before scale
  let width = 300;
  let height = 400;

  // Render differently based on aspect ratio clues
  if (type === 'book') { width = 250; height = 380; }
  if (type === 'film') { width = 280; height = 420; }
  if (type === 'collection') { width = 400; height = 300; }

  return (
    <motion.div
      layoutId={`item-${item.id}`}
      className="absolute flex flex-col items-center group origin-center cursor-pointer"
      style={{ 
        left: '50%', top: '50%', 
        x, y,
        width, height,
        zIndex: isSelected ? 50 : Math.floor(scale * 10),
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isDimmed ? 0.2 : 1, 
        scale: isSelected ? 1 : scale 
      }}
      whileHover={!isSelected ? { scale: scale * 1.05, zIndex: 40 } : undefined}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
    >
      <div className={clsx(
        "relative w-full h-full overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(255,255,255,0.03)]",
        type === 'collection' ? 'rounded-md' : 'rounded-sm'
      )}>
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
        
        {/* Subtle hover metadata */}
        {!isSelected && (
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="bg-bg-elevated/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-text-primary shadow-sm">
              {type}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
