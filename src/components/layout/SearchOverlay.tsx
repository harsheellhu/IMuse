import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Post, Book, Film, Collection } from '../../types';

export function SearchOverlay() {
  const { isSearchOpen, setSearchOpen, searchQuery, setSearchQuery, posts, books, films, collections, tvShows, places, openViewer } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{id: string, type: string, title: string, subtitle: string, image: string, data: any}[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;
      
      if (e.key === 'Escape') {
        setSearchOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          setSearchOpen(false);
          openViewer({ id: selected.id, type: selected.type as any, data: selected.data });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, results, selectedIndex, setSearchOpen, openViewer]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      
      const matchedPosts = posts.filter(p => 
        p.title?.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      ).map(p => ({
        id: p.id, type: 'post', title: p.title || 'Untitled', 
        subtitle: `${p.category || 'Visual'} · ${p.tags?.slice(0, 2).join(', ')}`,
        image: p.imageUrl || '', data: p
      }));

      const matchedBooks = books.filter(b => 
        b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query)
      ).map(b => ({
        id: b.id, type: 'book', title: b.title, subtitle: `Book by ${b.author}`, image: b.coverImage, data: b
      }));

      const matchedFilms = films.filter(f => 
        f.title.toLowerCase().includes(query) || f.director.toLowerCase().includes(query)
      ).map(f => ({
        id: f.id, type: 'film', title: f.title, subtitle: `Film by ${f.director}`, image: f.posterImage, data: f
      }));

      const matchedCollections = collections.filter(c => 
        c.title.toLowerCase().includes(query)
      ).map(c => ({
        id: c.id, type: 'collection', title: c.title, subtitle: `Collection · ${c.itemCount} items`, image: c.coverImage, data: c
      }));

      const matchedTvShows = tvShows.filter(t => 
        t.title.toLowerCase().includes(query) || t.creator?.toLowerCase().includes(query)
      ).map(t => ({
        id: t.id, type: 'tv_show', title: t.title, subtitle: `TV Show${t.creator ? ` by ${t.creator}` : ''}`, image: t.posterImage || (t as any).imageUrl || '', data: t
      }));

      const matchedPlaces = places.filter(p => 
        p.name?.toLowerCase().includes(query) || (p as any).title?.toLowerCase().includes(query) || p.location?.toLowerCase().includes(query)
      ).map(p => ({
        id: p.id, type: 'place', title: p.name || (p as any).title, subtitle: `Place${p.location ? ` in ${p.location}` : ''}`, image: p.coverImage || (p as any).imageUrl || '', data: p
      }));

      const allMatches = [...matchedPosts, ...matchedBooks, ...matchedFilms, ...matchedTvShows, ...matchedPlaces, ...matchedCollections].slice(0, 6);
      setResults(allMatches);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 400); // Simulate network/indexing delay for UX

    return () => clearTimeout(timer);
  }, [searchQuery, posts, books, films, collections, tvShows, places]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center pt-24 px-4 select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-bg-base/90 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl"
          >
            <div className="relative flex items-center">
              {isSearching ? (
                <Loader2 className="absolute left-6 w-6 h-6 text-text-muted animate-spin" />
              ) : (
                <Search className="absolute left-6 w-6 h-6 text-text-muted" />
              )}
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
                {!isSearching && results.length > 0 ? (
                  results.map((result, i) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => {
                        setSearchOpen(false);
                        openViewer({ id: result.id, type: result.type as any, data: result.data });
                      }}
                      className={clsx(
                        "flex items-center gap-4 p-4 transition-colors text-left border-b border-border-subtle/50 last:border-b-0",
                        selectedIndex === i ? "bg-bg-secondary" : "hover:bg-bg-secondary"
                      )}
                    >
                      <img src={result.image} alt="" className="w-12 h-16 object-cover rounded-sm" />
                      <div>
                        <p className="text-text-primary font-medium">{result.title}</p>
                        <p className="text-xs text-text-secondary capitalize">{result.subtitle}</p>
                      </div>
                    </button>
                  ))
                ) : !isSearching && results.length === 0 ? (
                  <div className="p-12 text-center text-text-muted font-light">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
                
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
