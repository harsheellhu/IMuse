import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useStore, ActiveViewerItem } from '../../store/useStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { uiAudio } from '../../utils/audio';
import { contentApi } from '../../api/content';
import { useImagePalette } from '../../hooks/useImagePalette';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDirectDragScroll } from '../../hooks/useDirectDragScroll';
import clsx from 'clsx';

export function CollectionCarouselViewer() {
  const { activeViewerItem, closeViewer } = useStore();
  const { appearance, motion: motionSetting } = useSettingsStore();

  if (!activeViewerItem || (activeViewerItem.type !== 'collection' && activeViewerItem.mode !== 'collection')) return null;

  return (
    <AnimatePresence>
      <CarouselContent 
        key="collection-carousel-content" 
        item={activeViewerItem} 
        onClose={closeViewer} 
        appearance={appearance} 
        motionSetting={motionSetting} 
      />
    </AnimatePresence>
  );
}

const CarouselContent: React.FC<{ 
  item: ActiveViewerItem; 
  onClose: () => void; 
  appearance: string; 
  motionSetting: string 
}> = ({ item, onClose, appearance, motionSetting }) => {
  useBodyScrollLock(true);
  const collection = item.data || {};
  const [items, setItems] = useState<any[]>(collection.items || []);
  const [isLoading, setIsLoading] = useState(!collection.items);
  const [activeIndex, setActiveIndex] = useState(0);
  const isTron = appearance === 'tron';
  const isDark = document.documentElement.classList.contains('dark') || isTron;

  // Thumbnail strip drag scroll
  const {
    containerRef: thumbContainerRef,
    bind: thumbBind
  } = useDirectDragScroll<HTMLElement>({
    inertia: true,
    dragThreshold: 6
  });

  // Load items if not provided (i.e. not a virtual collection)
  useEffect(() => {
    let mounted = true;
    if (!collection.items && collection.id) {
      setIsLoading(true);
      contentApi.getCollectionItems(collection.id)
        .then((fetchedItems) => {
          if (mounted) {
            setItems(fetchedItems || []);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch collection items:', err);
          if (mounted) setIsLoading(false);
        });
    }
    return () => { mounted = false; };
  }, [collection.id, collection.items]);

  // Audio on mount
  useEffect(() => {
    uiAudio.playCollectionOpen();
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev < items.length - 1) {
        uiAudio.playCarouselMove();
        return prev + 1;
      }
      return prev;
    });
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev > 0) {
        uiAudio.playCarouselMove();
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const activeItem = items[activeIndex];
  const activeImage = activeItem?.imageUrl || activeItem?.coverImage || activeItem?.posterImage || (activeItem as any)?.image_url || collection.coverImage || (collection as any)?.cover_image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f';
  const { palette } = useImagePalette(activeImage);

  // Background interpolation logic
  const baseBg = isTron ? '#010409' : (isDark ? '#080808' : '#FAF9F6');
  const transitionDuration = motionSetting === 'reduced' ? 0.05 : (motionSetting === 'cinematic' ? 0.6 : 0.4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: transitionDuration }}
      className="fixed inset-0 z-[1000] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Base Background */}
      <div className="absolute inset-0 transition-colors duration-700" style={{ backgroundColor: baseBg }} />

      {/* Optimized Ambient Radial Bloom from Extracted Palette (GPU-friendly, no heavy full-page convolution filters) */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-30 mix-blend-screen"
        style={{
          background: palette 
            ? `radial-gradient(circle 700px at 50% 50%, ${palette.primary}40, transparent 70%)`
            : isTron 
              ? 'radial-gradient(circle 700px at 50% 50%, rgba(0, 240, 255, 0.15), transparent 70%)'
              : 'radial-gradient(circle 700px at 50% 50%, rgba(255, 255, 255, 0.05), transparent 70%)'
        }}
      />

      <div className={clsx("absolute inset-0 pointer-events-none", isTron ? "bg-black/60" : "bg-black/15")} />

      {/* Header */}
      <header className="relative z-20 w-full px-6 md:px-12 py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex flex-col">
          <h2 className={clsx(
            "text-lg md:text-xl font-serif tracking-tight",
            isTron ? "text-cyan-400 font-mono uppercase" : "text-text-primary"
          )}>
            {collection.title || 'Collection'}
          </h2>
          <span className="text-[10px] tracking-widest uppercase text-text-secondary">
            {items.length} Items {items.length > 0 ? `· ${activeIndex + 1} of ${items.length}` : ''}
          </span>
        </div>
        
        <button
          type="button"
          aria-label="Close collection viewer"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-text-primary bg-bg-elevated/70 hover:bg-bg-elevated backdrop-blur-md border border-border-subtle transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Carousel Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center overflow-hidden w-full">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        ) : items.length === 0 ? (
          <p className="text-text-muted font-serif italic text-sm">This collection is empty.</p>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Left Nav */}
            <button 
              type="button"
              aria-label="Previous item"
              className={clsx(
                "absolute left-4 md:left-12 z-20 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer",
                activeIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105",
                isTron ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-bg-elevated/80 text-text-primary hover:bg-bg-elevated border border-border-subtle"
              )}
              onClick={handlePrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Active Item */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 40, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.98 }}
                transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center gap-5 max-h-[72vh] w-full max-w-4xl px-12 md:px-16"
              >
                <div 
                  className={clsx(
                    "relative overflow-hidden rounded-sm shadow-2xl bg-surface",
                    isTron && "border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                  )}
                  style={{ 
                    maxHeight: '58vh', 
                    aspectRatio: activeItem?.type === 'place' ? '16/10' : (activeItem?.type === 'book' || activeItem?.type === 'film' ? '2/3' : '4/5') 
                  }}
                >
                  <img 
                    src={activeImage} 
                    alt={activeItem?.title || ''} 
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                {/* Metadata */}
                <div className="text-center w-full max-w-lg">
                  <h3 className={clsx(
                    "text-xl md:text-2xl font-serif tracking-tight mb-1 truncate",
                    isTron ? "text-cyan-400" : "text-text-primary"
                  )}>
                    {activeItem?.title || activeItem?.name || 'Untitled'}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                    {activeItem?.author || activeItem?.director || activeItem?.creator || activeItem?.artist || activeItem?.category || activeItem?.type || 'Item'}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Nav */}
            <button 
              type="button"
              aria-label="Next item"
              className={clsx(
                "absolute right-4 md:right-12 z-20 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer",
                activeIndex === items.length - 1 ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105",
                isTron ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-bg-elevated/80 text-text-primary hover:bg-bg-elevated border border-border-subtle"
              )}
              onClick={handleNext}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Thumbnail Strip with direct horizontal drag scroll */}
      {items.length > 0 && (
        <footer 
          ref={thumbContainerRef}
          {...thumbBind}
          tabIndex={0}
          role="region"
          aria-label="Collection thumbnails"
          className="relative z-20 w-full h-20 mb-4 px-6 overflow-x-auto scrollbar-hide flex items-center justify-center gap-2 select-none focus:outline-none"
        >
          {items.map((thumbItem, idx) => (
            <button
              key={`thumb-${thumbItem.id || idx}`}
              type="button"
              onClick={() => {
                if (idx !== activeIndex) {
                  uiAudio.playCarouselMove();
                  setActiveIndex(idx);
                }
              }}
              className={clsx(
                "relative h-14 w-11 shrink-0 rounded-sm overflow-hidden transition-all duration-300 cursor-pointer",
                activeIndex === idx 
                  ? (isTron ? "opacity-100 ring-2 ring-cyan-400 scale-105 shadow-md" : "opacity-100 ring-2 ring-text-primary scale-105 shadow-md") 
                  : "opacity-40 hover:opacity-80"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            >
              <img 
                src={thumbItem.imageUrl || thumbItem.coverImage || thumbItem.posterImage || thumbItem.image_url} 
                alt="" 
                decoding="async"
                loading="lazy"
                className="w-full h-full object-cover pointer-events-none"
              />
            </button>
          ))}
        </footer>
      )}
    </motion.div>
  );
};
