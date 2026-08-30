import React from 'react';
import { Bookmark, Heart, MoreHorizontal, Plus } from 'lucide-react';
import { Post } from '../../types';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function PostCard({ post, className }: { key?: React.Key; post: Post; className?: string }) {
  const { users, savedPostIds, toggleSavePost, openViewer, isAuthenticated, setAuthModalOpen } = useStore();
  const creator = users.find(u => u.id === post.creatorId);
  const isSaved = savedPostIds.includes(post.id);
  const resolvedImg = post.imageUrl || (post as any).image_url || (post as any).coverImage || (post as any).posterImage;
  const [imgSrc, setImgSrc] = React.useState(resolvedImg);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const src = post.imageUrl || (post as any).image_url || (post as any).coverImage || (post as any).posterImage;
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [post.id, post.imageUrl]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      toggleSavePost(post.id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={clsx("group relative flex flex-col mb-12 break-inside-avoid cursor-pointer", className)}
      onClick={() => openViewer({ id: post.id, type: 'post', data: post })}
    >
      <div className="relative overflow-hidden bg-bg-secondary rounded-[var(--radius-base)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.01)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:group-hover:shadow-[0_12px_40px_rgba(255,255,255,0.03)] transition-shadow duration-500">
        
        {/* Loading Shimmer */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-bg-secondary animate-pulse" />
        )}
        
        {/* Broken Image Fallback */}
        {hasError && (
          <div className="w-full aspect-[4/5] bg-bg-secondary flex flex-col items-center justify-center p-6 text-center border border-border-subtle">
            <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
              <span className="text-text-muted text-xs font-serif italic">Missing</span>
            </div>
            <span className="text-xs text-text-secondary uppercase tracking-widest">{post.category || 'Visual'}</span>
          </div>
        )}

        {!hasError && (
          <img 
            src={imgSrc} 
            alt={post.title} 
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => { setHasError(true); setIsLoaded(true); }}
            className={clsx(
              "w-full h-auto object-cover transform transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015]",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            decoding="async"
          />
        )}
        
        {/* Minimal Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/20 transition-colors duration-500 flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-bg-elevated/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-text-primary border border-border-subtle shadow-sm pointer-events-auto">
              {post.category || 'Visual'}
            </div>
            <button 
              onClick={handleSave}
              className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-sm pointer-events-auto",
                isSaved ? "bg-text-primary text-bg-base border border-transparent" : "bg-bg-elevated/90 text-text-primary hover:bg-text-primary hover:text-bg-base border border-border-subtle"
              )}
            >
              {isSaved ? <Bookmark className="w-4 h-4" fill="currentColor" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-3 px-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500">
        <h3 className="font-serif text-base leading-snug tracking-tight text-text-primary group-hover:text-text-secondary transition-colors line-clamp-1">{post.title}</h3>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          {creator ? `by ${creator.name}` : (post.creatorId === 'discovery-bot' ? 'Discovery' : 'Curator')}
        </span>
      </div>
    </motion.div>
  );
}
