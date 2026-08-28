import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, LayoutGrid, Layout } from 'lucide-react';
import clsx from 'clsx';
import { contentApi } from '../api/content';

export function Collections() {
  const { collections, openViewer, isAuthenticated } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'moodboard'>('grid');
  const [publicCollections, setPublicCollections] = useState<any[]>([]);

  // For unauthenticated users, show some demo collections built from API content
  useEffect(() => {
    if (collections.length === 0) {
      contentApi.getAll(undefined, 100).then((data: any[]) => {
        // Create virtual collections from content categories
        const categories: Record<string, any[]> = {};
        data.forEach(item => {
          const cat = item.category || 'Visual';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(item);
        });

          const virtualCollections = Object.entries(categories)
            .filter(([_, items]) => items.length >= 3)
            .map(([cat, items]) => ({
              id: `virtual-${cat}`,
              title: cat === 'TV' ? 'TV Shows Collection' 
                : cat === 'Travel' ? 'Favorite Destinations'
                : cat === 'Lifestyle' ? 'Design Shops & Markets'
                : `${cat} Picks`,
              description: `A curated selection of ${items.length} ${cat.toLowerCase()} items.`,
              coverImage: items[0]?.imageUrl || 'https://picsum.photos/id/1015/800/600',
              creatorId: 'system',
              itemCount: items.length,
              followers: Math.floor(Math.random() * 500) + 50,
              isPrivate: false,
              tags: [cat.toLowerCase()],
              items: items // Store actual items for the virtual collection
            }));

          setPublicCollections(virtualCollections);
      }).catch(console.error);
    }
  }, [collections.length]);

  const displayCollections = collections.length > 0 ? collections : publicCollections;

  return (
    <div className="w-full">
      <div className="px-4 md:px-12 pt-12 pb-16 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6 text-text-primary">Collections</h1>
          
          <div className="flex bg-bg-secondary p-1 rounded-full items-center justify-center">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx(
                "px-6 py-2 rounded-full transition-all duration-300 text-[10px] tracking-widest uppercase font-medium flex items-center gap-2",
                viewMode === 'grid' ? "bg-background-elevated text-text-primary shadow-[0_2px_8px_var(--color-shadow)]" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <LayoutGrid className="w-3 h-3" /> Grid
            </button>
            <button 
              onClick={() => setViewMode('moodboard')}
              className={clsx(
                "px-6 py-2 rounded-full transition-all duration-300 text-[10px] tracking-widest uppercase font-medium flex items-center gap-2",
                viewMode === 'moodboard' ? "bg-background-elevated text-text-primary shadow-[0_2px_8px_var(--color-shadow)]" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Layout className="w-3 h-3" /> Canvas
            </button>
          </div>
        </motion.div>
      </div>

      <div className="px-4 md:px-12 pb-24">
        <AnimatePresence mode="wait">
          {viewMode === 'moodboard' ? (
            <motion.div 
              key="moodboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full h-[60vh] border border-border-subtle rounded-sm flex items-center justify-center bg-bg-base"
            >
              <div className="text-center">
                <Layout className="w-8 h-8 text-text-muted mx-auto mb-4" />
                <p className="text-[10px] tracking-widest uppercase text-text-secondary">Canvas Mode</p>
                <p className="text-text-secondary font-serif italic mt-2 text-sm">Drag and drop items to organize spatially.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-24"
            >
              {displayCollections.map((collection, i) => (
                <motion.div 
                  key={collection.id}
                  layoutId={`collection-card-${collection.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group cursor-pointer flex flex-col"
                  onClick={() => openViewer({ id: collection.id, type: 'collection', data: collection })}
                >
                  <motion.div 
                    layoutId={`collection-image-${collection.id}`}
                    className="relative aspect-[4/3] overflow-hidden mb-6 bg-surface shadow-[0_8px_30px_var(--color-shadow)] rounded-sm"
                  >
                    <img 
                      src={collection.coverImage} 
                      alt={collection.title}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                    
                    {collection.isPrivate && (
                      <div className="absolute top-4 left-4 bg-bg-elevated/90 backdrop-blur-md p-2 rounded-full">
                        <Lock className="w-3 h-3 text-text-primary" />
                      </div>
                    )}
                  </motion.div>
                  <motion.div layoutId={`collection-meta-${collection.id}`}>
                    <h3 className="font-serif text-2xl mb-2 text-text-primary">{collection.title}</h3>
                    <p className="text-[10px] tracking-widest uppercase text-text-secondary">{collection.itemCount} Items</p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
