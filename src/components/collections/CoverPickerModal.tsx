import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';

interface CoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  currentCover: string;
  onSelectCover: (imageUrl: string) => void;
}

export function CoverPickerModal({ isOpen, onClose, items, currentCover, onSelectCover }: CoverPickerModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 sm:p-6 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-bg-base/85 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <div>
              <h3 className="font-serif text-lg font-medium text-text-primary">Select Collection Cover</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Choose an artwork from this collection's matching artifacts
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grid of candidate images */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="py-12 text-center text-text-muted font-serif italic text-sm">
                No matching artifacts available to choose a cover from.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item, idx) => {
                  const imgUrl = item.imageUrl || item.image_url || item.coverImage;
                  if (!imgUrl) return null;
                  const isSelected = currentCover === imgUrl;

                  return (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => {
                        onSelectCover(imgUrl);
                        onClose();
                      }}
                      className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'border-accent-primary ring-2 ring-accent-primary/30 shadow-lg scale-[1.02]' 
                          : 'border-transparent hover:border-border-subtle hover:scale-[1.01]'
                      }`}
                    >
                      <OptimizedImage
                        src={imgUrl}
                        alt={item.title || 'Artifact'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <span className="text-[11px] text-white font-medium line-clamp-1">{item.title}</span>
                      </div>
                      {isSelected && (
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
