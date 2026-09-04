import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, LayoutGrid, Layout } from 'lucide-react';
import clsx from 'clsx';
import { contentApi } from '../api/content';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export function Collections() {
  const { collections, openViewer, isAuthenticated } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'moodboard'>('grid');
  const [publicCollections, setPublicCollections] = useState<any[]>([]);
  const isDraggingCanvasRef = useRef(false);

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
            items: items
          }));

        setPublicCollections(virtualCollections);
      }).catch(console.error);
    }
  }, [collections.length]);

  const displayCollections = collections.length > 0 ? collections : publicCollections;

  return (
    <div className="w-full">
      <div className="px-4 md:px-12 pt-12 pb-16 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6 text-text-primary">Collections</h1>
          
          <div className="flex bg-bg-secondary p-1 rounded-full items-center justify-center">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx(
                "px-6 py-2 rounded-full transition-all duration-300 text-[10px] tracking-widest uppercase font-medium flex items-center gap-2 cursor-pointer",
                viewMode === 'grid' ? "bg-bg-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <LayoutGrid className="w-3 h-3" /> Grid
            </button>
            <button 
              onClick={() => setViewMode('moodboard')}
              className={clsx(
                "px-6 py-2 rounded-full transition-all duration-300 text-[10px] tracking-widest uppercase font-medium flex items-center gap-2 cursor-pointer",
                viewMode === 'moodboard' ? "bg-bg-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
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
              transition={{ duration: 0.4 }}
              className="relative w-full h-[70vh] border border-border-subtle rounded-2xl overflow-hidden bg-bg-base shadow-inner select-none cursor-grab active:cursor-grabbing"
              data-cursor="grab"
              style={{
                backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-bg-elevated/85 backdrop-blur-md px-4 py-2 rounded-full border border-border-subtle text-xs text-text-secondary shadow-sm">
                <Layout className="w-3.5 h-3.5 text-text-primary" />
                <span className="font-medium text-text-primary">Spatial Moodboard</span>
                <span className="opacity-40">·</span>
                <span>Drag to arrange</span>
              </div>

              <div className="relative w-full h-full flex items-center justify-center">
                {displayCollections.map((collection, idx) => {
                  const angle = (idx / (displayCollections.length || 1)) * 2 * Math.PI;
                  const radius = 220;
                  const defaultX = Math.cos(angle) * radius;
                  const defaultY = Math.sin(angle) * (radius * 0.7);

                  return (
                    <motion.div
                      key={collection.id}
                      drag
                      dragMomentum={false}
                      onDragStart={() => { isDraggingCanvasRef.current = true; }}
                      onDragEnd={() => { setTimeout(() => { isDraggingCanvasRef.current = false; }, 50); }}
                      whileHover={{ scale: 1.04, zIndex: 40 }}
                      whileDrag={{ scale: 1.08, zIndex: 50 }}
                      initial={{ x: defaultX, y: defaultY, opacity: 0 }}
                      animate={{ x: defaultX, y: defaultY, opacity: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className="absolute cursor-grab active:cursor-grabbing w-56 md:w-64 bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden shadow-xl"
                      onClick={() => {
                        if (!isDraggingCanvasRef.current) {
                          openViewer({ id: collection.id, type: 'collection', data: collection });
                        }
                      }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                        <OptimizedImage 
                          src={collection.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'} 
                          alt={collection.title}
                          optimizeOptions={{ width: 600, quality: 85, format: 'webp' }}
                          fallbackText={collection.title}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        {collection.isPrivate && (
                          <div className="absolute top-2.5 left-2.5 bg-bg-elevated/90 backdrop-blur-md p-1.5 rounded-full shadow-sm pointer-events-none">
                            <Lock className="w-3 h-3 text-text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <h4 className="font-serif text-base text-text-primary line-clamp-1">{collection.title}</h4>
                        <p className="text-[9px] uppercase tracking-widest text-text-secondary mt-0.5">{collection.itemCount || 0} curated items</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayCollections.map((collection, idx) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => openViewer({ id: collection.id, type: 'collection', data: collection })}
                  className="group flex flex-col bg-bg-elevated rounded-xl border border-border-subtle overflow-hidden cursor-pointer hover:border-text-secondary/50 shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                    <OptimizedImage 
                      src={collection.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'} 
                      alt={collection.title}
                      optimizeOptions={{ width: 800, quality: 85, format: 'webp' }}
                      fallbackText={collection.title}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                    {collection.isPrivate && (
                      <div className="absolute top-3 left-3 bg-bg-elevated/90 backdrop-blur-md p-1.5 rounded-full shadow-sm">
                        <Lock className="w-3.5 h-3.5 text-text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-serif text-xl font-medium tracking-tight text-text-primary group-hover:text-text-secondary transition-colors mb-1">{collection.title}</h3>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4">{collection.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle/50 pt-3 mt-auto">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted">{collection.itemCount || 0} items</span>
                      <span className="text-xs font-serif italic text-text-secondary group-hover:text-text-primary transition-colors">Explore →</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
