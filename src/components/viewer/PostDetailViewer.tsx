import * as React from 'react';
import { useState, useEffect, type ReactNode, type ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Share2, Star, PlusCircle, Globe, MapPin, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useStore, ActiveViewerItem } from '../../store/useStore';
import { Post, Book, Film, Collection, TvShow, Place } from '../../types';
import { useImagePalette } from '../../hooks/useImagePalette';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ExperienceLogModal } from '../ui/ExperienceLogModal';
import { ConnectedExperienceTeaser } from './ConnectedExperienceTeaser';
import { contentApi } from '../../api/content';
import clsx from 'clsx';

interface ErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ViewerErrorBoundary extends (React.Component as any) {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Place/Post Viewer runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/95 backdrop-blur-md p-6 select-none">
          <div className="max-w-md w-full p-8 rounded-2xl bg-bg-elevated border border-border-subtle text-center shadow-2xl">
            <AlertCircle className="w-12 h-12 text-accent-primary mx-auto mb-4 opacity-80" />
            <h3 className="font-serif text-2xl mb-2 text-text-primary">Unable to display content</h3>
            <p className="text-sm text-text-secondary mb-6 font-light">
              An unexpected error occurred while rendering this view.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-5 py-2.5 rounded-full border border-border-subtle hover:border-text-primary text-xs uppercase tracking-widest text-text-primary transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                className="px-5 py-2.5 rounded-full bg-text-primary text-bg-base text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-all cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function PostDetailViewer() {
  const { activeViewerItem, closeViewer } = useStore();
  const [isLoadingUrlItem, setIsLoadingUrlItem] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);
  const [currentViewerParam, setCurrentViewerParam] = useState<string | null>(null);

  // Lock background body scroll
  useBodyScrollLock(true);

  // Sync with URL ?viewer= query parameter on mount and route/popstate changes
  useEffect(() => {
    const handleUrlSync = async () => {
      const params = new URLSearchParams(window.location.search);
      const viewerId = params.get('viewer');

      setCurrentViewerParam(viewerId);

      // If no viewer in URL, close viewer if open
      if (!viewerId) {
        if (activeViewerItem) {
          useStore.setState({ activeViewerItem: null });
        }
        setUrlFetchError(null);
        setIsLoadingUrlItem(false);
        return;
      }

      // If already matching the active item, nothing to do
      if (activeViewerItem && activeViewerItem.id === viewerId) {
        setUrlFetchError(null);
        setIsLoadingUrlItem(false);
        return;
      }

      // Look in existing store content first
      const state = useStore.getState();
      const allStoreItems: any[] = [
        ...state.places,
        ...state.posts,
        ...state.books,
        ...state.films,
        ...state.tvShows,
        ...state.collections
      ];
      const match = allStoreItems.find(item => item && item.id === viewerId);

      if (match) {
        const itemType = match.type || (match.itemCount !== undefined ? 'collection' : 'place');
        useStore.setState({
          activeViewerItem: {
            id: match.id,
            type: itemType,
            data: match
          }
        });
        setUrlFetchError(null);
        setIsLoadingUrlItem(false);
        return;
      }

      // If not in store, fetch from backend
      setIsLoadingUrlItem(true);
      setUrlFetchError(null);

      try {
        const fetched = await contentApi.getById(viewerId);
        if (fetched) {
          const itemType = (fetched as any).type || 'place';
          useStore.setState({
            activeViewerItem: {
              id: fetched.id,
              type: itemType,
              data: fetched as any
            }
          });
          setUrlFetchError(null);
        } else {
          setUrlFetchError('Place not found');
        }
      } catch (err: any) {
        console.error(`Failed to load viewer content for ID: ${viewerId}`, err);
        setUrlFetchError('Unable to open this place.');
      } finally {
        setIsLoadingUrlItem(false);
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeViewer();
        setUrlFetchError(null);
        setIsLoadingUrlItem(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeViewerItem?.id, closeViewer]);

  const handleClose = () => {
    closeViewer();
    setUrlFetchError(null);
    setIsLoadingUrlItem(false);
  };

  const handleRetry = async () => {
    if (!currentViewerParam) return;
    setIsLoadingUrlItem(true);
    setUrlFetchError(null);
    try {
      const fetched = await contentApi.getById(currentViewerParam);
      if (fetched) {
        useStore.setState({
          activeViewerItem: {
            id: fetched.id,
            type: (fetched as any).type || 'place',
            data: fetched as any
          }
        });
      } else {
        setUrlFetchError('Place not found');
      }
    } catch (err) {
      setUrlFetchError('Unable to open this place.');
    } finally {
      setIsLoadingUrlItem(false);
    }
  };

  // 1. Loading state view
  if (isLoadingUrlItem && !activeViewerItem) {
    return (
      <div className="fixed inset-0 z-[10000] flex flex-col justify-between bg-background select-none">
        <header className="relative z-[10000] w-full px-6 md:px-12 py-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg tracking-tight text-text-primary/90 font-medium">IMuse</span>
            <span className="text-text-muted/60 text-xs">/</span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-text-secondary font-medium">Loading</span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-text-primary/80 hover:text-text-primary bg-bg-elevated/40 hover:bg-bg-elevated/80 backdrop-blur-md border border-border-subtle/50 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-10 h-10 rounded-full border-2 border-text-primary/20 border-t-text-primary animate-spin" />
          <span className="text-xs uppercase tracking-[0.25em] text-text-secondary font-medium animate-pulse">
            Loading Place...
          </span>
        </main>

        <footer className="w-full px-6 md:px-12 py-4 flex items-center justify-between text-[11px] text-text-secondary/50 font-light pointer-events-none">
          <span>Press ESC to return</span>
          <span>IMuse Visual Universe</span>
        </footer>
      </div>
    );
  }

  // 2. Error state view
  if (urlFetchError && !activeViewerItem) {
    return (
      <div className="fixed inset-0 z-[10000] flex flex-col justify-between bg-background select-none">
        <header className="relative z-[10000] w-full px-6 md:px-12 py-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg tracking-tight text-text-primary/90 font-medium">IMuse</span>
            <span className="text-text-muted/60 text-xs">/</span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-text-secondary font-medium">Error</span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-text-primary/80 hover:text-text-primary bg-bg-elevated/40 hover:bg-bg-elevated/80 backdrop-blur-md border border-border-subtle/50 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl bg-bg-elevated/60 border border-border-subtle backdrop-blur-md shadow-xl">
            <MapPin className="w-10 h-10 text-text-secondary mx-auto mb-4 opacity-60" />
            <h3 className="font-serif text-2xl md:text-3xl mb-3 text-text-primary font-light">
              {urlFetchError}
            </h3>
            <p className="text-sm text-text-secondary mb-8 font-light leading-relaxed">
              The requested place could not be found or is currently unavailable.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-subtle hover:border-text-primary text-xs uppercase tracking-widest text-text-primary transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-bg-base text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Places</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full px-6 md:px-12 py-4 flex items-center justify-between text-[11px] text-text-secondary/50 font-light pointer-events-none">
          <span>Press ESC to return</span>
          <span>IMuse Visual Universe</span>
        </footer>
      </div>
    );
  }

  if (!activeViewerItem || activeViewerItem.type === 'collection') return null;

  return (
    <ViewerErrorBoundary onClose={handleClose}>
      <AnimatePresence>
        <ViewerContent item={activeViewerItem} onClose={handleClose} />
      </AnimatePresence>
    </ViewerErrorBoundary>
  );
}

function ViewerContent({ item, onClose }: { item: ActiveViewerItem; onClose: () => void }) {
  const { toggleSavePost, savedPostIds, isAuthenticated, setAuthModalOpen, expandToUniverse } = useStore();
  const [isExperienceModalOpen, setExperienceModalOpen] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const { data, type } = item;

  let imageUrl = '';
  let title = '';
  let description = '';
  let creatorInfo = '';
  let categoryOrMeta = '';
  let rating = 0;
  const isSaved = type === 'post' ? savedPostIds.includes(data?.id) : false;

  if (type === 'post') {
    const post = (data || {}) as Post;
    imageUrl = post.imageUrl || '';
    title = post.title || 'Untitled';
    description = post.description || (post.tags ? post.tags.join(' · ') : '');
    categoryOrMeta = post.category || 'Visual';
    creatorInfo = post.source ? `Source: ${post.source}` : '';
  } else if (type === 'book') {
    const book = (data || {}) as Book;
    imageUrl = book.coverImage || '';
    title = book.title || 'Untitled Book';
    description = book.description || '';
    creatorInfo = book.author ? `by ${book.author}` : '';
    categoryOrMeta = `${book.publicationYear ? `${book.publicationYear} · ` : ''}${book.categories ? book.categories.join(', ') : 'Book'}`;
    rating = book.averageRating || 0;
  } else if (type === 'film') {
    const film = (data || {}) as Film;
    imageUrl = film.posterImage || '';
    title = film.title || 'Untitled Film';
    description = film.synopsis || '';
    creatorInfo = film.director ? `Directed by ${film.director}` : '';
    categoryOrMeta = `${film.releaseYear || ''}${film.runtime ? ` · ${film.runtime} min` : ''}`;
    rating = film.averageRating || 0;
  } else if (type === 'collection') {
    const col = (data || {}) as Collection;
    imageUrl = col.coverImage || '';
    title = col.title || 'Curated Collection';
    description = col.description || '';
    creatorInfo = col.itemCount !== undefined ? `${col.itemCount} curated items` : '';
    categoryOrMeta = col.isPrivate ? 'Private Collection' : 'Curated Collection';
  } else if (type === 'tv_show') {
    const show = (data || {}) as any;
    imageUrl = show.imageUrl || show.posterImage || '';
    title = show.title || 'Untitled Show';
    description = show.description || show.synopsis || '';
    creatorInfo = show.creator ? `Created by ${show.creator}` : '';
    categoryOrMeta = show.tags ? show.tags.join(', ') : 'TV Show';
    rating = show.averageRating || 0;
  } else if (type === 'place') {
    const place = (data || {}) as any;
    imageUrl = place.imageUrl || place.coverImage || '';
    title = place.title || place.name || 'Untitled Place';
    description = place.description || '';
    const loc = place.metadata?.location || place.location;
    const country = place.metadata?.country || place.country;
    creatorInfo = (loc && country) ? `${loc}, ${country}` : (loc || country || place.creator || '');
    categoryOrMeta = place.tags && Array.isArray(place.tags) ? place.tags.join(', ') : 'Place';
  }

  let aspectRatio = '4/5';
  if (type === 'book') aspectRatio = '2/3';
  if (type === 'film') aspectRatio = '2/3';
  if (type === 'tv_show') aspectRatio = '4/5';
  if (type === 'place') aspectRatio = '16/10';
  if (type === 'collection') aspectRatio = '4/3';

  const { palette } = useImagePalette(imageUrl && !imageError ? imageUrl : null);

  const getActionLabel = (itemType: string) => {
    switch (itemType) {
      case 'book': return 'Log Reading';
      case 'film':
      case 'tv_show': return 'Log Watch';
      case 'place': return 'Log Visit';
      default: return 'Add to My Experience';
    }
  };

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
        className="absolute inset-0 transition-colors duration-700 bg-background"
        onClick={onClose}
      />

      {/* Layer 2: Ambient Blur Bloom of Image */}
      {imageUrl && !imageError && (
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-normal dark:mix-blend-screen opacity-15 dark:opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
      )}

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
              background: `
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
        className="absolute inset-0 pointer-events-none bg-black/5 dark:bg-black/40"
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

        {/* Close Button */}
        <button
          type="button"
          aria-label="Close post"
          onClick={(e) => {
            e.stopPropagation();
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
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Visual (LEFT 60%) */}
          <div className="w-full lg:w-[60%] flex items-center justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[800px] max-h-[75vh] rounded-sm overflow-hidden shadow-[0_24px_60px_-12px_var(--shadow-color,rgba(0,0,0,0.25))] bg-surface flex items-center justify-center shrink-0"
              style={{ aspectRatio }}
            >
              {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3 text-text-muted">
                  <MapPin className="w-12 h-12 stroke-[1.2]" />
                  <span className="font-serif text-lg text-text-secondary">{title}</span>
                </div>
              )}
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
                    if (data?.id) {
                      expandToUniverse(data.id, data);
                    }
                  }}
                  className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-text-primary hover:opacity-75 transition-opacity cursor-pointer py-2 border border-text-primary/20 hover:border-text-primary px-4 rounded-full"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Expand This</span>
                </button>

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
                  <span>{getActionLabel(type)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (data?.id) {
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

              {/* Connected Experience Section (Optional & Non-blocking) */}
              {data?.id && <ConnectedExperienceTeaser contentId={data.id} />}
              
            </motion.div>
          </div>
        </div>
      </main>

      {/* Bottom Subtle Padding Bar */}
      <footer className="relative z-50 w-full px-6 md:px-12 py-4 flex items-center justify-between text-[11px] text-text-secondary/50 font-light pointer-events-none">
        <span>Press ESC to return</span>
        <span>IMuse Visual Universe</span>
      </footer>

      {/* Modals */}
      {data && (
        <ExperienceLogModal 
          isOpen={isExperienceModalOpen}
          onClose={() => setExperienceModalOpen(false)}
          content={data as any}
        />
      )}
    </motion.div>
  );
}
