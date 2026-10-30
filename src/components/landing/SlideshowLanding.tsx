import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStore } from '../../store/useStore';
import { useImagePalette } from '../../hooks/useImagePalette';
import { LandingFeature } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

export function SlideshowLanding({ 
  features,
  isLaunching = false,
  onFeatureChange
}: { 
  features: LandingFeature[];
  isLaunching?: boolean;
  onFeatureChange?: (feature: LandingFeature) => void;
}) {
  const { slideshowConfig, appearance } = useSettingsStore();
  const { isAuthenticated, setAuthModalOpen } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isTron = appearance === 'tron';
  const cachedUrls = useRef(new Set<string>());

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

  useEffect(() => {
    if (currentFeature && onFeatureChange) {
      onFeatureChange(currentFeature);
    }
  }, [currentFeature, onFeatureChange]);

  const handleImageLoad = useCallback((url?: string) => {
    if (url) cachedUrls.current.add(url);
    setImageLoaded(true);
  }, []);

  // Sync imageLoaded on index change without jarring white flashes
  useEffect(() => {
    const url = currentFeature?.image?.fullUrl;
    if (url && cachedUrls.current.has(url)) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [currentIndex, currentFeature]);
  
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

  const autoplayDelay = React.useMemo(() => {
    if (config.autoplay === 'fast') return 4000;
    if (config.autoplay === 'cinematic') return 12000;
    return 7000; // slow default
  }, [config.autoplay]);

  // Autoplay with synchronized rhythmic interval
  useEffect(() => {
    if (config.autoplay === 'off' || validFeatures.length <= 1) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % validFeatures.length);
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [config.autoplay, validFeatures.length, currentIndex, autoplayDelay]);

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
          initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80, scale: 0.985 }),
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80, scale: 0.985 })
        };
      case 'depth':
        return {
          initial: (dir: number) => ({ opacity: 0, scale: 1.08, filter: 'blur(8px)' }),
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          exit: (dir: number) => ({ opacity: 0, scale: 0.94, filter: 'blur(8px)' })
        };
      case 'dissolve':
        return {
          initial: { opacity: 0, filter: 'blur(16px)', scale: 1.02 },
          animate: { opacity: 1, filter: 'blur(0px)', scale: 1 },
          exit: { opacity: 0, filter: 'blur(16px)', scale: 0.98 }
        };
      case 'crossfade':
      case 'fade':
      default:
        return {
          initial: { opacity: 0, scale: 1.025 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.985 }
        };
    }
  };

  const transitionConfig = {
    duration: config.transition === 'dissolve' ? 1.3 : config.transition === 'fade' ? 0.9 : 1.0,
    ease: [0.16, 1, 0.3, 1]
  };

  if (!currentFeature) return null;

  return (
    <motion.div 
      animate={{
        scale: isLaunching ? 1.12 : 1,
        opacity: isLaunching ? 0.35 : 1,
        filter: isLaunching ? 'blur(6px)' : 'blur(0px)',
      }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-bg-base"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Morphing Ambient Aurora Layer with Cross-fade */}
      <AnimatePresence>
        <motion.div 
          key={currentFeature.id + '-ambient'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 mix-blend-screen pointer-events-none will-change-transform"
          style={{ 
            background: activePalette 
              ? `radial-gradient(circle at 50% 50%, ${getGradientColor(activePalette.primary, 0.45)} 0%, ${getGradientColor(activePalette.secondary, 0.2)} 50%, transparent 80%)` 
              : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 80%)'
          }}
        />
      </AnimatePresence>

      {/* Main Image Slideshow */}
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={currentFeature.id}
          custom={direction}
          variants={getVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitionConfig}
          className="absolute inset-0 w-full h-full cursor-default group bg-bg-base will-change-transform"
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
              <motion.img 
                key={currentFeature.id + '-img'}
                src={currentFeature.image.fullUrl} 
                alt={currentFeature.image.alt || currentFeature.title} 
                decoding="async"
                onLoad={() => handleImageLoad(currentFeature.image.fullUrl)}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
                initial={{ scale: 1.0, opacity: imageLoaded ? 1 : 0 }}
                animate={{ 
                  scale: 1.04, 
                  opacity: imageLoaded ? 1 : 0 
                }}
                transition={{ 
                  scale: { duration: (autoplayDelay / 1000) + 1, ease: 'easeOut' },
                  opacity: { duration: 0.6 }
                }}
                className="w-full h-full object-cover select-none pointer-events-none will-change-transform"
                style={{ objectPosition: 'center' }}
              />
            </picture>
          )}
          
          {/* Subtle gradient for text readability */}
          <div className={clsx(
            "absolute pointer-events-none transition-opacity duration-1000",
            config.captionPosition.includes('bottom') ? "inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent" : "inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent",
            isTron ? "opacity-90" : "opacity-75"
          )} />
        </motion.div>
      </AnimatePresence>

      {/* UI Overlay */}
      <motion.div 
        animate={{ 
          opacity: isLaunching ? 0 : 1,
          y: isLaunching ? 16 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-12 z-20"
      >
        {/* Invisible Click Zones for Desktop Navigation with Subtle Ambient Hover Arrows */}
        <div 
          onClick={goPrev} 
          className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer pointer-events-auto flex items-center justify-start pl-6 md:pl-12 group"
          aria-label="Previous image"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 pointer-events-none shadow-lg">
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
        <div 
          onClick={goNext} 
          className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer pointer-events-auto flex items-center justify-end pr-6 md:pr-12 group"
          aria-label="Next image"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none shadow-lg">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Top Area - Empty, handled by LandingPage overlay */}
        <div className="flex justify-between items-start w-full relative z-20 pointer-events-none">
          <div className="w-2/3 max-w-xl pointer-events-auto">
            {config.captionPosition === 'top-left' && (
              <Caption feature={currentFeature} isTron={isTron} />
            )}
          </div>
        </div>

        {/* Bottom Area */}
        <div className="flex justify-between items-end w-full relative z-20 pointer-events-none">
          <div className="w-2/3 max-w-xl pointer-events-auto pl-2 pb-2">
            {config.captionPosition === 'bottom-left' && (
              <Caption feature={currentFeature} isTron={isTron} />
            )}
          </div>

          {/* Slide Indicator Dots & Counter with Animated Progress Fill */}
          <div className="flex items-center gap-3 pointer-events-auto pr-2 pb-2">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-mono">
              {String(currentIndex + 1).padStart(2, '0')} / {String(validFeatures.length).padStart(2, '0')}
            </div>
            <div className="flex items-center gap-1.5">
              {validFeatures.map((_, i) => {
                const isActive = i === currentIndex;
                return (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDirection(i > currentIndex ? 1 : -1);
                      setCurrentIndex(i);
                    }}
                    className={clsx(
                      "h-1.5 rounded-full relative overflow-hidden transition-all duration-500 cursor-pointer",
                      isActive ? "w-8 bg-white/20" : "w-1.5 bg-white/30 hover:bg-white/60"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    {isActive && config.autoplay !== 'off' && (
                      <motion.div
                        key={`progress-${currentIndex}`}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: autoplayDelay / 1000, ease: 'linear' }}
                        className="absolute inset-y-0 left-0 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                      />
                    )}
                    {isActive && config.autoplay === 'off' && (
                      <div className="w-full h-full bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {config.captionPosition === 'bottom-right' && (
              <Caption feature={currentFeature} isTron={isTron} alignRight />
            )}
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

function Caption({ feature, isTron, alignRight }: { feature: LandingFeature; isTron: boolean; alignRight?: boolean }) {
  return (
    <div 
      className={clsx(
        "flex flex-col gap-1 md:gap-1.5", 
        alignRight ? "items-end text-right" : "items-start text-left"
      )}
    >
      <motion.div 
        key={`cat-${feature.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className={clsx(
          "text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium drop-shadow-md",
          isTron ? "text-cyan-400" : "text-white/90"
        )}
      >
        {feature.category || 'Visual'}
      </motion.div>
      
      <motion.h2 
        key={`title-${feature.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        className={clsx(
          "text-xl md:text-3xl font-light tracking-wide text-white drop-shadow-md mix-blend-normal",
          isTron && "text-cyan-50 drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]"
        )}
      >
        {feature.title}
      </motion.h2>
      
      {feature.description && (
        <motion.p 
          key={`desc-${feature.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className={clsx(
            "text-xs md:text-sm font-light line-clamp-2 max-w-sm drop-shadow-md mt-1 text-white/70",
            isTron && "text-cyan-100/70"
          )}
        >
          {feature.description}
        </motion.p>
      )}
    </div>
  );
}
