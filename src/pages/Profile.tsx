import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MasonryFeed } from '../components/feed/MasonryFeed';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';
import clsx from 'clsx';
import { experiencesApi } from '../api/experiences';
import { Experience } from '../types';

const FALLBACK_USER = {
  id: 'u-demo',
  name: 'Demo Curator',
  username: 'demo',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  bio: 'Curating architecture, design, and visual culture.',
  followers: 248,
  following: 86
};

export function Profile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser, users, posts, collections, savedPostIds, openViewer } = useStore();
  const initialTab = searchParams.get('tab') || 'posts';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [patterns, setPatternsState] = useState<any[]>([]);

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  React.useEffect(() => {
    if (activeTab === 'experiences') {
      experiencesApi.getAll().then(setExperiences).catch(console.error);
    } else if (activeTab === 'patterns') {
      import('../api/activity').then(({ activityApi }) => {
        activityApi.getPatterns().then(setPatternsState).catch(console.error);
      });
    }
  }, [activeTab]);

  const profileId = (!id || id === 'me') ? (currentUser?.id || 'u-demo') : id;
  const user = users.find(u => u.id === profileId) || currentUser || FALLBACK_USER;
  const userPosts = posts.filter(p => p.creatorId === user?.id || !user?.id);

  const tabs = [
    { id: 'posts', label: 'Archive' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'collections', label: 'Collections' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'library', label: 'Library' },
    { id: 'likes', label: 'Likes' },
  ];

  return (
    <div className="w-full pt-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center px-4 mb-24"
      >
        <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-full overflow-hidden mb-8 shadow-sm">
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale transition-all duration-1000 hover:grayscale-0" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4">{user.name}</h1>
        <p className="text-sm text-gray-500 mb-8 max-w-md font-serif italic">{user.bio}</p>
        
        <div className="flex gap-8 text-[11px] uppercase tracking-widest mt-6">
          <div className="flex flex-col gap-1"><span className="font-medium text-text-primary">{user.followers}</span> <span className="text-text-secondary">followers</span></div>
          <div className="flex flex-col gap-1"><span className="font-medium text-text-primary">{user.following}</span> <span className="text-text-secondary">following</span></div>
          <div className="flex flex-col gap-1"><span className="font-medium text-text-primary">{userPosts.length}</span> <span className="text-text-secondary">items</span></div>
        </div>
        
        <div className="flex gap-4">
          <Link to="/replay" className="px-6 py-2 rounded-full border border-text-primary/20 text-xs tracking-widest uppercase font-medium hover:border-text-primary transition-colors flex items-center gap-2">
            Archive Replay
          </Link>
          <Link to="/color-memory" className="px-6 py-2 rounded-full border border-text-primary/20 text-xs tracking-widest uppercase font-medium hover:border-text-primary transition-colors flex items-center gap-2">
            Color Memory
          </Link>
          <Link to="/museum" className="px-6 py-2 rounded-full border border-text-primary/20 text-xs tracking-widest uppercase font-medium hover:border-text-primary transition-colors flex items-center gap-2">
            Museum
          </Link>
          <Link to="/dna" className="px-6 py-2 rounded-full border border-text-primary/20 text-xs tracking-widest uppercase font-medium hover:border-text-primary transition-colors flex items-center gap-2">
            Cultural DNA
          </Link>
          <button className="px-6 py-2 rounded-full border border-gray-200 text-xs tracking-widest uppercase font-medium hover:border-black transition-colors">
            Share
          </button>
          {user.id === currentUser.id ? (
            <button className="px-6 py-2 rounded-full bg-black text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors">
              Edit
            </button>
          ) : (
            <button className="px-6 py-2 rounded-full bg-black text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors">
              Follow
            </button>
          )}
        </div>
      </motion.div>

      <div className="flex justify-center gap-8 md:gap-16 overflow-x-auto scrollbar-hide px-4 mb-16">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "pb-2 text-[10px] uppercase tracking-widest transition-colors",
              activeTab === tab.id ? "text-text-primary border-b border-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <MasonryFeed posts={userPosts} />
            </motion.div>
          )}
          {activeTab === 'experiences' && (
            <motion.div
              key="experiences"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-12"
            >
              {experiences.map(exp => (
                <Link key={exp.id} to={`/experience/${exp.id}`} className="block group">
                  <div className="bg-bg-elevated/50 border border-border-subtle rounded-2xl p-6 transition-all duration-500 hover:border-text-primary/30 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-2xl text-text-primary mb-2 line-clamp-2">{exp.title}</h3>
                      <p className="text-sm text-text-secondary line-clamp-3 mb-6">{exp.description}</p>
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-widest border-t border-border-subtle/50 pt-4">
                      {exp.events?.length || 0} events
                    </div>
                  </div>
                </Link>
              ))}
              {experiences.length === 0 && (
                <div className="col-span-full py-20 text-center text-text-secondary italic font-serif">
                  No connected experiences found.
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'patterns' && (
            <motion.div
              key="patterns"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-12"
            >
              {patterns.map(pattern => {
                const PatternCard = React.lazy(() => import('../components/patterns/PatternCard').then(m => ({ default: m.PatternCard })));
                return (
                  <React.Suspense key={pattern.id} fallback={<div className="h-64 bg-bg-elevated/20 rounded-2xl animate-pulse" />}>
                    <PatternCard pattern={pattern} />
                  </React.Suspense>
                );
              })}
              {patterns.length === 0 && (
                <div className="col-span-full py-20 text-center text-text-secondary italic font-serif">
                  Not enough activity yet to discover patterns. Keep exploring!
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-12"
            >
              {collections.map(col => (
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
                    {col.isPrivate && (
                      <div className="absolute top-3 left-3 bg-bg-elevated/90 p-1.5 rounded-full">
                        <Lock className="w-3 h-3 text-text-primary" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl text-text-primary mb-1">{col.title}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-text-secondary">{col.itemCount || 0} items</p>
                </div>
              ))}
              {collections.length === 0 && (
                <div className="col-span-full py-20 text-center text-text-secondary italic font-serif">
                  No collections created yet.
                </div>
              )}
            </motion.div>
          )}
          {(activeTab === 'likes' || activeTab === 'library') && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <MasonryFeed posts={posts.filter(p => savedPostIds.includes(p.id))} />
            </motion.div>
          )}
          {activeTab !== 'posts' && activeTab !== 'experiences' && activeTab !== 'patterns' && activeTab !== 'collections' && activeTab !== 'likes' && activeTab !== 'library' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center py-32 text-gray-400 text-sm tracking-widest uppercase font-serif italic"
            >
              Nothing here yet.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
