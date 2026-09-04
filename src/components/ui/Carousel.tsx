import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Post } from '../../types';
import { Bookmark, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';
import { useDirectDragScroll } from '../../hooks/useDirectDragScroll';

interface CarouselProps {
  items: Post[];
  title?: string;
}

export function Carousel({ items, title }: CarouselProps) {
  const { savedPostIds, toggleSavePost, openViewer } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    containerRef,
    isDragging,
    canScrollLeft,
    canScrollRight,
    scrollBy,
    shouldPreventClick,
    bind
  } = useDirectDragScroll<HTMLDivElement>({
    inertia: true,
    snap: true,
    itemSelector: '[data-carousel-item]',
    dragThreshold: 6,
    onIndexChange: setActiveIndex
  });

  const handleItemClick = (item: Post) => {
    if (shouldPreventClick()) return;
    openViewer({ id: item.id, type: 'post', data: item });
  };

  return (
    <div className="w-full py-8 md:py-12 overflow-hidden flex flex-col relative group">
      {title && (
        <div className="px-4 md:px-12 mb-6 flex justify-between items-end">
          <h2 className="text-xs md:text-sm font-medium tracking-widest uppercase text-text-secondary">{title}</h2>
          <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => scrollBy(-400)}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-border-subtle bg-bg-elevated/80 backdrop-blur-md flex items-center justify-center text-text-primary disabled:opacity-30 hover:border-text-primary transition-all cursor-pointer"
              aria-label="Previous items"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy(400)}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-border-subtle bg-bg-elevated/80 backdrop-blur-md flex items-center justify-center text-text-primary disabled:opacity-30 hover:border-text-primary transition-all cursor-pointer"
              aria-label="Next items"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Scroll container with direct 1:1 pointer drag */}
      <div 
        ref={containerRef}
        {...bind}
        tabIndex={0}
        role="region"
        aria-label={title || "Featured Carousel"}
        className="flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory px-4 md:px-[10vw] pb-8 pt-2 scrollbar-hide focus:outline-none"
      >
        {items.map((item, index) => {
          const isSaved = savedPostIds.includes(item.id);
          const isCenter = index === activeIndex;

          return (
            <div
              key={`${item.id}-${index}`}
              data-carousel-item
              onClick={() => handleItemClick(item)}
              className="snap-center shrink-0 w-[75vw] sm:w-[50vw] md:w-[35vw] lg:w-[28vw] flex flex-col items-center justify-center relative group/item select-none cursor-pointer"
            >
              <motion.div 
                className="w-full"
                animate={{ 
                  scale: isCenter ? 1 : 0.94,
                  opacity: isCenter ? 1 : 0.75 
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden rounded-sm bg-bg-secondary shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)]">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title || 'Item'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-105 pointer-events-none"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors duration-300 pointer-events-none" />
                  
                  {/* Hover metadata & actions */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-between opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="flex justify-between items-start">
                      <div className="bg-bg-elevated/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-text-primary border border-border-subtle shadow-sm pointer-events-none">
                        {item.category || 'Visual'}
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!shouldPreventClick()) toggleSavePost(item.id); 
                        }}
                        className={clsx(
                          "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-md",
                          isSaved ? "bg-text-primary text-bg-base" : "bg-bg-elevated/90 text-text-primary hover:bg-text-primary hover:text-bg-base border border-border-subtle"
                        )}
                        aria-label={isSaved ? "Saved" : "Save item"}
                      >
                        {isSaved ? <Bookmark className="w-4 h-4" fill="currentColor" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Metadata below */}
                <div className="mt-3 text-center px-2">
                  <h3 className="text-base font-serif font-medium tracking-tight text-text-primary truncate">{item.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{item.category}</p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
