import React from 'react';
import { useStore } from '../store/useStore';
import { PostCard } from '../components/feed/PostCard';
import { motion } from 'motion/react';
import { Bookmark, Lock } from 'lucide-react';

export function Library() {
  const { savedPostIds, posts, isAuthenticated, setAuthModalOpen } = useStore();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-6">
          <Lock className="w-6 h-6 text-text-muted" />
        </div>
        <h1 className="text-3xl font-serif text-text-primary mb-3">Your Library is locked</h1>
        <p className="text-text-secondary max-w-sm mb-8 font-light">
          Sign in to view your saved inspirations, curated collections, and personal archive.
        </p>
        <button 
          onClick={() => setAuthModalOpen(true)}
          className="px-8 py-3 bg-text-primary text-bg-base text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
        >
          Sign In
        </button>
      </div>
    );
  }

  const savedPosts = posts.filter(p => savedPostIds.has(p.id));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-text-primary mb-4">Your Library</h1>
        <p className="text-text-secondary font-light">A personal archive of everything you've saved and curated.</p>
      </header>

      <div className="mb-10 flex gap-8 border-b border-border-subtle/50">
        <button className="pb-4 border-b border-text-primary text-text-primary font-medium text-sm transition-colors">Saved ({savedPosts.length})</button>
        <button className="pb-4 border-b border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors">Collections</button>
        <button className="pb-4 border-b border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors">History</button>
      </div>

      {savedPosts.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-6">
            <Bookmark className="w-6 h-6 text-text-muted" />
          </div>
          <h2 className="text-2xl font-serif text-text-primary mb-2">Nothing saved yet</h2>
          <p className="text-text-secondary font-light max-w-sm">
            Explore the world and start curating your own personal visual universe.
          </p>
        </motion.div>
      )}
    </div>
  );
}
