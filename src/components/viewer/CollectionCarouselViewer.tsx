import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useStore, ActiveViewerItem } from '../../store/useStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { uiAudio } from '../../utils/audio';
import { contentApi } from '../../api/content';
import { useImagePalette } from '../../hooks/useImagePalette';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import clsx from 'clsx';

export function CollectionCarouselViewer() {
  const { activeViewerItem, closeViewer } = useStore();
  const { appearance, motion: motionSetting } = useSettingsStore();

  if (!activeViewerItem || (activeViewerItem.type !== 'collection' && activeViewerItem.mode !== 'collection')) return null;

  return (
    <AnimatePresence>
      <CarouselContent key="viewer" item={activeViewerItem} onClose={closeViewer} appearance={appearance} motionSetting={motionSetting} />
    </AnimatePresence>
  );
}

const CarouselContent: React.FC<{ item: ActiveViewerItem; onClose: () => void; appearance: string; motionSetting: string }> = ({ item, onClose, appearance, motionSetting }) => {
  useBodyScrollLock(true);
  const collection = item.data;
  const [items, setItems] = useState<any[]>(collection.items || []);
  const [isLoading, setIsLoading] = useState(!collection.items);
  const [activeIndex, setActiveIndex] = useState(0);
  const isTron = appearance === 'tron';
  const isDark = document.documentElement.classList.contains('dark') || isTron;

  // Load items if not provided (i.e. not a virtual collection)
  useEffect(() => {
    let mounted = true;
    if (!collection.items) {
      setIsLoading(true);
      contentApi.getCollectionItems(collection.id)
        .then((fetchedItems) => {
          if (mounted) {
            setItems(fetchedItems);
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

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  const handleNext = () => {
    setActiveIndex((prev) => {
      const next = prev < items.length - 1 ? prev + 1 : prev;
      if (next !== prev) uiAudio.playCarouselMove();
      return next;
    });
  };

  const handlePrev = () => {
    setActiveIndex((prev) => {
      const next = prev > 0 ? prev - 1 : prev;
      if (next !== prev) uiAudio.playCarouselMove();
      return next;
    });
  };

  const activeItem = items[activeIndex];
  const activeImage = activeItem?.imageUrl || activeItem?.coverImage || activeItem?.posterImage || collection.coverImage;
  const { palette } = useImagePalette(activeImage);

  // Background interpolation logic
  const baseBg = isTron ? '#010409' : (isDark ? '#080808' : '#FAF9F6');

  // Motion reduced handling
  const transitionDuration = motionSetting === 'reduced' ? 0 : (motionSetting === 'cinematic' ? 0.8 : 0.5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: transitionDuration }}
      className="fixed inset-0 z-[1000] flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Base Background */}
      <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: baseBg }} />

      {/* Ambient Bloom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDark ? 0.2 : 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 pointer-events-none mix-blend-normal dark:mix-blend-screen"
          style={{
            backgroundImage: `url(${activeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(100px) saturate(120%)',
            transform: 'scale(1.1)',
          }}
        />
      </AnimatePresence>

      {/* Extracted Palette Ambient Overlay */}
      <AnimatePresence>
        {palette && (
          <motion.div
            key={palette.primary}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 pointer-events-none mix-blend-multiply dark:mix-blend-screen"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${palette.primary}15, transparent 70%)`
            }}
          />
        )}
      </AnimatePresence>

      <div className={clsx("absolute inset-0 pointer-events-none", isTron ? "bg-black/60" : "bg-black/20")} />

      {/* Header */}
      <header className="relative z-10 w-full px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex flex-col">
          <motion.h2 layoutId={`collection-meta-${collection.id}`} className={clsx(
            "text-lg md:text-xl font-serif tracking-tight",
            isTron ? "text-cyan-400 font-mono uppercase" : "text-text-primary"
          )}>
            {collection.title}
          </motion.h2>
          <span className="text-[10px] tracking-widest uppercase text-text-secondary">
            {items.length} Items {activeIndex + 1 > 0 ? `· ${activeIndex + 1} of ${items.length}` : ''}
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full flex items-center justify-center text-text-primary bg-bg-elevated/40 hover:bg-bg-elevated/80 backdrop-blur-md border border-border-subtle/50 transition-all z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Carousel Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center overflow-hidden w-full">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        ) : items.length === 0 ? (
          <p className="text-text-muted font-serif italic">This collection is empty.</p>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Left Nav */}
            <button 
              className={clsx(
                "absolute left-4 md:left-12 z-20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                activeIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105",
                isTron ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-white/10 text-white hover:bg-white/20"
              )}
              onClick={handlePrev}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Active Item */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.98 }}
                transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center gap-6 max-h-[70vh] w-full max-w-4xl px-16"
              >
                {/* layoutId links to the original card's image for seamless morphing */}
                <motion.div 
                  layoutId={activeIndex === 0 ? `collection-image-${collection.id}` : undefined}
                  className={clsx(
                    "relative overflow-hidden rounded-sm shadow-2xl",
                    isTron && "border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                  )}
                  style={{ maxHeight: '60vh', aspectRatio: activeItem.type === 'place' ? '16/10' : (activeItem.type === 'book' || activeItem.type === 'film' ? '2/3' : '4/5') }}
                >
                  <img src={activeImage} alt={activeItem.title} className="w-full h-full object-cover" />
                </motion.div>
                
                {/* Metadata */}
                <div className="text-center w-full max-w-lg">
                  <h3 className={clsx(
                    "text-2xl md:text-3xl font-serif tracking-tight mb-2 truncate",
                    isTron ? "text-cyan-400" : "text-white"
                  )}>{activeItem.title || activeItem.name || 'Untitled'}</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    {activeItem.author || activeItem.director || activeItem.creator || activeItem.artist || activeItem.category || activeItem.type || 'Item'}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Nav */}
            <button 
              className={clsx(
                "absolute right-4 md:right-12 z-20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                activeIndex === items.length - 1 ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105",
                isTron ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-white/10 text-white hover:bg-white/20"
              )}
              onClick={handleNext}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>

      {/* Thumbnail Strip */}
      {items.length > 0 && (
        <footer className="relative z-10 w-full h-24 mb-6 px-6 overflow-x-auto no-scrollbar flex items-center justify-center gap-2">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                if (idx !== activeIndex) uiAudio.playCarouselMove();
                setActiveIndex(idx);
              }}
              className={clsx(
                "relative h-16 w-12 shrink-0 rounded-sm overflow-hidden transition-all duration-300 cursor-pointer",
                activeIndex === idx ? "opacity-100 ring-2 ring-offset-2 ring-offset-transparent " + (isTron ? "ring-cyan-400 scale-110" : "ring-white scale-110") : "opacity-40 hover:opacity-75"
              )}
            >
              <img 
                src={item.imageUrl || item.coverImage || item.posterImage} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </footer>
      )}
    </motion.div>
  );
}
