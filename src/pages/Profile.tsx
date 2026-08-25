import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MasonryFeed } from '../components/feed/MasonryFeed';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export function Profile() {
  const { id } = useParams();
  const { currentUser, users, posts } = useStore();
  const [activeTab, setActiveTab] = useState('posts');

  const profileId = id === 'me' ? currentUser.id : id;
  const user = users.find(u => u.id === profileId) || currentUser;
  const userPosts = posts.filter(p => p.creatorId === user.id);

  const tabs = [
    { id: 'posts', label: 'Archive' },
    { id: 'collections', label: 'Collections' },
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
          {activeTab !== 'posts' && (
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
