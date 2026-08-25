import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { contentApi } from '../api/content';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export function Shops() {
  const { openViewer } = useStore();
  const [shops, setShops] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Bookshop', 'Fashion', 'Market', 'Design'];

  useEffect(() => {
    contentApi.getAll(undefined, 100).then((data: any[]) => {
      setShops(data.filter(d => d.category === 'Lifestyle'));
    }).catch(console.error);
  }, []);

  const filtered = activeTab === 'All' 
    ? shops 
    : shops.filter(s => s.tags?.some((t: string) => t.toLowerCase() === activeTab.toLowerCase()));

  return (
    <div className="w-full">
      <div className="px-4 md:px-12 pt-12 pb-16 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingBag className="w-6 h-6 text-text-secondary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6 text-text-primary">Shops & Markets</h1>
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
          >
            {filtered.map((shop, i) => (
              <motion.div 
                key={shop.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group cursor-pointer flex flex-col"
                onClick={() => openViewer({ id: shop.id, type: 'post', data: shop })}
              >
                <div className="relative aspect-square overflow-hidden mb-5 bg-bg-secondary rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.01)] transform transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                  <img 
                    src={shop.imageUrl} 
                    alt={shop.title} 
                    className="w-full h-full object-cover transition-all duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
                  
                  <div className="absolute top-4 right-4 bg-bg-elevated/90 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <ExternalLink className="w-3.5 h-3.5 text-text-primary" />
                  </div>
                </div>
                
                <h3 className="font-serif text-lg leading-snug mb-1 text-text-primary group-hover:text-text-secondary transition-colors">{shop.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2 font-light">{shop.description}</p>
                <div className="flex gap-2 mt-2">
                  {shop.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="text-[9px] tracking-widest uppercase text-text-muted bg-bg-secondary px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-8 h-8 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-sm">No shops found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
