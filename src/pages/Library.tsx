import React from 'react';
import { useStore } from '../store/useStore';
import { PostCard } from '../components/feed/PostCard';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, Lock } from 'lucide-react';
import clsx from 'clsx';

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

  const [activeTab, setActiveTab] = React.useState<'saved' | 'collections' | 'history'>('saved');
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const { collections, openViewer } = useStore();

  React.useEffect(() => {
    if (activeTab === 'history') {
      import('../api/content').then(({ contentApi }) => {
        contentApi.getHistory().then(setHistoryItems).catch(console.error);
      });
    }
  }, [activeTab]);

  const savedPosts = posts.filter(p => savedPostIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-text-primary mb-4">Your Library</h1>
        <p className="text-text-secondary font-light">A personal archive of everything you've saved and curated.</p>
      </header>

      <div className="mb-10 flex gap-8 border-b border-border-subtle/50">
        <button 
          onClick={() => setActiveTab('saved')}
          className={clsx(
            "pb-4 font-medium text-sm transition-colors",
            activeTab === 'saved' ? "border-b-2 border-text-primary text-text-primary" : "text-text-secondary hover:text-text-primary"
          )}
        >
          Saved ({savedPosts.length})
        </button>
        <button 
          onClick={() => setActiveTab('collections')}
          className={clsx(
            "pb-4 font-medium text-sm transition-colors",
            activeTab === 'collections' ? "border-b-2 border-text-primary text-text-primary" : "text-text-secondary hover:text-text-primary"
          )}
        >
          Collections ({collections.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={clsx(
            "pb-4 font-medium text-sm transition-colors",
            activeTab === 'history' ? "border-b-2 border-text-primary text-text-primary" : "text-text-secondary hover:text-text-primary"
          )}
        >
          History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'saved' && (
          savedPosts.length > 0 ? (
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
                Explore the world and start curating your personal visual universe.
              </p>
            </motion.div>
          )
        )}

        {activeTab === 'collections' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((col) => (
              <div 
                key={col.id} 
                onClick={() => openViewer({ id: col.id, type: 'collection', data: col })}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-surface rounded-sm shadow-md">
                  <img 
                    src={col.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'} 
                    alt={col.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
                <h3 className="font-serif text-xl text-text-primary mb-1">{col.title}</h3>
                <p className="text-[10px] uppercase tracking-widest text-text-secondary">{col.itemCount || 0} items</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          historyItems.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {historyItems.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-text-secondary font-serif italic">
              No recent history recorded. Items you open in full viewer will be archived here.
            </div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
