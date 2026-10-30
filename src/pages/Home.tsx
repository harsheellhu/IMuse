import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useLaunchTransitionStore } from '../store/useLaunchTransitionStore';
import clsx from 'clsx';
import { Post } from '../types';
import { PostCard } from '../components/feed/PostCard';

import { RouteSkeleton } from '../components/ui/RouteSkeleton';

export function Home() {
  const { posts } = useStore();
  const { homeLayout, feedDensity } = useSettingsStore();
  const isTransitioning = useLaunchTransitionStore(s => s.isTransitioning);
  const launchPhase = useLaunchTransitionStore(s => s.phase);
  const isLaunchStagger = isTransitioning && (launchPhase === 'revealing' || launchPhase === 'expanding');
  const [isLoading, setIsLoading] = React.useState(posts.length === 0);

  React.useEffect(() => {
    if (posts.length === 0) {
      setIsLoading(true);
      import('../api/content').then(({ contentApi }) => {
        contentApi.getAll('post', 50).then((data) => {
          useStore.setState({ posts: data as any });
        }).catch(console.error).finally(() => {
          setIsLoading(false);
        });
      }).catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [posts.length]);

  const displayPosts = posts.slice(0, 50); // Show up to 50 for the feed

  if (isLoading && displayPosts.length === 0) {
    return <RouteSkeleton />;
  }

  return (
    <div className={clsx(
      "w-full min-h-[calc(100vh-5rem)] pt-4 md:pt-8 px-6 md:px-12",
      `density-${feedDensity}` // Ensure density variables are picked up if applied globally or locally
    )}>
      
      {/* Concise Discovery Entry Point */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-bg-elevated/70 border border-border-subtle/60 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-medium text-text-primary">Atmosphere & Color Discovery</span>
            <p className="text-[11px] text-text-secondary">Search by mood, feeling, or perceptual color harmony across your cultural universe.</p>
          </div>
        </div>
        <Link
          to="/discovery"
          className="px-4 py-2 rounded-xl bg-bg-secondary hover:bg-bg-secondary-hover border border-border-subtle text-xs font-medium text-text-primary transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Open Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Dynamic Layout Engine */}
      <div className={clsx(
        "w-full max-w-[1600px] mx-auto pb-20",
        homeLayout === 'grid' && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[var(--grid-gap)]",
        homeLayout === 'masonry' && "columns-2 md:columns-3 lg:columns-4 gap-[var(--grid-gap)] space-y-[var(--grid-gap)]",
        homeLayout === 'gallery' && "flex flex-wrap justify-center gap-[var(--grid-gap)]",
        homeLayout === 'editorial' && "grid grid-cols-1 md:grid-cols-12 gap-[var(--grid-gap)]",
        homeLayout === 'magazine' && "grid grid-cols-1 md:grid-cols-3 gap-[var(--grid-gap)]",
        homeLayout === 'staggered' && "grid grid-cols-2 gap-[var(--grid-gap)]", // We can add staggered margin via child selectors
        homeLayout === 'minimal' && "flex flex-col items-center gap-[var(--grid-gap)] max-w-2xl mx-auto"
      )}>
        {displayPosts.map((post, i) => {
          // Custom spans for editorial layout
          const colSpan = homeLayout === 'editorial' 
            ? (i % 5 === 0 ? 'md:col-span-8' : i % 5 === 1 ? 'md:col-span-4' : 'md:col-span-4')
            : '';

          const card = (
            <PostCard 
              key={post.id} 
              post={post as any} 
              className={clsx(
                homeLayout === 'masonry' ? "!mb-[var(--grid-gap)]" : "!mb-0",
                homeLayout === 'gallery' ? "w-64 flex-grow" : "",
                homeLayout === 'editorial' ? colSpan : "",
                homeLayout === 'staggered' && i % 2 !== 0 ? "mt-12" : "",
                homeLayout === 'minimal' ? "w-full" : ""
              )}
            />
          );

          if (isLaunchStagger) {
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min(i * 0.035, 0.35)
                }}
                className={clsx(homeLayout === 'editorial' ? colSpan : undefined)}
              >
                {card}
              </motion.div>
            );
          }

          return card;
        })}
      </div>
    </div>
  );
}
