import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'motion/react';

interface SettingCarouselProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingCarousel({ title, description, children }: SettingCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [children]);

  const scrollBy = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll-fast
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  return (
    <div className="mb-12">
      <div className="px-6 md:px-12 mb-4">
        <h2 className="text-lg font-serif text-text-primary tracking-tight">{title}</h2>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      
      <div className="relative group">
        {showLeft && (
          <button 
            onClick={() => scrollBy(-300)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-bg-elevated/90 backdrop-blur shadow-md border border-border-subtle flex items-center justify-center text-text-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={clsx(
            "flex overflow-x-auto gap-4 px-6 md:px-12 pb-4 pt-1 snap-x snap-mandatory scrollbar-hide",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {React.Children.map(children, (child) => (
            <div className="snap-center">
              {child}
            </div>
          ))}
        </div>

        {showRight && (
          <button 
            onClick={() => scrollBy(300)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-bg-elevated/90 backdrop-blur shadow-md border border-border-subtle flex items-center justify-center text-text-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        
        {/* Edge fades */}
        <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-bg-base to-transparent pointer-events-none z-20" />
        <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-bg-base to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}
