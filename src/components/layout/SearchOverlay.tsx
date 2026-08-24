import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export function SearchOverlay() {
  const { isSearchOpen, setSearchOpen, searchQuery, setSearchQuery, posts } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  const results = searchQuery.trim() 
    ? posts.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center pt-24 px-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-bg-base/90 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          />

          {/* Search Container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-6 w-6 h-6 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, creators, tags..."
                className="w-full h-20 pl-16 pr-16 bg-bg-elevated border-b border-border-subtle text-xl md:text-2xl font-light text-text-primary placeholder:text-text-muted/60 shadow-2xl focus:outline-none rounded-t-2xl rounded-b-none transition-all"
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="absolute right-6 p-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Dropdown */}
            {searchQuery.trim() && (
              <div className="w-full bg-bg-elevated rounded-b-2xl shadow-2xl border border-t-0 border-border-subtle overflow-hidden flex flex-col">
                {results.length > 0 ? (
                  results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        setSearchOpen(false);
                        // Open viewer directly
                        useStore.getState().openViewer({ id: result.id, type: 'post', data: result });
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-bg-secondary transition-colors text-left border-b border-border-subtle/50 last:border-b-0"
                    >
                      <img src={result.imageUrl} alt="" className="w-12 h-16 object-cover rounded-sm" />
                      <div>
                        <p className="text-text-primary font-medium">{result.title}</p>
                        <p className="text-xs text-text-secondary capitalize">{result.category} &middot; {result.tags?.slice(0, 2).join(', ')}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-12 text-center text-text-muted font-light">
                    No results found for "{searchQuery}"
                  </div>
                )}
                
                {results.length > 0 && (
                  <button 
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/explore?q=${searchQuery}`);
                    }}
                    className="p-4 text-center text-xs tracking-widest uppercase text-text-secondary hover:text-text-primary transition-colors bg-bg-base/50"
                  >
                    View all results
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
