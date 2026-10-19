import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStore } from '../../store/useStore';
import { useImagePalette } from '../../hooks/useImagePalette';
import { LandingFeature } from '../../types';
import clsx from 'clsx';

// Helper to safely convert RGB or Hex color to RGBA with specific opacity
function getGradientColor(color: string | undefined, opacity: number): string {
  if (!color) return `rgba(255, 255, 255, ${opacity})`;
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

export function SlideshowLanding({ features }: { features: LandingFeature[] }) {
  const { slideshowConfig, appearance } = useSettingsStore();
  const { isAuthenticated, setAuthModalOpen } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isInitialRender = useRef(true);
  const isTron = appearance === 'tron';

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  // Safe defaults for slideshowConfig
  const config = React.useMemo(() => ({
    mode: 'curated' as const,
    autoplay: 'slow' as const,
    transition: 'fade' as const,
    captionPosition: 'bottom-left' as const,
    ...(slideshowConfig || {})
  }), [slideshowConfig]);

  // Filter features
  const validFeatures = React.useMemo(() => {
    let p = (features || []).filter(f => f && f.image?.fullUrl);
    if (p.length === 0 && features && features.length > 0) {
      p = features;
    }
    if (config.mode === 'shuffle') {
      const shuffled = [...p];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return p;
  }, [features, config.mode]);

  const currentFeature = validFeatures[currentIndex] || features[0];

  // Reset imageLoaded on index change
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);
  
  // Extract palette from the feature metadata (0ms instant) or fallback to async hook
  const fallbackPalette = useImagePalette(
    (!currentFeature?.palette && currentFeature?.image?.thumbnailUrl) ? currentFeature.image.thumbnailUrl : null
  );
  const activePalette = currentFeature?.palette || fallbackPalette.palette;

  // Progressive Preload: Only preload the next image after initial paint on idle
  useEffect(() => {
    if (validFeatures.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % validFeatures.length;
    const nextFeature = validFeatures[nextIndex];
    
    if (nextFeature?.image?.fullUrl) {
      const schedulePreload = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1000));
      const handle = schedulePreload(() => {
        const img = new Image();
        img.src = nextFeature.image.fullUrl;
      });
      return () => {
        if (window.cancelIdleCallback && typeof handle === 'number') {
          window.cancelIdleCallback(handle);
        }
      };
    }
  }, [currentIndex, validFeatures]);

  // Autoplay
  useEffect(() => {
    if (config.autoplay === 'off' || validFeatures.length <= 1) return;
    
    let delay = 7000; // slow
    if (config.autoplay === 'fast') delay = 4000;
    if (config.autoplay === 'cinematic') delay = 12000;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % validFeatures.length);
    }, delay);

    return () => clearInterval(timer);
  }, [config.autoplay, validFeatures.length, currentIndex]);

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
    switch (config.transition) {
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
    duration: config.transition === 'dissolve' ? 1.5 : config.transition === 'fade' ? 0.8 : 1,
    ease: [0.16, 1, 0.3, 1]
  };

  if (!currentFeature) return null;

  return (
    <div 
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-bg-base"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Layer with Guaranteed Valid CSS */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-1000 opacity-50 mix-blend-screen pointer-events-none"
        style={{ 
          background: activePalette 
            ? `radial-gradient(circle at 50% 50%, ${getGradientColor(activePalette.primary, 0.45)} 0%, ${getGradientColor(activePalette.secondary, 0.2)} 50%, transparent 80%)` 
            : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 80%)'
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
          {/* Instant Rich Generative Art Backdrop (Visible immediately before/offline) */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: activePalette
                ? `radial-gradient(ellipse at 65% 35%, ${getGradientColor(activePalette.primary, 0.35)} 0%, ${getGradientColor(activePalette.secondary, 0.2)} 40%, ${activePalette.background || '#09090b'} 100%)`
                : 'radial-gradient(ellipse at 50% 50%, #1e1b18 0%, #09090b 100%)'
            }}
          >
            {/* Subtle architectural grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          {currentFeature.image?.fullUrl && (
            <picture>
              {currentFeature.image.mobileUrl && (
                <source media="(max-width: 768px)" srcSet={currentFeature.image.mobileUrl} />
              )}
              {currentFeature.image.previewUrl && (
                <source media="(max-width: 1280px)" srcSet={currentFeature.image.previewUrl} />
              )}
              <img 
                src={currentFeature.image.fullUrl} 
                alt={currentFeature.image.alt || currentFeature.title} 
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className={clsx(
                  "w-full h-full object-cover select-none transition-opacity duration-700",
                  imageLoaded ? "opacity-100" : "opacity-0",
                  config.autoplay === 'cinematic' && "animate-[cinematic-pan_20s_linear_infinite_alternate]"
                )}
                style={{ 
                  objectPosition: 'center', 
                  willChange: 'transform, opacity' 
                }}
              />
            </picture>
          )}
          
          {/* Subtle gradient for text readability */}
          <div className={clsx(
            "absolute pointer-events-none transition-opacity duration-1000",
            config.captionPosition.includes('bottom') ? "inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" : "inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent",
            isTron ? "opacity-90" : "opacity-70"
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
            {config.captionPosition === 'top-left' && (
              <Caption feature={currentFeature} isTron={isTron} isInitial={isInitialRender.current} />
            )}
          </div>
        </div>

        {/* Bottom Area */}
        <div className="flex justify-between items-end w-full relative z-20 pointer-events-none">
          <div className="w-2/3 max-w-xl pointer-events-auto pl-2 pb-2">
            {config.captionPosition === 'bottom-left' && (
              <Caption feature={currentFeature} isTron={isTron} isInitial={isInitialRender.current} />
            )}
          </div>

          {/* Slide Indicator Dots & Counter */}
          <div className="flex items-center gap-3 pointer-events-auto pr-2 pb-2">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-mono">
              {String(currentIndex + 1).padStart(2, '0')} / {String(validFeatures.length).padStart(2, '0')}
            </div>
            <div className="flex items-center gap-1.5">
              {validFeatures.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDirection(i > currentIndex ? 1 : -1);
                    setCurrentIndex(i);
                  }}
                  className={clsx(
                    "h-1 rounded-full transition-all duration-300 cursor-pointer",
                    i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {config.captionPosition === 'bottom-right' && (
              <Caption feature={currentFeature} isTron={isTron} alignRight isInitial={isInitialRender.current} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Caption({ feature, isTron, alignRight, isInitial = false }: { feature: LandingFeature, isTron: boolean, alignRight?: boolean, isInitial?: boolean }) {
  return (
    <motion.div 
      initial={isInitial ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={feature.id} // Re-animate when post changes
      transition={{ duration: isInitial ? 0 : 0.6 }}
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
