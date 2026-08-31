import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { contentApi } from '../api/content';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import { OptimizedImage } from '../components/ui/OptimizedImage';

export function Books() {
  const { books, savedPostIds, openViewer } = useStore();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Want to Read', 'Reading', 'Read', 'Favorites'];

  useEffect(() => {
    if (books.length === 0) {
      contentApi.getAll('book', 100).then((data: any[]) => {
        useStore.setState({ books: data as any });
      }).catch(console.error);
    }
  }, [books.length]);

  const filteredBooks = books.filter((book: any) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Favorites') return savedPostIds.includes(book.id) || (book.averageRating && book.averageRating >= 4.5);
    if (activeTab === 'Want to Read') return savedPostIds.includes(book.id) || book.metadata?.status === 'want_to_read';
    if (activeTab === 'Reading') return book.metadata?.status === 'reading' || book.tags?.includes('Reading');
    if (activeTab === 'Read') return book.metadata?.status === 'read' || !savedPostIds.includes(book.id);
    return true;
  });

  return (
    <div className="w-full">
      <div className="px-4 md:px-12 pt-12 pb-16 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-6 text-text-primary">Library</h1>
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
          {filteredBooks.length > 0 ? (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(5px)' }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-16"
            >
              {filteredBooks.map((book: any, i: number) => {
                const cover = book.coverImage || book.imageUrl || book.image_url;
                return (
                  <motion.div 
                    key={book.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: (i % 6) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => openViewer({ id: book.id, type: 'book', data: book })}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden mb-4 bg-surface rounded-sm shadow-[0_8px_30px_var(--color-shadow)] transform transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                      <OptimizedImage 
                        src={cover} 
                        alt={book.title} 
                        optimizeOptions={{ width: 600, quality: 85, format: 'webp' }}
                        fallbackText={book.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />
                    </div>
                    <h3 className="font-serif text-lg leading-snug text-text-primary group-hover:opacity-80 transition-opacity line-clamp-1">{book.title}</h3>
                    <p className="text-xs text-text-secondary font-sans mt-1 line-clamp-1">{book.author || 'Author'}</p>
                    <div className="flex items-center gap-1 mt-2 text-text-secondary text-xs">
                      <Star className="w-3 h-3 fill-current text-text-primary/70" />
                      <span>{book.averageRating ? book.averageRating.toFixed(1) : '4.5'}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <p className="font-serif text-xl text-text-secondary mb-3">No books currently in "{activeTab}"</p>
              <button 
                onClick={() => setActiveTab('All')}
                className="text-[10px] tracking-widest uppercase text-text-primary border-b border-text-primary pb-1"
              >
                View all books
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
