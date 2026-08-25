import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { contentApi } from '../api/content';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, Play } from 'lucide-react';
import clsx from 'clsx';

export function TvShows() {
  const { tvShows, openViewer } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Drama', 'Sci-Fi', 'Crime', 'Comedy'];

  useEffect(() => {
    if (tvShows.length === 0) {
      contentApi.getAll('tv_show', 100).then((data: any[]) => {
        useStore.setState({ tvShows: data as any });
      }).catch(console.error);
    }
  }, [tvShows.length]);

  const filtered = activeTab === 'All' 
    ? tvShows 
    : tvShows.filter(s => s.tags?.some((t: string) => t.toLowerCase() === activeTab.toLowerCase()));

  return (
    <div className="w-full">
      <div className="px-4 md:px-12 pt-12 pb-16 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Tv className="w-6 h-6 text-text-secondary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6 text-text-primary">TV Shows</h1>
          <div className="flex justify-center gap-8 overflow-x-auto scrollbar-hide px-4">
            {tabs.map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "text-[10px] tracking-widest uppercase transition-all duration-300 pb-2 whitespace-nowrap",
                  activeTab === tab ? "text-text-primary border-b border-text-primary" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="px-4 md:px-12 pb-24">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, filter: 'blur(5px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(5px)' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16"
          >
            {filtered.map((show, i) => (
              <motion.div 
                key={show.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: (i % 5) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group cursor-pointer flex flex-col"
                onClick={() => openViewer({ id: show.id, type: 'tv_show', data: show })}
              >
                <div className="relative aspect-[4/5] overflow-hidden mb-5 bg-bg-secondary rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.01)] transform transition-transform duration-700 ease-out group-hover:-translate-y-1">
                  <img 
                    src={show.imageUrl} 
                    alt={show.title} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg-elevated/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <Play className="w-3 h-3 fill-text-primary text-text-primary" />
                    <span className="text-[10px] font-medium tracking-widest text-text-primary">View</span>
                  </div>
                </div>
                
                <h3 className="font-serif text-lg leading-snug mb-1 text-text-primary group-hover:text-text-secondary transition-colors">{show.title}</h3>
                <p className="text-[10px] tracking-widest uppercase text-text-secondary line-clamp-1">
                  {show.tags?.join(' · ')}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Tv className="w-8 h-8 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-sm">No shows found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
