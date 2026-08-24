import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Post } from '../../types';
import { Bookmark, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

interface CarouselProps {
  items: Post[];
  title?: string;
}

export function Carousel({ items, title }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { savedPostIds, toggleSavePost } = useStore();

  return (
    <div className="w-full py-12 overflow-hidden flex flex-col">
      {title && (
        <div className="px-4 md:px-12 mb-8 flex justify-between items-end">
          <h2 className="text-sm font-medium tracking-widest uppercase text-text-secondary">{title}</h2>
        </div>
      )}
      
      {/* Native scroll container with snapping */}
      <div 
        ref={containerRef}
        className="flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory px-4 md:px-[10vw] pb-12 scrollbar-hide"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item, index) => {
          const isSaved = savedPostIds.has(item.id);
          return (
            <CarouselItem 
              key={`${item.id}-${index}`} 
              item={item} 
              isSaved={isSaved} 
              onSave={() => toggleSavePost(item.id)} 
            />
          );
        })}
      </div>
    </div>
  );
}

function CarouselItem({ item, isSaved, onSave }: { key?: React.Key, item: Post, isSaved: boolean, onSave: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { openViewer } = useStore();
  
  const [isCenter, setIsCenter] = useState(false);

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const startPos = useRef<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // only left click for mouse
    startPos.current = { x: e.clientX, y: e.clientY };
    
    // Clear any existing timer just in case
    if (pressTimer.current) clearTimeout(pressTimer.current);
    
    pressTimer.current = setTimeout(() => {
      openViewer({ id: item.id, type: 'post', data: item });
      startPos.current = null;
    }, 250);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    // If the cursor is used to browse (drag/swipe), cancel the timer
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    startPos.current = null;
  };

  const handlePointerLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    startPos.current = null;
  };

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If it's intersecting near the center of the viewport
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          setIsCenter(true);
        } else {
          setIsCenter(false);
        }
      },
      {
        root: null,
        rootMargin: '0px -20% 0px -20%', // look at the center 60% of the screen
        threshold: [0, 0.4, 0.6, 0.8, 1]
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div 
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
      className="snap-center shrink-0 w-[80vw] md:w-[40vw] lg:w-[30vw] flex flex-col items-center justify-center relative group cursor-pointer"
      animate={{ 
        scale: isCenter ? 1 : 0.92,
        opacity: isCenter ? 1 : 0.6 
      }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-sm bg-bg-secondary shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.01)]">
        <img 
          src={item.imageUrl} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
        
        {/* Hover metadata & actions */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="flex justify-between items-start">
            <div className="bg-bg-elevated/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-text-primary">
              {item.category}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 transform translate-y-2 group-hover:translate-y-0",
                isSaved ? "bg-text-primary text-bg-base" : "bg-bg-elevated/90 text-text-primary hover:bg-text-primary hover:text-bg-base"
              )}
            >
              {isSaved ? <Bookmark className="w-4 h-4" fill="currentColor" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Floating metadata below */}
      <div className="mt-4 text-center px-4 transition-opacity duration-500 opacity-0 group-hover:opacity-100">
        <h3 className="text-lg font-medium tracking-tight text-text-primary">{item.title}</h3>
        <p className="text-sm text-text-secondary mt-1">{item.category}</p>
      </div>
    </motion.div>
  );
}
