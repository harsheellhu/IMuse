import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useDirectDragScroll } from '../../hooks/useDirectDragScroll';

interface SettingCarouselProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingCarousel({ title, description, children }: SettingCarouselProps) {
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
    snap: false,
    dragThreshold: 6
  });

  return (
    <div className="mb-10">
      <div className="px-4 md:px-8 mb-3">
        <h2 className="text-base font-serif font-medium text-text-primary tracking-tight">{title}</h2>
        {description && <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>}
      </div>
      
      <div className="relative group">
        {canScrollLeft && (
          <button 
            type="button"
            onClick={() => scrollBy(-320)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-bg-elevated/95 backdrop-blur-md shadow-md border border-border-subtle flex items-center justify-center text-text-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        
        <div 
          ref={containerRef}
          {...bind}
          tabIndex={0}
          role="region"
          aria-label={title}
          className={clsx(
            "flex overflow-x-auto gap-3.5 px-4 md:px-8 pb-3 pt-1 scrollbar-hide focus:outline-none select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {React.Children.map(children, (child) => (
            <div 
              className="shrink-0"
              onClickCapture={(e) => {
                if (shouldPreventClick()) {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
            >
              {child}
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            type="button"
            onClick={() => scrollBy(320)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-bg-elevated/95 backdrop-blur-md shadow-md border border-border-subtle flex items-center justify-center text-text-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        {/* Edge fades */}
        <div className="absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-20" />
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}
