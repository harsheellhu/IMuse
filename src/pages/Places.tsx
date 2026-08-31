import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { contentApi } from '../api/content';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';
import clsx from 'clsx';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export function Places() {
  const { places, openViewer } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Europe', 'Asia', 'Nature', 'Historic'];

  useEffect(() => {
    if (places.length === 0) {
      contentApi.getAll('place', 100).then((data: any[]) => {
        useStore.setState({ places: data as any });
      }).catch(console.error);
    }
  }, [places.length]);

  const filtered = activeTab === 'All' 
    ? places 
    : places.filter(p => p.tags?.some((t: string) => t.toLowerCase() === activeTab.toLowerCase()));

  return (
    <div className="w-full">
      <div className="px-4 md:px-12 pt-12 pb-16 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-text-secondary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6 text-text-primary">Places</h1>
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            {filtered.map((place, i) => (
              <motion.div 
                key={place.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group cursor-pointer flex flex-col"
                onClick={() => openViewer({ id: place.id, type: 'place', data: place })}
              >
                <div className="relative aspect-[16/10] overflow-hidden mb-5 bg-surface rounded-sm shadow-[0_8px_30px_var(--color-shadow)] transform transition-transform duration-700 ease-out group-hover:-translate-y-1">
                  <OptimizedImage 
                    src={place.imageUrl || (place as any).image_url || place.coverImage || 'https://images.unsplash.com/photo-1555993539-1732b0258235'} 
                    alt={place.title} 
                    optimizeOptions={{ width: 800, quality: 85, format: 'webp' }}
                    fallbackText={place.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                    <Navigation className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-medium tracking-wide text-white">Explore</span>
                  </div>
                </div>
                
                <h3 className="font-serif text-xl leading-snug mb-1 text-text-primary group-hover:text-text-secondary transition-colors">{place.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2 font-light">{place.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="w-8 h-8 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-sm">No places found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
