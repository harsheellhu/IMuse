import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Sliders, Pin, Ban, Copy, Trash2, 
  Image as ImageIcon, LayoutGrid, Columns, BookOpen, Layers, 
  ExternalLink, Check
} from 'lucide-react';
import { Collection, CollectionLayout } from '../../types';
import { useStore } from '../../store/useStore';
import { OptimizedImage } from '../ui/OptimizedImage';
import { CoverPickerModal } from './CoverPickerModal';

interface CollectionInspectorProps {
  collection: Collection | null;
  isOpen: boolean;
  onClose: () => void;
  onEditRules: (col: Collection) => void;
  items?: any[];
}

export function CollectionInspector({
  collection,
  isOpen,
  onClose,
  onEditRules,
  items = []
}: CollectionInspectorProps) {
  const { updateCollection, duplicateCollection, deleteCollection, openViewer } = useStore();
  const [isCoverPickerOpen, setCoverPickerOpen] = useState(false);
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [duplicateSuccess, setDuplicateSuccess] = useState(false);

  if (!isOpen || !collection) return null;

  const type = collection.type || 'manual';
  const rules = collection.rules || [];
  const pinnedIds = collection.pinnedIds || [];
  const excludedIds = collection.excludedIds || [];
  const layout = collection.layout || 'grid';

  const handleLayoutChange = async (newLayout: CollectionLayout) => {
    await updateCollection(collection.id, { layout: newLayout });
  };

  const handleDuplicate = async () => {
    await duplicateCollection(collection.id);
    setDuplicateSuccess(true);
    setTimeout(() => setDuplicateSuccess(false), 2000);
  };

  const handleDelete = async () => {
    await deleteCollection(collection.id);
    setConfirmDeleteOpen(false);
    onClose();
  };

  const handleSelectCover = async (newCover: string) => {
    await updateCollection(collection.id, { coverImage: newCover });
  };

  const getTypeBadge = () => {
    if (type === 'smart') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <Sparkles className="w-3 h-3" /> Smart Collection
        </span>
      );
    }
    if (type === 'hybrid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Sliders className="w-3 h-3" /> Hybrid Collection
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
        <Layers className="w-3 h-3" /> Curated Collection
      </span>
    );
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[10500] flex justify-end select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-base/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md h-full bg-bg-elevated border-l border-border-subtle shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border-subtle flex items-start justify-between">
              <div className="flex flex-col gap-2">
                {getTypeBadge()}
                <h2 className="font-serif text-2xl font-medium tracking-tight text-text-primary line-clamp-1">
                  {collection.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cover Preview */}
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-border-subtle group bg-surface">
                <OptimizedImage
                  src={collection.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'}
                  alt={collection.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverPickerOpen(true)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-bg-elevated/90 hover:bg-bg-elevated backdrop-blur-md border border-border-subtle text-xs text-text-primary font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 shadow-md transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Change Cover
                </button>
              </div>

              {/* Description */}
              {collection.description && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-1.5">
                    Description
                  </label>
                  <p className="text-sm text-text-primary/90 leading-relaxed font-light">
                    {collection.description}
                  </p>
                </div>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-bg-secondary/60 border border-border-subtle text-center">
                <div>
                  <span className="block text-xl font-serif font-medium text-text-primary">
                    {collection.itemCount || 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary">Artifacts</span>
                </div>
                <div>
                  <span className="block text-xl font-serif font-medium text-text-primary">
                    {pinnedIds.length}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary">Pinned</span>
                </div>
                <div>
                  <span className="block text-xl font-serif font-medium text-text-primary">
                    {excludedIds.length}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary">Excluded</span>
                </div>
              </div>

              {/* Layout Preference */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-2">
                  Display Layout
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('grid')}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      layout === 'grid' 
                        ? 'bg-bg-primary text-text-primary border-text-primary/40 shadow-sm' 
                        : 'border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('masonry')}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      layout === 'masonry' 
                        ? 'bg-bg-primary text-text-primary border-text-primary/40 shadow-sm' 
                        : 'border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" /> Masonry
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('editorial')}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      layout === 'editorial' 
                        ? 'bg-bg-primary text-text-primary border-text-primary/40 shadow-sm' 
                        : 'border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Editorial
                  </button>
                </div>
              </div>

              {/* Active Smart Rules */}
              {(type === 'smart' || type === 'hybrid') && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">
                      Membership Logic ({collection.matchOperator === 'any' ? 'Match ANY' : 'Match ALL'})
                    </label>
                    <button
                      type="button"
                      onClick={() => onEditRules(collection)}
                      className="text-xs text-accent-primary hover:underline font-medium cursor-pointer"
                    >
                      Edit Rules
                    </button>
                  </div>

                  {rules.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No rules defined yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-secondary/40 border border-border-subtle text-xs"
                        >
                          <span className="font-mono text-[10px] text-accent-primary font-semibold uppercase">
                            {rule.field}
                          </span>
                          <span className="text-text-secondary">{rule.operator.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-text-primary ml-auto truncate max-w-[140px]">
                            {rule.value !== undefined ? String(rule.value) : ''}
                            {rule.secondValue !== undefined ? ` – ${rule.secondValue}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-4 border-t border-border-subtle flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => openViewer({ id: collection.id, type: 'collection', data: collection })}
                  className="w-full py-2.5 px-4 rounded-xl bg-text-primary text-bg-base font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Carousel Viewer
                </button>

                <button
                  type="button"
                  onClick={() => onEditRules(collection)}
                  className="w-full py-2.5 px-4 rounded-xl bg-bg-secondary hover:bg-bg-elevated border border-border-subtle text-text-primary text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" /> Edit Collection & Rules
                </button>

                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="w-full py-2.5 px-4 rounded-xl bg-bg-secondary hover:bg-bg-elevated border border-border-subtle text-text-primary text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {duplicateSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {duplicateSuccess ? 'Duplicated!' : 'Duplicate Collection'}
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="w-full py-2 px-4 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Collection
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Cover Picker Modal */}
      <CoverPickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        items={items}
        currentCover={collection.coverImage}
        onSelectCover={handleSelectCover}
      />

      {/* Confirmation Modal for Delete */}
      <AnimatePresence>
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-bg-elevated border border-border-subtle shadow-2xl text-center"
            >
              <h3 className="font-serif text-xl font-medium text-text-primary mb-2">Delete Collection?</h3>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                Are you sure you want to delete <span className="text-text-primary font-medium">"{collection.title}"</span>? 
                This action cannot be undone. Any artifacts contained within will remain safely in your library.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-4 py-2 rounded-full border border-border-subtle text-xs text-text-secondary hover:text-text-primary font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs uppercase tracking-wider font-medium shadow-md transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
