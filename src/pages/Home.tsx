import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import clsx from 'clsx';
import { Post } from '../types';

export function Home() {
  const { posts } = useStore();
  const { homeLayout, feedDensity, landingStyle, appearance } = useSettingsStore();

  const displayPosts = posts.slice(0, 12); // Show first 12 for the feed

  // If landing style is very minimal or specific (like original) we might render a hero first
  const showHero = landingStyle === 'minimal' || landingStyle === 'observatory' || landingStyle === 'cosmic';

  return (
    <div className={clsx(
      "w-full min-h-[calc(100vh-5rem)] pt-20 px-6 md:px-12",
      `density-${feedDensity}` // Ensure density variables are picked up if applied globally or locally
    )}>
      
      {showHero && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-20 mb-12">
          <motion.h1 
            initial={{ opacity: 0, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, letterSpacing: '0.2em' }}
            transition={{ duration: 1 }}
            className="text-text-primary text-4xl md:text-6xl font-serif tracking-[0.2em] mb-6"
          >
            IMuse
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-text-secondary text-sm max-w-md tracking-[0.1em] leading-relaxed mb-8"
          >
            A curated collection of inspiration.
          </motion.p>
        </div>
      )}

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

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={clsx(
                "group cursor-pointer flex flex-col",
                homeLayout === 'masonry' ? "inline-block w-full break-inside-avoid" : "",
                homeLayout === 'gallery' ? "w-64 flex-grow" : "",
                homeLayout === 'editorial' ? colSpan : "",
                homeLayout === 'staggered' && i % 2 !== 0 ? "mt-12" : "",
                homeLayout === 'minimal' ? "w-full" : ""
              )}
            >
              <div className="relative w-full overflow-hidden bg-bg-secondary" style={{ borderRadius: 'var(--radius-base)' }}>
                {appearance === 'tron' && <div className="absolute inset-0 border border-cyan-400 opacity-50 z-10 pointer-events-none" />}
                <img 
                  src={(post as any).image || post.imageUrl || 'https://images.unsplash.com/photo-1600697395543-ef3ee6e9af7b'} 
                  alt={post.title}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ maxHeight: homeLayout === 'minimal' ? '600px' : '800px', filter: 'var(--img-filter, none)' }}
                  loading="lazy"
                />
              </div>
              
              <div className="pt-4 pb-2 px-1">
                <h3 className="text-text-primary font-medium text-sm md:text-base tracking-tight truncate">{post.title}</h3>
                <p className="text-text-muted text-xs mt-1">{(post as any).author || 'Curator'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
