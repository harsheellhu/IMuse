import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Share2, Star, PlusCircle } from 'lucide-react';
import { useStore, ActiveViewerItem } from '../../store/useStore';
import { Post, Book, Film, Collection, TvShow, Place } from '../../types';
import { useImagePalette } from '../../hooks/useImagePalette';
import { ExperienceLogModal } from '../ui/ExperienceLogModal';
import { ConnectedExperienceTeaser } from './ConnectedExperienceTeaser';
import clsx from 'clsx';

export function PostDetailViewer() {
  const { activeViewerItem, closeViewer, toggleSavePost, savedPostIds, isAuthenticated, setAuthModalOpen } = useStore();

  // Handle ESC key and History POP state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeViewerItem) {
        closeViewer();
      }
    };
    
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('viewer')) {
        useStore.getState().closeViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeViewerItem, closeViewer]);

  if (!activeViewerItem || activeViewerItem.type === 'collection') return null;

  return (
    <AnimatePresence>
      <ViewerContent item={activeViewerItem} onClose={closeViewer} />
    </AnimatePresence>
  );
}

function ViewerContent({ item, onClose }: { item: ActiveViewerItem; onClose: () => void }) {
  const { toggleSavePost, savedPostIds, isAuthenticated, setAuthModalOpen } = useStore();
  const [isExperienceModalOpen, setExperienceModalOpen] = React.useState(false);
  const { data, type } = item;

  let imageUrl = '';
  let title = '';
  let description = '';
  let creatorInfo = '';
  let categoryOrMeta = '';
  let rating = 0;
  const isSaved = type === 'post' ? savedPostIds.includes(data.id) : false;

  if (type === 'post') {
    const post = data as Post;
    imageUrl = post.imageUrl || '';
    title = post.title || 'Untitled';
    description = post.description || (post.tags ? post.tags.join(' · ') : '');
    categoryOrMeta = post.category || 'Visual';
    creatorInfo = post.source ? `Source: ${post.source}` : '';
  } else if (type === 'book') {
    const book = data as Book;
    imageUrl = book.coverImage;
    title = book.title;
    description = book.description || '';
    creatorInfo = `by ${book.author}`;
    categoryOrMeta = `${book.publicationYear ? `${book.publicationYear} · ` : ''}${book.categories ? book.categories.join(', ') : 'Book'}`;
    rating = book.averageRating;
  } else if (type === 'film') {
    const film = data as Film;
    imageUrl = film.posterImage;
    title = film.title;
    description = film.synopsis || '';
    creatorInfo = `Directed by ${film.director}`;
    categoryOrMeta = `${film.releaseYear} · ${film.runtime} min`;
    rating = film.averageRating;
  } else if (type === 'collection') {
    const col = data as Collection;
    imageUrl = col.coverImage || '';
    title = col.title;
    description = col.description || '';
    creatorInfo = `${col.itemCount} curated items`;
    categoryOrMeta = col.isPrivate ? 'Private Collection' : 'Curated Collection';
  } else if (type === 'tv_show') {
    // Note: The backend returns standard content fields + metadata for tv_shows
    const show = data as any;
    imageUrl = show.imageUrl || show.posterImage || '';
    title = show.title;
    description = show.description || show.synopsis || '';
    creatorInfo = show.creator ? `Created by ${show.creator}` : '';
    categoryOrMeta = show.tags ? show.tags.join(', ') : 'TV Show';
    rating = show.averageRating || 0;
  } else if (type === 'place') {
    const place = data as any;
    imageUrl = place.imageUrl || place.coverImage || '';
    title = place.title || place.name;
    description = place.description || '';
    const loc = place.metadata?.location || place.location;
    const country = place.metadata?.country || place.country;
    creatorInfo = (loc && country) ? `${loc}, ${country}` : (loc || country || '');
    categoryOrMeta = place.tags ? place.tags.join(', ') : 'Place';
  }

  let aspectRatio = '4/5';
  if (type === 'book') aspectRatio = '2/3';
  if (type === 'film') aspectRatio = '2/3';
  if (type === 'tv_show') aspectRatio = '4/5';
  if (type === 'place') aspectRatio = '16/10';
  if (type === 'collection') aspectRatio = '4/3';

  const { palette } = useImagePalette(imageUrl);
  const isDark = document.documentElement.classList.contains('dark');
  const isTron = document.documentElement.classList.contains('theme-tron');
  const baseBg = isTron ? '#010409' : (isDark ? '#080808' : '#FAF9F6');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[10000] flex flex-col justify-between select-none"
    >
      {/* Layer 1: Solid Theme Base */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ backgroundColor: baseBg }}
        onClick={onClose}
      />

      {/* Layer 1.5: TRON Grid if applicable */}
      {isTron && (
        <div className="absolute inset-0 texture-technical-grid pointer-events-none" />
      )}

      {/* Layer 2: Ambient Blur Bloom of Image */}
      <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-normal dark:mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 0.15 : 0.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(160px) saturate(100%)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Layer 3: Dynamic Palette Radial Mesh */}
      <AnimatePresence>
        {palette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen pointer-events-none"
            style={{
              background: isTron ? `
                radial-gradient(circle at 20% 25%, ${palette.primary}25, transparent 65%),
                radial-gradient(circle at 80% 75%, rgba(0, 255, 255, 0.15), transparent 75%),
                radial-gradient(circle at 50% 50%, ${palette.accent}20, transparent 70%)
              ` : `
                radial-gradient(circle at 20% 25%, ${palette.primary}50, transparent 55%),
                radial-gradient(circle at 80% 75%, ${palette.secondary}40, transparent 55%),
                radial-gradient(circle at 50% 50%, ${palette.accent}25, transparent 65%)
              `,
            }}
          />
        )}
      </AnimatePresence>

      {/* Layer 4: Ambient Tone & Vignette */}
      <div
        className={clsx(
          "absolute inset-0 pointer-events-none",
          isTron ? "bg-black/40" : "bg-black/5 dark:bg-black/40"
        )}
        onClick={onClose}
      />

      {/* Top Bar Header */}
      <header className="relative z-[10000] w-full px-6 md:px-12 py-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg tracking-tight text-text-primary/90 font-medium">
            IMuse
          </span>
          <span className="text-text-muted/60 text-xs">/</span>
          <span className="text-[11px] tracking-[0.2em] uppercase text-text-secondary font-medium">
            {type}
          </span>
        </div>

        {/* Guaranteed Clear & Unobstructed Close Button */}
        <button
          type="button"
          aria-label="Close post"
          onClick={(e) => {
            e.stopPropagation();
            // Try to natively go back to preserve history chain, fallback to closeViewer
            if (window.history.length > 1) {
              window.history.back();
            } else {
              onClose();
            }
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-text-primary/80 hover:text-text-primary bg-bg-elevated/40 hover:bg-bg-elevated/80 backdrop-blur-md border border-border-subtle/50 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 z-[10001] pointer-events-auto"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>
      </header>

      {/* Center Artwork & Editorial Content */}
      <main
        className="relative z-[10000] flex-1 w-full flex items-center justify-center px-6 md:px-12 py-4 overflow-y-auto overflow-x-hidden"
        onClick={onClose}
      >
        <div
          className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-16 w-full max-w-[1400px] my-auto pt-8 pb-12 lg:py-0"
          onClick={(e) => e.stopPropagation()} // Keep viewer open on inside click
        >
          {/* Main Visual (LEFT 60%) */}
          <div className="w-full lg:w-[60%] flex items-center justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[800px] max-h-[75vh] rounded-sm overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] bg-bg-surface flex items-center justify-center shrink-0"
              style={{ aspectRatio }}
            >
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </motion.div>
          </div>

          {/* Editorial Details (RIGHT 40%) */}
          <div className="w-full lg:w-[40%] flex items-center lg:justify-start">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col w-full max-w-[440px] text-left lg:max-h-[75vh] lg:overflow-y-auto scrollbar-hide pr-4"
            >
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-medium">
                  {categoryOrMeta}
                </span>
                {rating > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-text-primary font-medium">
                    <Star className="w-3 h-3 fill-text-primary text-text-primary" />
                    <span>{rating}</span>
                  </div>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light tracking-tight text-text-primary mb-3 leading-[1.15] shrink-0">
                {title}
              </h2>

              {creatorInfo && (
                <p className="text-base text-text-secondary font-serif italic mb-6 shrink-0">
                  {creatorInfo}
                </p>
              )}

              {description && (
                <p className="text-sm text-text-secondary/90 leading-relaxed font-light mb-8 max-w-sm shrink-0">
                  {description}
                </p>
              )}

              {/* Editorial Action Buttons */}
              <div className="flex flex-wrap items-center gap-6 mt-4 shrink-0 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      setAuthModalOpen(true);
                    } else {
                      setExperienceModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-text-primary hover:opacity-75 transition-opacity cursor-pointer py-2"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add to My Experience</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (type === 'post') {
                      if (!isAuthenticated) {
                        setAuthModalOpen(true);
                      } else {
                        toggleSavePost(data.id);
                      }
                    }
                  }}
                  className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-text-primary hover:opacity-75 transition-opacity cursor-pointer py-2"
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isSaved ? 'fill-text-primary' : ''}`}
                  />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-text-secondary hover:text-text-primary transition-colors cursor-pointer py-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Connected Experience Section */}
              <ConnectedExperienceTeaser contentId={data.id} />
              
            </motion.div>
          </div>
        </div>
      </main>

      {/* Bottom Subtle Padding Bar */}
      <footer className="relative z-[10000] w-full px-6 md:px-12 py-4 flex items-center justify-between text-[11px] text-text-secondary/50 font-light pointer-events-none">
        <span>Press ESC to return</span>
        <span>IMuse Visual Universe</span>
      </footer>

      {/* Modals */}
      <ExperienceLogModal 
        isOpen={isExperienceModalOpen}
        onClose={() => setExperienceModalOpen(false)}
        content={data as any}
      />
    </motion.div>
  );
}
