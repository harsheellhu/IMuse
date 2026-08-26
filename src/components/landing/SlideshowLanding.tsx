import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStore } from '../../store/useStore';
import { useImagePalette } from '../../hooks/useImagePalette';
import { Post } from '../../types';
import { Bookmark, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export function SlideshowLanding({ posts }: { posts: Post[] }) {
  const { slideshowConfig, appearance } = useSettingsStore();
  const { openViewer, savedPostIds, toggleSavePost, isAuthenticated, setAuthModalOpen } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const isTron = appearance === 'tron';

  // Filter posts that have images
  const validPosts = React.useMemo(() => {
    let p = posts.filter(p => p.imageUrl);
    if (slideshowConfig.mode === 'shuffle') {
      // Create a stable shuffle for this session
      const shuffled = [...p];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return p;
  }, [posts, slideshowConfig.mode]);

  const currentPost = validPosts[currentIndex];
  
  // Preload images
  useEffect(() => {
    if (validPosts.length === 0) return;
    const nextIndex = (currentIndex + 1) % validPosts.length;
    const prevIndex = (currentIndex - 1 + validPosts.length) % validPosts.length;
    
    [validPosts[nextIndex], validPosts[prevIndex]].forEach(p => {
      if (p?.imageUrl) {
        const img = new Image();
        img.src = p.imageUrl;
      }
    });
  }, [currentIndex, validPosts]);

  // Autoplay
  useEffect(() => {
    if (slideshowConfig.autoplay === 'off' || validPosts.length <= 1) return;
    
    let delay = 7000; // slow
    if (slideshowConfig.autoplay === 'fast') delay = 4000;
    if (slideshowConfig.autoplay === 'cinematic') delay = 12000;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % validPosts.length);
    }, delay);

    return () => clearInterval(timer);
  }, [slideshowConfig.autoplay, validPosts.length, currentIndex]); // Reset timer on index change

  const goNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % validPosts.length);
  }, [validPosts.length]);

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + validPosts.length) % validPosts.length);
  }, [validPosts.length]);

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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPost) return;
    if (!isAuthenticated) setAuthModalOpen(true);
    else toggleSavePost(currentPost.id);
  };

  const isSaved = currentPost ? savedPostIds.includes(currentPost.id) : false;

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

  const { palette } = useImagePalette(currentPost?.imageUrl || null);

  if (!currentPost) return null;

  return (
    <div 
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-bg-base"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => openViewer({ id: currentPost.id, type: 'post', data: currentPost })}
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
          key={currentPost.id}
          custom={direction}
          variants={getVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitionConfig}
          className="absolute inset-0 w-full h-full cursor-pointer group"
        >
          <img 
            src={currentPost.imageUrl} 
            alt={currentPost.title} 
            className={clsx(
              "w-full h-full object-cover select-none",
              // Gentle continuous cinematic pan/zoom if cinematic autoplay is on
              slideshowConfig.autoplay === 'cinematic' && "animate-[cinematic-pan_20s_linear_infinite_alternate]"
            )}
            style={{ 
              objectPosition: 'center', 
              willChange: 'transform, opacity, filter'
            }}
          />
          
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
        
        {/* Top Area */}
        <div className="flex justify-between items-start w-full">
          {/* Caption if Top-Left */}
          <div className="w-2/3 max-w-xl pointer-events-auto">
            {slideshowConfig.captionPosition === 'top-left' && (
              <Caption post={currentPost} isTron={isTron} />
            )}
          </div>
          
          {/* Minimal App Navigation / Branding placeholder could go here if not handled by root nav */}
        </div>

        {/* Middle Nav Arrows (only visible on mouse move/hover in desktop) */}
        <div className="absolute inset-y-0 left-0 w-32 flex items-center justify-start px-6 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
          <button onClick={goPrev} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/40 hover:scale-110 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 w-32 flex items-center justify-end px-6 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
          <button onClick={goNext} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/40 hover:scale-110 transition-all">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Area */}
        <div className="flex justify-between items-end w-full relative">
          
          {/* Caption if Bottom-Left */}
          <div className="w-2/3 max-w-xl pointer-events-auto">
            {slideshowConfig.captionPosition === 'bottom-left' && (
              <Caption post={currentPost} isTron={isTron} />
            )}
          </div>

          {/* Spacer if caption is not bottom-left/right */}
          {slideshowConfig.captionPosition === 'top-left' && <div />}

          {/* Bottom Right Area: Save Button & Counter or Caption */}
          <div className="flex items-end gap-6 md:gap-12 pointer-events-auto">
            {slideshowConfig.captionPosition === 'bottom-right' && (
              <Caption post={currentPost} isTron={isTron} alignRight />
            )}

            <div className="flex flex-col items-end gap-4 pb-1">
              <button 
                onClick={handleSave}
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-lg",
                  isSaved 
                    ? "bg-white text-black border border-transparent" 
                    : "bg-black/30 text-white hover:bg-white hover:text-black border border-white/20"
                )}
              >
                {isSaved ? <Bookmark className="w-4 h-4" fill="currentColor" /> : <Plus className="w-4 h-4" />}
              </button>

              <div className={clsx(
                "text-meta tracking-[0.2em] px-3 py-1 rounded-full backdrop-blur-md border",
                isTron ? "bg-black/60 border-cyan-500/30 text-cyan-400 font-mono" : "bg-black/20 border-white/10 text-white/80"
              )}>
                {(currentIndex + 1).toString().padStart(2, '0')} <span className="opacity-50">/ {validPosts.length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Caption({ post, isTron, alignRight }: { post: Post, isTron: boolean, alignRight?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={post.id} // Re-animate when post changes
      transition={{ duration: 0.8, delay: 0.2 }}
      className={clsx("flex flex-col gap-2 md:gap-3", alignRight ? "items-end text-right" : "items-start text-left")}
    >
      <div className={clsx(
        "text-meta flex items-center gap-2 px-3 py-1.5 rounded-sm backdrop-blur-sm shadow-sm",
        isTron ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/30" : "bg-black/20 text-white/90 border border-white/10"
      )}>
        {post.category || 'Visual'} <span className="opacity-50 mx-1">/</span> {post.id.slice(0, 4).toUpperCase()}
      </div>
      
      <h2 className={clsx(
        "text-display text-white drop-shadow-xl line-clamp-2 mix-blend-normal",
        isTron && "text-cyan-50 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]"
      )}>
        {post.title}
      </h2>
      
      {post.description && (
        <p className={clsx(
          "text-body text-white/80 line-clamp-1 max-w-md drop-shadow-md",
          isTron && "text-cyan-100/70"
        )}>
          {post.description}
        </p>
      )}
    </motion.div>
  );
}
