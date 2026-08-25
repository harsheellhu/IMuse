import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { collectionsApi } from '../../api/collections';

export function CreateCollectionModal() {
  const { isCreateCollectionOpen, setCreateCollectionOpen, createCollection } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateCollectionOpen) {
        setCreateCollectionOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateCollectionOpen, setCreateCollectionOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      const newCollection = await collectionsApi.create({ title, description, is_private: isPrivate });
      useStore.setState((state) => ({ collections: [newCollection, ...state.collections] }));
      setCreateCollectionOpen(false);
      setTitle('');
      setDescription('');
      setIsPrivate(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isCreateCollectionOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm"
            onClick={() => setCreateCollectionOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-bg-elevated border border-border-subtle shadow-2xl overflow-hidden p-8"
          >
            <button
              onClick={() => setCreateCollectionOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-serif tracking-tight text-text-primary mb-6">Create Collection</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-4 bg-bg-secondary border border-transparent focus:border-border-subtle focus:bg-bg-elevated text-sm text-text-primary outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-24 p-4 bg-bg-secondary border border-transparent focus:border-border-subtle focus:bg-bg-elevated text-sm text-text-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  id="private-collection"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="private-collection" className="text-sm text-text-primary">Keep this collection private</label>
              </div>

              <button
                type="submit"
                className="mt-6 w-full h-12 bg-text-primary text-bg-base flex items-center justify-center text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
