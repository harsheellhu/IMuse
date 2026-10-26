import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check, Sparkles, Filter } from 'lucide-react';
import { contentApi } from '../../api/content';
import { OptimizedImage } from './OptimizedImage';

interface ArtifactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (artifact: any) => void;
  title?: string;
  selectedIds?: string[];
}

export function ArtifactPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Artifact',
  selectedIds = []
}: ArtifactPickerModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && items.length === 0) {
      setIsLoading(true);
      contentApi.getAll(undefined, 250)
        .then(data => setItems(data || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, items.length]);

  const categories = ['All', 'Film', 'Literature', 'Visual', 'Travel', 'Architecture', 'Music', 'Concept'];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategory !== 'All') {
        const cat = item.category || (item.type === 'book' ? 'Literature' : item.type === 'film' ? 'Film' : item.type === 'place' ? 'Travel' : 'Visual');
        if (cat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const itemTitle = (item.title || item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const creator = (item.creator || item.author || item.director || '').toLowerCase();
        return itemTitle.includes(q) || desc.includes(q) || creator.includes(q);
      }

      return true;
    });
  }, [items, selectedCategory, search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[11500] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-bg-base/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-medium text-text-primary">{title}</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Choose an item from across your entire iMuse cultural archive
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Categories Bar */}
          <div className="p-4 border-b border-border-subtle/60 flex flex-col gap-3 bg-bg-secondary/30">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by title, author, director, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-bg-elevated border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-text-primary text-bg-base font-semibold shadow-xs'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="py-20 text-center text-text-muted text-xs">
                Loading cultural artifacts...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center text-text-muted font-serif italic text-sm">
                No artifacts match your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredItems.map(item => {
                  const img = item.imageUrl || item.image_url || item.coverImage;
                  const isAlreadySelected = selectedIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className={`group relative aspect-[4/3] rounded-xl overflow-hidden border transition-all cursor-pointer text-left ${
                        isAlreadySelected
                          ? 'border-accent-primary/60 ring-2 ring-accent-primary/20 opacity-80'
                          : 'border-border-subtle hover:border-text-secondary/60 hover:scale-[1.02] shadow-sm'
                      }`}
                    >
                      <OptimizedImage
                        src={img || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'}
                        alt={item.title || 'Artifact'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                        <span className="text-[11px] text-white font-medium line-clamp-1 leading-snug">{item.title}</span>
                        <span className="text-[9px] text-white/70 font-mono uppercase tracking-wider mt-0.5">
                          {item.category || item.type}
                        </span>
                      </div>
                      {isAlreadySelected && (
                        <div className="absolute top-2 right-2 bg-accent-primary text-white p-1 rounded-full shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
