import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, LayoutGrid, Layout, Columns, Sparkles, Sliders, 
  Layers, Plus, Compass, Copy, Trash2, SlidersHorizontal, 
  ArrowRight, Check, Search
} from 'lucide-react';
import clsx from 'clsx';
import { contentApi } from '../api/content';
import { Collection, Trail } from '../types';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { SmartRuleBuilderModal } from '../components/collections/SmartRuleBuilderModal';
import { CollectionInspector } from '../components/collections/CollectionInspector';
import { TrailViewer } from '../components/trails/TrailViewer';
import { TrailEditor } from '../components/trails/TrailEditor';

export function Collections() {
  const { 
    collections, 
    trails, 
    loadCollections, 
    loadTrails, 
    openViewer, 
    duplicateCollection, 
    deleteCollection,
    openTrailViewer,
    activeTrail,
    isTrailViewerOpen,
    closeTrailViewer,
    openTrailEditor,
    trailDraft,
    isTrailEditorOpen,
    closeTrailEditor,
    duplicateTrail,
    deleteTrail
  } = useStore();

  const [activeTab, setActiveTab] = useState<'all' | 'manual' | 'smart' | 'hybrid' | 'trails'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'moodboard'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [publicCollections, setPublicCollections] = useState<any[]>([]);
  const isDraggingCanvasRef = useRef(false);

  // Inspector and Builder Modal states
  const [inspectingCollection, setInspectingCollection] = useState<Collection | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load collections & trails on mount
  useEffect(() => {
    loadCollections();
    loadTrails();
  }, [loadCollections, loadTrails]);

  // For unauthenticated demo fallback
  useEffect(() => {
    if (collections.length === 0) {
      contentApi.getAll(undefined, 100).then((data: any[]) => {
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
            title: cat === 'TV' ? 'TV Shows Archive' 
              : cat === 'Travel' ? 'Destinations & Places'
              : cat === 'Film' ? 'Curated Cinema Universe'
              : cat === 'Literature' ? 'Personal Reading Shelf'
              : `${cat} Archive`,
            description: `A curated collection of ${items.length} ${cat.toLowerCase()} artifacts.`,
            coverImage: items[0]?.imageUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
            creatorId: 'system',
            itemCount: items.length,
            followers: Math.floor(Math.random() * 500) + 50,
            isPrivate: false,
            type: cat === 'Film' ? 'smart' : cat === 'Literature' ? 'hybrid' : 'manual',
            matchOperator: 'all',
            rules: cat === 'Film' ? [{ field: 'type', operator: 'equals', value: 'film' }] : [],
            tags: [cat.toLowerCase()],
            items: items
          }));

        setPublicCollections(virtualCollections);
      }).catch(console.error);
    }
  }, [collections.length]);

  const rawCollections = collections.length > 0 ? collections : publicCollections;

  // Filter collections by tab and search
  const filteredCollections = useMemo(() => {
    return rawCollections.filter(c => {
      // Tab filter
      const cType = c.type || 'manual';
      if (activeTab === 'manual' && cType !== 'manual') return false;
      if (activeTab === 'smart' && cType !== 'smart') return false;
      if (activeTab === 'hybrid' && cType !== 'hybrid') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (c.title || '').toLowerCase().includes(q);
        const descMatch = (c.description || '').toLowerCase().includes(q);
        return titleMatch || descMatch;
      }
      return true;
    });
  }, [rawCollections, activeTab, searchQuery]);

  // Filter trails
  const filteredTrails = useMemo(() => {
    return trails.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [trails, searchQuery]);

  const handleDuplicateCollection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await duplicateCollection(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDeleteCollection = async (id: string) => {
    await deleteCollection(id);
    setDeleteConfirmId(null);
  };

  const handleOpenInspector = (e: React.MouseEvent, c: Collection) => {
    e.stopPropagation();
    setInspectingCollection(c);
  };

  const handleEditRules = (c: Collection) => {
    setInspectingCollection(null);
    setEditingCollection(c);
    setIsBuilderOpen(true);
  };

  const handleOpenCreateModal = () => {
    if (activeTab === 'trails') {
      openTrailEditor(null);
    } else {
      setEditingCollection(null);
      setIsBuilderOpen(true);
    }
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'smart') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <Sparkles className="w-2.5 h-2.5" /> Smart
        </span>
      );
    }
    if (type === 'hybrid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Sliders className="w-2.5 h-2.5" /> Hybrid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <Layers className="w-2.5 h-2.5" /> Manual
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen">
      {/* Editorial Header */}
      <div className="px-4 md:px-12 pt-10 pb-8 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-2 text-text-primary">
            Curated Archives
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-lg mx-auto mb-6 font-light leading-relaxed">
            Personal collections and narrative journeys connecting your cultural universe
          </p>

          {/* Navigation Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full bg-bg-secondary border border-border-subtle max-w-fit mx-auto mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={clsx(
                "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                activeTab === 'all' ? "bg-bg-elevated text-text-primary shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
              )}
            >
              All ({rawCollections.length})
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={clsx(
                "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'manual' ? "bg-bg-elevated text-text-primary shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Layers className="w-3 h-3 text-blue-400" /> Manual
            </button>
            <button
              onClick={() => setActiveTab('smart')}
              className={clsx(
                "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'smart' ? "bg-bg-elevated text-text-primary shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Sparkles className="w-3 h-3 text-purple-400" /> Smart
            </button>
            <button
              onClick={() => setActiveTab('hybrid')}
              className={clsx(
                "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'hybrid' ? "bg-bg-elevated text-text-primary shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Sliders className="w-3 h-3 text-amber-400" /> Hybrid
            </button>
            <button
              onClick={() => setActiveTab('trails')}
              className={clsx(
                "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'trails' ? "bg-bg-elevated text-accent-primary shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Compass className="w-3 h-3 text-accent-primary" /> Cultural Trails ({trails.length})
            </button>
          </div>

          {/* Sub-bar: Search, Layout Switcher, and Create Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-4xl px-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'trails' ? 'trails' : 'collections'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-full bg-bg-secondary border border-border-subtle text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            {/* Layout Toggle (Only for collections) */}
            {activeTab !== 'trails' && (
              <div className="flex bg-bg-secondary p-1 rounded-full items-center">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    "px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                    viewMode === 'grid' ? "bg-bg-elevated text-text-primary shadow-xs" : "text-text-secondary hover:text-text-primary"
                  )}
                  title="Grid Layout"
                >
                  <LayoutGrid className="w-3 h-3" /> Grid
                </button>
                <button 
                  onClick={() => setViewMode('masonry')}
                  className={clsx(
                    "px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                    viewMode === 'masonry' ? "bg-bg-elevated text-text-primary shadow-xs" : "text-text-secondary hover:text-text-primary"
                  )}
                  title="Masonry Layout"
                >
                  <Columns className="w-3 h-3" /> Masonry
                </button>
                <button 
                  onClick={() => setViewMode('moodboard')}
                  className={clsx(
                    "px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                    viewMode === 'moodboard' ? "bg-bg-elevated text-text-primary shadow-xs" : "text-text-secondary hover:text-text-primary"
                  )}
                  title="Spatial Moodboard"
                >
                  <Layout className="w-3 h-3" /> Canvas
                </button>
              </div>
            )}

            {/* Create Action Button */}
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-1.5 rounded-full bg-text-primary text-bg-base text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {activeTab === 'trails' ? 'New Cultural Trail' : 'New Collection'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 md:px-12 pb-24">
        {/* Cultural Trails Tab */}
        {activeTab === 'trails' ? (
          <div>
            {filteredTrails.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border-subtle rounded-2xl max-w-md mx-auto p-8">
                <Compass className="w-12 h-12 text-accent-primary/60 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-medium text-text-primary mb-1">No Cultural Trails Yet</h3>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed font-light">
                  Cultural trails connect multiple artifacts into a meaningful chronological or thematic journey.
                </p>
                <button
                  type="button"
                  onClick={() => openTrailEditor(null)}
                  className="px-5 py-2 rounded-full bg-text-primary text-bg-base text-xs font-medium uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
                >
                  Create First Trail
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTrails.map((trail, idx) => (
                  <motion.div
                    key={trail.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => openTrailViewer(trail)}
                    className="group flex flex-col bg-bg-elevated rounded-2xl border border-border-subtle overflow-hidden cursor-pointer hover:border-text-secondary/50 shadow-sm hover:shadow-xl transition-all duration-500"
                  >
                    {/* Cover Art */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                      <OptimizedImage
                        src={trail.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26'}
                        alt={trail.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Trail Status Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono uppercase tracking-wider text-white border border-white/20 flex items-center gap-1">
                          <Compass className="w-3 h-3 text-accent-primary" /> {trail.theme || 'Journey'}
                        </span>
                        {trail.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-[8px] font-mono uppercase tracking-wider text-white font-bold">
                            Complete
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Controls */}
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-serif text-xl font-medium tracking-tight text-text-primary group-hover:text-accent-primary transition-colors mb-1.5 line-clamp-1">
                          {trail.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4 font-light">
                          {trail.description || 'An exploratory cultural journey.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border-subtle/50 pt-3 mt-auto">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                          {trail.stepCount || (trail.steps ? trail.steps.length : 0)} Steps
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTrailEditor(trail);
                            }}
                            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-bg-secondary transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-xs font-serif italic text-accent-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Walk Trail <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Collections Views (Grid, Masonry, Spatial Canvas) */
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
                  <span>Drag collections freely</span>
                </div>

                <div className="relative w-full h-full flex items-center justify-center">
                  {filteredCollections.map((collection, idx) => {
                    const angle = (idx / (filteredCollections.length || 1)) * 2 * Math.PI;
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
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                            {getTypeBadge(collection.type)}
                            {collection.isPrivate && (
                              <div className="bg-bg-elevated/90 backdrop-blur-md p-1 rounded-full shadow-sm">
                                <Lock className="w-2.5 h-2.5 text-text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3.5">
                          <h4 className="font-serif text-base text-text-primary line-clamp-1">{collection.title}</h4>
                          <p className="text-[9px] uppercase tracking-widest text-text-secondary mt-0.5">
                            {collection.itemCount || 0} items
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* Grid & Masonry Views */
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={clsx(
                  viewMode === 'masonry'
                    ? 'columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                )}
              >
                {filteredCollections.map((collection, idx) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => openViewer({ id: collection.id, type: 'collection', data: collection })}
                    className="group flex flex-col bg-bg-elevated rounded-2xl border border-border-subtle overflow-hidden cursor-pointer hover:border-text-secondary/50 shadow-sm hover:shadow-xl transition-all duration-500 break-inside-avoid"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                      <OptimizedImage 
                        src={collection.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'} 
                        alt={collection.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Badges on Top */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {getTypeBadge(collection.type)}
                        {collection.isPrivate && (
                          <div className="bg-bg-elevated/90 backdrop-blur-md p-1.5 rounded-full shadow-sm">
                            <Lock className="w-3 h-3 text-text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Quick Inspector Trigger Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenInspector(e, collection)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-bg-elevated/85 hover:bg-bg-elevated backdrop-blur-md border border-border-subtle text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
                        title="Open Collection Inspector"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-serif text-xl font-medium tracking-tight text-text-primary group-hover:text-text-secondary transition-colors mb-1 line-clamp-1">
                          {collection.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4 font-light">
                          {collection.description || 'A thoughtfully organized cultural archive.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border-subtle/50 pt-3 mt-auto">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                          {collection.itemCount || 0} Items
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Duplicate Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDuplicateCollection(e, collection.id)}
                            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                            title="Duplicate Collection"
                          >
                            {copiedId === collection.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Inspector Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenInspector(e, collection)}
                            className="text-xs font-serif italic text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer ml-1"
                          >
                            Rules →
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Smart Collection Rule Builder Modal */}
      <SmartRuleBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingCollection(null);
        }}
        initialCollection={editingCollection}
      />

      {/* Collection Inspector Side Panel */}
      <CollectionInspector
        collection={inspectingCollection}
        isOpen={Boolean(inspectingCollection)}
        onClose={() => setInspectingCollection(null)}
        onEditRules={handleEditRules}
      />

      {/* Cultural Trail Viewer */}
      <TrailViewer
        trail={activeTrail}
        isOpen={isTrailViewerOpen}
        onClose={closeTrailViewer}
      />

      {/* Cultural Trail Editor */}
      <TrailEditor
        isOpen={isTrailEditorOpen}
        onClose={closeTrailEditor}
        trail={trailDraft}
      />
    </div>
  );
}
