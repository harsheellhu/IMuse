import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStore } from '../../store/useStore';
import { useImagePalette } from '../../hooks/useImagePalette';
import { LandingFeature } from '../../types';
import clsx from 'clsx';

export function SlideshowLanding({ features }: { features: LandingFeature[] }) {
  const { slideshowConfig, appearance } = useSettingsStore();
  const { isAuthenticated, setAuthModalOpen } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const isTron = appearance === 'tron';

  // Filter features
  const validFeatures = React.useMemo(() => {
    let p = features.filter(f => f.image?.fullUrl);
    if (slideshowConfig.mode === 'shuffle') {
      const shuffled = [...p];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return p;
  }, [features, slideshowConfig.mode]);

  const currentFeature = validFeatures[currentIndex];
  
  // Preload images (current and next)
  useEffect(() => {
    if (validFeatures.length === 0) return;
    
    // We preload current, next, and previous fullUrls
    const nextIndex = (currentIndex + 1) % validFeatures.length;
    const prevIndex = (currentIndex - 1 + validFeatures.length) % validFeatures.length;
    
    [validFeatures[currentIndex], validFeatures[nextIndex], validFeatures[prevIndex]].forEach(f => {
      if (f?.image?.fullUrl) {
        const img = new Image();
        img.src = f.image.fullUrl;
      }
    });
  }, [currentIndex, validFeatures]);

  // Autoplay
  useEffect(() => {
    if (slideshowConfig.autoplay === 'off' || validFeatures.length <= 1) return;
    
    let delay = 7000; // slow
    if (slideshowConfig.autoplay === 'fast') delay = 4000;
    if (slideshowConfig.autoplay === 'cinematic') delay = 12000;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % validFeatures.length);
    }, delay);

    return () => clearInterval(timer);
  }, [slideshowConfig.autoplay, validFeatures.length, currentIndex]); // Reset timer on index change

  const goNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % validFeatures.length);
  }, [validFeatures.length]);

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + validFeatures.length) % validFeatures.length);
  }, [validFeatures.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Wheel and Swipe
  const wheelTimeout = useRef<number | null>(null);
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
      if (e.deltaX > 0) goNext();
      else goPrev();
      
      wheelTimeout.current = window.setTimeout(() => {
        wheelTimeout.current = null;
      }, 500);
    }
  };

  const touchStartRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  // Variants based on transition
  const getVariants = () => {
    switch (slideshowConfig.transition) {
      case 'slide':
        return {
          initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 200 : -200 }),
          animate: { opacity: 1, x: 0 },
          exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -200 : 200 })
        };
      case 'depth':
        return {
          initial: (dir: number) => ({ opacity: 0, scale: 1.1, filter: 'blur(10px)' }),
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          exit: (dir: number) => ({ opacity: 0, scale: 0.9, filter: 'blur(10px)' })
        };
      case 'dissolve':
        return {
          initial: { opacity: 0, filter: 'blur(20px)' },
          animate: { opacity: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, filter: 'blur(20px)' }
        };
      case 'crossfade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const transitionConfig = {
    duration: slideshowConfig.transition === 'dissolve' ? 1.5 : slideshowConfig.transition === 'fade' ? 0.8 : 1,
    ease: [0.16, 1, 0.3, 1]
  };

  // Extract palette from the thumbnail for extreme performance
  const { palette } = useImagePalette(currentFeature?.image?.thumbnailUrl || null);

  if (!currentFeature) return null;

  return (
    <div 
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-bg-base"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Layer */}
      <div 
        className="absolute inset-0 z-0 transition-colors duration-1000 opacity-30 mix-blend-screen pointer-events-none"
        style={{ 
          background: palette 
            ? `radial-gradient(circle at 50% 50%, ${palette.primary}60, transparent 80%)` 
            : 'transparent'
        }}
      />

      {/* Main Image Slideshow */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentFeature.id}
          custom={direction}
          variants={getVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitionConfig}
          className="absolute inset-0 w-full h-full cursor-default group bg-bg-base"
        >
          <picture>
            {currentFeature.image.mobileUrl && (
              <source media="(max-width: 768px)" srcSet={currentFeature.image.mobileUrl} />
            )}
            {currentFeature.image.previewUrl && (
              <source media="(max-width: 1280px)" srcSet={currentFeature.image.previewUrl} />
            )}
            <img 
              src={currentFeature.image.fullUrl} 
              alt={currentFeature.image.alt} 
              decoding="async"
              className={clsx(
                "w-full h-full object-cover select-none",
                slideshowConfig.autoplay === 'cinematic' && "animate-[cinematic-pan_20s_linear_infinite_alternate]"
              )}
              style={{ 
                objectPosition: 'center', 
                willChange: 'transform, opacity' 
              }}
            />
          </picture>
          
          {/* Subtle gradient for text readability */}
          <div className={clsx(
            "absolute pointer-events-none transition-opacity duration-1000",
            slideshowConfig.captionPosition.includes('bottom') ? "inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" : "inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/50 to-transparent",
            isTron ? "opacity-90" : "opacity-60"
          )} />
        </motion.div>
      </AnimatePresence>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-12 z-20">
        
        {/* Invisible Click Zones for Desktop Navigation */}
        <div 
          onClick={goPrev} 
          className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer pointer-events-auto"
          aria-label="Previous image"
        />
        <div 
          onClick={goNext} 
          className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer pointer-events-auto"
          aria-label="Next image"
        />

        {/* Top Area - Empty, handled by LandingPage overlay */}
        <div className="flex justify-between items-start w-full relative z-20 pointer-events-none">
          <div className="w-2/3 max-w-xl pointer-events-auto">
            {slideshowConfig.captionPosition === 'top-left' && (
              <Caption feature={currentFeature} isTron={isTron} />
            )}
          </div>
        </div>

        {/* Bottom Area */}
        <div className="flex justify-between items-end w-full relative z-20 pointer-events-none">
          <div className="w-2/3 max-w-xl pointer-events-auto pl-2 pb-2">
            {slideshowConfig.captionPosition === 'bottom-left' && (
              <Caption feature={currentFeature} isTron={isTron} />
            )}
          </div>

          {/* Spacer if caption is not bottom-left/right */}
          {slideshowConfig.captionPosition === 'top-left' && <div />}

          {/* Bottom Right Area */}
          <div className="flex items-end gap-4 md:gap-6 pointer-events-auto pr-2 pb-2">
            {slideshowConfig.captionPosition === 'bottom-right' && (
              <Caption feature={currentFeature} isTron={isTron} alignRight />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Caption({ feature, isTron, alignRight }: { feature: LandingFeature, isTron: boolean, alignRight?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={feature.id} // Re-animate when post changes
      transition={{ duration: 0.8, delay: 0.2 }}
      className={clsx(
        "flex flex-col gap-1 md:gap-1.5", 
        alignRight ? "items-end text-right" : "items-start text-left"
      )}
    >
      <div className={clsx(
        "text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium drop-shadow-md",
        isTron ? "text-cyan-400" : "text-white/90"
      )}>
        {feature.category || 'Visual'}
      </div>
      
      <h2 className={clsx(
        "text-xl md:text-2xl font-light tracking-wide text-white drop-shadow-md mix-blend-normal",
        isTron && "text-cyan-50 drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]"
      )}>
        {feature.title}
      </h2>
      
      {feature.description && (
        <p className={clsx(
          "text-xs md:text-sm font-light line-clamp-2 max-w-sm drop-shadow-md mt-1",
          isTron ? "text-cyan-100/70" : "text-white/70"
        )}>
          {feature.description}
        </p>
      )}
    </motion.div>
  );
}
