/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unified Discovery Experience (Atmosphere Search + Color Search)
 * Provides an editorial workstation for cultural discovery across feeling,
 * descriptive atmosphere, and perceptual color harmony.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Palette, 
  Sparkles, 
  SlidersHorizontal, 
  Layers, 
  Film as FilmIcon, 
  BookOpen, 
  Tv as TvIcon, 
  MapPin, 
  Music as MusicIcon, 
  Bookmark, 
  Compass, 
  Upload, 
  X, 
  History, 
  RotateCcw, 
  Check, 
  ArrowRight,
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';

import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { musicDB } from '../utils/musicDB';
import { contentApi } from '../api/content';
import { collectionsApi } from '../api/collections';
import { OptimizedImage } from '../components/ui/OptimizedImage';

import { 
  ATMOSPHERE_DIMENSIONS, 
  ALL_CONCEPTS, 
  EDITORIAL_SEARCH_EXAMPLES, 
  AtmosphereConcept 
} from '../utils/atmosphereSearch';
import { 
  COLOR_FAMILIES, 
  isValidHex, 
  normalizeHex, 
  extractPaletteFromFile,
  ColorMatchMode 
} from '../utils/colorSearch';
import { 
  searchDiscovery, 
  normalizeCatalogItem, 
  UnifiedArtifact, 
  DiscoveryArtifactType, 
  DiscoverySearchResult,
  loadSearchHistory,
  saveSearchHistoryEntry,
  clearSearchHistory
} from '../utils/discoveryEngine';

const CATEGORY_TABS: { type: DiscoveryArtifactType | 'all'; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All Artifacts', icon: Layers },
  { type: 'post', label: 'Visuals', icon: Layers },
  { type: 'film', label: 'Cinema', icon: FilmIcon },
  { type: 'book', label: 'Books', icon: BookOpen },
  { type: 'tv_show', label: 'Television', icon: TvIcon },
  { type: 'place', label: 'Spaces', icon: MapPin },
  { type: 'song', label: 'Music', icon: MusicIcon },
  { type: 'collection', label: 'Collections', icon: Sparkles }
];

export function Discovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Store access
  const { 
    posts, books, films, tvShows, places, collections, 
    savedPostIds, toggleSavePost, openViewer, openSmartBuilder, openTrailEditor 
  } = useStore();
  const { typography } = useSettingsStore();

  // Search parameters from URL or defaults
  const initialQuery = searchParams.get('q') || searchParams.get('atmosphere') || '';
  const initialColors = searchParams.get('colors') ? searchParams.get('colors')!.split(',').filter(Boolean) : [];
  const initialMode = (searchParams.get('mode') as 'unified' | 'atmosphere' | 'color') || 'unified';

  // Primary Inputs
  const [activeMode, setActiveMode] = useState<'unified' | 'atmosphere' | 'color'>(initialMode);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors);
  
  // Color controls
  const [customHexInput, setCustomHexInput] = useState('');
  const [hexInputError, setHexInputError] = useState<string | null>(null);
  const [colorMatchMode, setColorMatchMode] = useState<ColorMatchMode>('any');
  const [colorThreshold, setColorThreshold] = useState(0.28);
  const [colorWeight, setColorWeight] = useState(0.5); // 0.0 atmo <-> 1.0 color
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<DiscoveryArtifactType | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'library'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'title'>('relevance');

  // UI state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState(loadSearchHistory());
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [localSongs, setLocalSongs] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load songs from IndexedDB
  useEffect(() => {
    musicDB.getAllSongs().then(setLocalSongs).catch(console.error);
  }, []);

  // Ensure catalog data is loaded if user arrives directly to /discovery
  useEffect(() => {
    const state = useStore.getState();
    const needsLoading = state.posts.length === 0 && state.books.length === 0 && state.films.length === 0;
    if (needsLoading) {
      setIsLoadingCatalog(true);
      Promise.allSettled([
        contentApi.getAll('post', 50),
        contentApi.getAll('book', 50),
        contentApi.getAll('film', 50),
        contentApi.getAll('tv_show', 50),
        contentApi.getAll('place', 50),
        collectionsApi.getAll()
      ]).then(() => {
        setIsLoadingCatalog(false);
      });
    }
  }, []);

  // Rotating placeholder cue (respects reduced motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setExampleIndex(prev => (prev + 1) % EDITORIAL_SEARCH_EXAMPLES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Sync state to URL without polluting push history
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedColors.length > 0) params.set('colors', selectedColors.join(','));
    if (activeMode !== 'unified') params.set('mode', activeMode);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedColors, activeMode, categoryFilter, setSearchParams]);

  // Construct Unified Catalog
  const unifiedCatalog = useMemo<UnifiedArtifact[]>(() => {
    const list: UnifiedArtifact[] = [];

    posts.forEach(p => list.push(normalizeCatalogItem(p, 'post', savedPostIds)));
    books.forEach(b => list.push(normalizeCatalogItem(b, 'book', savedPostIds)));
    films.forEach(f => list.push(normalizeCatalogItem(f, 'film', savedPostIds)));
    tvShows.forEach(t => list.push(normalizeCatalogItem(t, 'tv_show', savedPostIds)));
    places.forEach(p => list.push(normalizeCatalogItem(p, 'place', savedPostIds)));
    collections.forEach(c => list.push(normalizeCatalogItem(c, 'collection', savedPostIds)));
    localSongs.forEach(s => list.push(normalizeCatalogItem(s, 'song', savedPostIds)));

    return list;
  }, [posts, books, films, tvShows, places, collections, localSongs, savedPostIds]);

  // Run Discovery Search
  const searchResults = useMemo<DiscoverySearchResult[]>(() => {
    const effectiveQuery = activeMode === 'color' ? '' : searchQuery;
    const effectiveColors = activeMode === 'atmosphere' ? [] : selectedColors;

    return searchDiscovery(unifiedCatalog, {
      query: effectiveQuery,
      selectedConcepts,
      colors: effectiveColors,
      colorMatchMode,
      colorThreshold,
      colorWeight,
      category: categoryFilter,
      scope: scopeFilter,
      savedIds: savedPostIds,
      sortBy,
      limit: 100
    });
  }, [
    unifiedCatalog,
    activeMode,
    searchQuery,
    selectedConcepts,
    selectedColors,
    colorMatchMode,
    colorThreshold,
    colorWeight,
    categoryFilter,
    scopeFilter,
    savedPostIds,
    sortBy
  ]);

  // Save successful searches to history (debounced)
  useEffect(() => {
    if (!searchQuery.trim() && selectedConcepts.length === 0 && selectedColors.length === 0) return;
    const timer = setTimeout(() => {
      saveSearchHistoryEntry({
        query: searchQuery.trim(),
        selectedConcepts,
        colors: selectedColors
      });
      setHistoryList(loadSearchHistory());
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedConcepts, selectedColors]);

  // Handlers for concept chips
  const toggleConcept = (conceptId: string) => {
    setSelectedConcepts(prev => 
      prev.includes(conceptId) ? prev.filter(id => id !== conceptId) : [...prev, conceptId]
    );
  };

  // Color handlers
  const addColor = (hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    if (!selectedColors.includes(normalized)) {
      if (selectedColors.length >= 6) {
        setSelectedColors([...selectedColors.slice(1), normalized]);
      } else {
        setSelectedColors([...selectedColors, normalized]);
      }
    }
  };

  const removeColor = (hex: string) => {
    setSelectedColors(prev => prev.filter(c => c !== hex));
  };

  const handleCustomHexSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customHexInput.trim()) return;

    if (!isValidHex(customHexInput)) {
      setHexInputError('Please enter a valid 3 or 6 digit hex (e.g. #7B2D43)');
      return;
    }

    setHexInputError(null);
    addColor(customHexInput);
    setCustomHexInput('');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const extractedPalette = await extractPaletteFromFile(file);
      if (extractedPalette.length > 0) {
        setSelectedColors(extractedPalette.slice(0, 4));
        if (activeMode === 'atmosphere') {
          setActiveMode('unified');
        }
      }
    } catch (err) {
      console.error('Failed to extract palette from file:', err);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedConcepts([]);
    setSelectedColors([]);
    setCategoryFilter('all');
    setScopeFilter('all');
    setCustomHexInput('');
    setHexInputError(null);
  };

  const handleExploreSimilar = (item: UnifiedArtifact) => {
    // Populate discovery with this item's atmosphere and palette
    if (item.palette && item.palette.length > 0) {
      setSelectedColors(item.palette.slice(0, 3));
    }
    if (item.tags && item.tags.length > 0) {
      setSearchQuery(item.tags.slice(0, 2).join(' '));
    } else {
      setSearchQuery(item.title);
    }
    setActiveMode('unified');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateSmartCollection = () => {
    const rules: any[] = [];
    if (searchQuery.trim()) {
      rules.push({
        id: `r-${Date.now()}-1`,
        field: 'text',
        operator: 'contains',
        value: searchQuery.trim()
      });
    }
    if (selectedColors.length > 0) {
      rules.push({
        id: `r-${Date.now()}-2`,
        field: 'color',
        operator: 'contains',
        value: selectedColors[0]
      });
    }
    if (categoryFilter !== 'all') {
      rules.push({
        id: `r-${Date.now()}-3`,
        field: 'type',
        operator: 'equals',
        value: categoryFilter
      });
    }

    openSmartBuilder({
      id: '',
      title: searchQuery.trim() ? `Atmosphere: ${searchQuery.trim()}` : 'Aesthetic Spectrum',
      description: `Curated discovery results based on feeling and palette.`,
      coverImage: searchResults[0]?.artifact.image || '',
      itemCount: searchResults.length,
      isPrivate: false,
      type: 'smart',
      matchOperator: 'all',
      rules
    });
  };

  const handleCreateCulturalTrail = () => {
    if (searchResults.length === 0) return;
    const initialSteps = searchResults.slice(0, 5).map((r, i) => ({
      id: `ts-${Date.now()}-${i}`,
      contentId: r.artifact.id,
      stepOrder: i,
      annotation: r.reasons[0] || `Exploration step through ${r.artifact.title}`,
      connectionType: 'similar_atmosphere' as const,
      connectionText: r.reasons[0] || 'Atmospheric harmony',
      artifact: {
        id: r.artifact.id,
        title: r.artifact.title,
        imageUrl: r.artifact.image,
        type: r.artifact.type,
        category: r.artifact.category,
        creator: r.artifact.creator
      }
    }));

    openTrailEditor({
      title: searchQuery.trim() ? `Trail: ${searchQuery.trim()}` : 'Cultural Trail',
      description: `A path connecting artifacts through shared atmosphere and color.`,
      steps: initialSteps
    });
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || 
    selectedConcepts.length > 0 || 
    selectedColors.length > 0 || 
    categoryFilter !== 'all' || 
    scopeFilter !== 'all';

  return (
    <div className={`min-h-screen bg-bg-base text-text-primary pb-32 pt-28 px-6 md:px-12 typography-${typography}`}>
      {/* Editorial Header */}
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle/40 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.25em] uppercase font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              Editorial Studio
            </span>
            <span className="text-xs text-text-muted tracking-wider">Local-first Discovery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-text-primary">
            Atmosphere & Color Discovery
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-serif italic max-w-xl">
            “Your personal universe of things worth remembering — find artifacts when you recall their feeling or palette, even if you’ve forgotten their name.”
          </p>
        </div>

        {/* Discovery Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-bg-secondary border border-border-subtle/70 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveMode('unified')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${activeMode === 'unified' ? 'bg-bg-elevated text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
          >
            ✦ Unified
          </button>
          <button
            onClick={() => setActiveMode('atmosphere')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${activeMode === 'atmosphere' ? 'bg-bg-elevated text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Atmosphere
          </button>
          <button
            onClick={() => setActiveMode('color')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${activeMode === 'color' ? 'bg-bg-elevated text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Color Studio
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* ============================================================== */}
        {/* SECTION 1: ATMOSPHERE SEARCH (When in Unified or Atmosphere mode) */}
        {/* ============================================================== */}
        {(activeMode === 'unified' || activeMode === 'atmosphere') && (
          <section className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-primary" />
                <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary">
                  Atmosphere Query
                </h2>
              </div>

              {/* History Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors py-1 px-2.5 rounded-lg hover:bg-bg-secondary cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Recent</span>
                </button>

                <AnimatePresence>
                  {isHistoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute right-0 top-9 w-72 bg-bg-elevated border border-border-subtle rounded-xl shadow-xl z-40 p-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border-subtle/50 mb-1 text-[11px] text-text-muted">
                        <span>Search History</span>
                        {historyList.length > 0 && (
                          <button
                            onClick={() => {
                              clearSearchHistory();
                              setHistoryList([]);
                            }}
                            className="hover:text-text-primary transition-colors underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {historyList.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {historyList.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSearchQuery(item.query);
                                setSelectedConcepts(item.selectedConcepts || []);
                                if (item.colors && item.colors.length > 0) {
                                  setSelectedColors(item.colors);
                                }
                                setIsHistoryOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-bg-secondary transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <span className="truncate text-text-secondary group-hover:text-text-primary">
                                {item.query || 'Selected Palette'}
                              </span>
                              {item.colors && item.colors.length > 0 && (
                                <div className="flex gap-1 shrink-0 ml-2">
                                  {item.colors.slice(0, 3).map(c => (
                                    <span key={c} className="w-2.5 h-2.5 rounded-full border border-border-subtle" style={{ backgroundColor: c }} />
                                  ))}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="px-3 py-4 text-center text-xs text-text-muted italic">
                          No recent searches yet.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input Bar with Rotating Placeholder */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Try "${EDITORIAL_SEARCH_EXAMPLES[exampleIndex]}"`}
                className="w-full h-14 pl-12 pr-12 bg-bg-secondary border border-border-subtle rounded-xl text-base md:text-lg text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary/70 transition-all font-light"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selected Concept Chips */}
            {selectedConcepts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border-subtle/40">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium mr-1">
                  Active Dimensions:
                </span>
                {selectedConcepts.map(cId => {
                  const concept = ALL_CONCEPTS.find(c => c.id === cId);
                  if (!concept) return null;
                  return (
                    <span
                      key={cId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                    >
                      <span>{concept.label}</span>
                      <button
                        onClick={() => toggleConcept(cId)}
                        className="hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Atmosphere Dimensions Accordion / Concept Selector */}
            <div className="mt-5 pt-4 border-t border-border-subtle/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ATMOSPHERE_DIMENSIONS.map(group => (
                  <div key={group.dimension} className="space-y-2">
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted">
                      {group.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {group.concepts.map(concept => {
                        const isSelected = selectedConcepts.includes(concept.id);
                        return (
                          <button
                            key={concept.id}
                            onClick={() => toggleConcept(concept.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] tracking-wide transition-colors cursor-pointer ${isSelected ? 'bg-text-primary text-bg-base font-medium' : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary-hover'}`}
                          >
                            {concept.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: COLOR SEARCH (When in Unified or Color mode) */}
        {/* ============================================================== */}
        {(activeMode === 'unified' || activeMode === 'color') && (
          <section className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent-primary" />
                <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary">
                  Perceptual Color Studio
                </h2>
              </div>

              {/* Mode Toggles: ALL / ANY / SIMILARITY */}
              <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-lg border border-border-subtle/60 text-[11px]">
                <button
                  onClick={() => setColorMatchMode('any')}
                  className={`px-2.5 py-1 rounded-md tracking-wider uppercase transition-colors cursor-pointer ${colorMatchMode === 'any' ? 'bg-bg-elevated text-text-primary font-semibold shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                  title="Matches if any selected color appears in the artifact"
                >
                  Any Color
                </button>
                <button
                  onClick={() => setColorMatchMode('all')}
                  className={`px-2.5 py-1 rounded-md tracking-wider uppercase transition-colors cursor-pointer ${colorMatchMode === 'all' ? 'bg-bg-elevated text-text-primary font-semibold shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                  title="Requires all selected colors to appear in the artifact"
                >
                  All Colors
                </button>
                <button
                  onClick={() => setColorMatchMode('similarity')}
                  className={`px-2.5 py-1 rounded-md tracking-wider uppercase transition-colors cursor-pointer ${colorMatchMode === 'similarity' ? 'bg-bg-elevated text-text-primary font-semibold shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                  title="Evaluates overall harmonious palette similarity"
                >
                  Palette Harmony
                </button>
              </div>
            </div>

            {/* Selected Swatches Builder Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-bg-secondary/50 border border-border-subtle/50">
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted shrink-0">
                Target Palette:
              </span>

              {selectedColors.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedColors.map((hex) => (
                    <div
                      key={hex}
                      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle shadow-xs"
                    >
                      <span 
                        className="w-4 h-4 rounded-full border border-black/20 shadow-xs" 
                        style={{ backgroundColor: hex }} 
                      />
                      <span className="font-mono text-xs text-text-primary">{hex}</span>
                      <button
                        onClick={() => removeColor(hex)}
                        className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-0.5"
                        aria-label={`Remove ${hex}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSelectedColors([])}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors underline ml-2 cursor-pointer"
                  >
                    Clear swatches
                  </button>
                </div>
              ) : (
                <span className="text-xs text-text-muted italic">
                  No swatches selected. Choose curated families below, enter a hex code, or extract from an image.
                </span>
              )}
            </div>

            {/* Inputs & Actions: Native Picker, Hex Input, Image Dropper, Threshold Slider */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* 1. Hex Input & Native Picker */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-text-secondary font-medium">
                  Hex Code & Color Picker
                </label>
                <form onSubmit={handleCustomHexSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customHexInput}
                      onChange={(e) => {
                        setCustomHexInput(e.target.value);
                        setHexInputError(null);
                      }}
                      placeholder="#23395B"
                      className="w-full h-10 px-3 bg-bg-secondary border border-border-subtle rounded-lg text-sm font-mono text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <input
                    type="color"
                    onChange={(e) => addColor(e.target.value)}
                    className="w-10 h-10 p-1 bg-bg-secondary border border-border-subtle rounded-lg cursor-pointer"
                    title="Open Color Wheel"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-text-primary text-bg-base text-xs rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Add
                  </button>
                </form>
                {hexInputError && (
                  <p className="text-[11px] text-red-500 font-light mt-1">{hexInputError}</p>
                )}
              </div>

              {/* 2. Image Reference Dropper / Extractor */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-text-secondary font-medium">
                  Extract Palette from Reference Image
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex-1 h-10 px-4 rounded-lg bg-bg-secondary border border-border-subtle hover:bg-bg-secondary-hover text-xs text-text-secondary hover:text-text-primary flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Extracting...' : 'Upload Image File'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-[10px] text-text-muted">
                  Runs locally in browser canvas; no images leave your device.
                </p>
              </div>

              {/* 3. Similarity Threshold Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider text-text-secondary font-medium">
                    Perceptual Distance (ΔE)
                  </label>
                  <span className="text-xs font-mono text-text-muted">
                    {colorThreshold <= 0.18 ? 'Strict' : colorThreshold <= 0.32 ? 'Balanced' : 'Expansive'} ({colorThreshold.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.48"
                  step="0.02"
                  value={colorThreshold}
                  onChange={(e) => setColorThreshold(parseFloat(e.target.value))}
                  className="w-full accent-accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>Exact match</span>
                  <span>Harmonious shade</span>
                  <span>Loose spectrum</span>
                </div>
              </div>
            </div>

            {/* Curated Color Families Grid */}
            <div className="pt-4 border-t border-border-subtle/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.15em] text-text-muted font-medium">
                  Curated Aesthetic Palettes & Nuanced Shades
                </span>
                {activeFamilyId && (
                  <button
                    onClick={() => setActiveFamilyId(null)}
                    className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer"
                  >
                    Show all families
                  </button>
                )}
              </div>

              {/* Family Swatches */}
              <div className="flex flex-wrap gap-2">
                {COLOR_FAMILIES.map(family => {
                  const isActive = activeFamilyId === family.id;
                  return (
                    <button
                      key={family.id}
                      onClick={() => {
                        setActiveFamilyId(isActive ? null : family.id);
                        addColor(family.hex);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${isActive ? 'bg-bg-secondary border-text-primary' : 'bg-bg-elevated border-border-subtle/80 hover:border-text-primary/40'}`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: family.hex }} />
                      <span className="text-xs font-medium text-text-primary">{family.name.split('&')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-shades drawer when a family is active */}
              {activeFamilyId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-bg-secondary/40 rounded-xl border border-border-subtle/60 flex flex-wrap items-center gap-3"
                >
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                    {COLOR_FAMILIES.find(f => f.id === activeFamilyId)?.name} Shades:
                  </span>
                  {COLOR_FAMILIES.find(f => f.id === activeFamilyId)?.shades.map(shade => (
                    <button
                      key={shade.name}
                      onClick={() => addColor(shade.hex)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-elevated border border-border-subtle hover:border-text-primary text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: shade.hex }} />
                      <span>{shade.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 3: TUNABLE BALANCE SLIDER (When both are active) */}
        {/* ============================================================== */}
        {activeMode === 'unified' && searchQuery.trim() && selectedColors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-bg-elevated border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent-primary" />
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-text-primary">
                  Discovery Balance
                </h3>
              </div>
              <p className="text-xs text-text-secondary">
                Tune the ranking weight between atmospheric descriptive text and visual color palette.
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-80">
              <span className="text-xs font-medium text-text-muted shrink-0">Atmosphere</span>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={colorWeight}
                onChange={(e) => setColorWeight(parseFloat(e.target.value))}
                className="w-full accent-accent-primary cursor-pointer"
              />
              <span className="text-xs font-medium text-text-muted shrink-0">Color</span>
            </div>

            <div className="text-xs font-mono text-text-primary bg-bg-secondary px-3 py-1.5 rounded-lg border border-border-subtle self-start md:self-auto">
              {Math.round((1 - colorWeight) * 100)}% Atmosphere · {Math.round(colorWeight * 100)}% Color
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* SECTION 4: REFINEMENT CONTROLS & BATCH ACTIONS */}
        {/* ============================================================== */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/50 pb-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {CATEGORY_TABS.map(tab => {
              const isActive = categoryFilter === tab.type;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.type}
                  onClick={() => setCategoryFilter(tab.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs tracking-wide transition-colors shrink-0 cursor-pointer ${isActive ? 'bg-text-primary text-bg-base font-medium' : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary-hover'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scope, Sort, and Batch Studio Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Scope (All vs Library) */}
            <div className="flex items-center p-0.5 rounded-lg bg-bg-secondary border border-border-subtle text-xs">
              <button
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${scopeFilter === 'all' ? 'bg-bg-elevated text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'}`}
              >
                Catalog
              </button>
              <button
                onClick={() => setScopeFilter('library')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${scopeFilter === 'library' ? 'bg-bg-elevated text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'}`}
              >
                My Library
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 px-2.5 bg-bg-secondary border border-border-subtle rounded-lg text-xs text-text-secondary focus:outline-none focus:border-text-primary cursor-pointer"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="newest">Sort: Newest</option>
              <option value="title">Sort: Alphabetical</option>
            </select>

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Batch actions when results exist */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2 border-l border-border-subtle/50 pl-3">
                <button
                  onClick={handleCreateSmartCollection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-xs font-medium hover:bg-accent-primary/20 transition-colors cursor-pointer"
                  title="Save current search criteria as an auto-updating smart collection"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save as Smart Collection</span>
                </button>

                <button
                  onClick={handleCreateCulturalTrail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-primary border border-border-subtle text-xs font-medium hover:bg-bg-secondary-hover transition-colors cursor-pointer"
                  title="Form a curated trail through these artifacts"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Create Trail</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: ARTIFACT RESULTS GRID & EMPTY STATES */}
        {/* ============================================================== */}
        <div>
          {/* Results Summary Counter */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between mb-6 text-xs text-text-muted font-mono">
              <span>{searchResults.length} {searchResults.length === 1 ? 'artifact' : 'artifacts'} found</span>
              {searchResults.length > 0 && (
                <span>Ranked by perceptual & semantic resonance</span>
              )}
            </div>
          )}

          {/* Result Cards Grid */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((result) => {
                const { artifact, combinedScore, reasons, closestColor } = result;
                const isSaved = savedPostIds.includes(artifact.id);

                return (
                  <motion.div
                    key={artifact.id}
                    layoutId={`discovery-card-${artifact.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => openViewer({ id: artifact.id, type: artifact.type as any, data: artifact.rawData })}
                    className="group relative flex flex-col rounded-xl overflow-hidden bg-bg-elevated border border-border-subtle hover:border-text-primary/40 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer"
                  >
                    {/* Artwork Container */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-secondary">
                      {artifact.image ? (
                        <OptimizedImage
                          src={artifact.image}
                          alt={artifact.title}
                          optimizeOptions={{ width: 450, quality: 80, format: 'webp' }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                            {artifact.category}
                          </span>
                          <span className="font-serif text-lg line-clamp-2 text-text-primary">
                            {artifact.title}
                          </span>
                        </div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-semibold bg-bg-base/85 backdrop-blur-md text-text-primary border border-white/10 shadow-xs">
                          {artifact.category}
                        </span>

                        {/* Save to library quick button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSavePost(artifact.id);
                          }}
                          className={`p-1.5 rounded-full pointer-events-auto backdrop-blur-md transition-colors cursor-pointer ${isSaved ? 'bg-text-primary text-bg-base' : 'bg-bg-base/80 text-text-primary hover:bg-bg-base'}`}
                          title={isSaved ? 'Saved in Library' : 'Save to Library'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-bg-base' : ''}`} />
                        </button>
                      </div>

                      {/* Quick Action Hover Bar */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] text-white/90 tracking-wide font-medium">
                          Open Details ↗
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExploreSimilar(artifact);
                          }}
                          className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] tracking-wider uppercase font-medium backdrop-blur-md pointer-events-auto transition-colors cursor-pointer"
                        >
                          Explore Similar
                        </button>
                      </div>
                    </div>

                    {/* Card Content & Metadata */}
                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <h4 className="font-serif text-base font-normal tracking-tight text-text-primary line-clamp-1 group-hover:text-accent-primary transition-colors">
                          {artifact.title}
                        </h4>
                        {artifact.creator && (
                          <p className="text-xs text-text-secondary line-clamp-1 font-serif italic mt-0.5">
                            {artifact.creator}
                          </p>
                        )}
                      </div>

                      {/* Reasons & Palette Preview */}
                      <div className="mt-3 pt-3 border-t border-border-subtle/50 space-y-2">
                        {reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reasons.slice(0, 2).map((reason, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-bg-secondary text-text-secondary leading-tight truncate max-w-full"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Palette Swatches */}
                        {artifact.palette && artifact.palette.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {artifact.palette.slice(0, 4).map((c, i) => (
                              <span
                                key={i}
                                className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : !hasActiveFilters ? (
            /* ============================================================== */
            /* EMPTY STATE A: INITIAL INSPIRATION SPARKS */
            /* ============================================================== */
            <div className="py-16 px-6 text-center max-w-2xl mx-auto space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center mx-auto text-accent-primary">
                <Sparkles className="w-8 h-8 stroke-[1.25]" />
              </div>

              <div>
                <h3 className="text-2xl font-serif text-text-primary">
                  Begin Your Discovery
                </h3>
                <p className="text-sm text-text-secondary mt-2 font-light leading-relaxed">
                  Enter an atmosphere in natural language, pick a nuanced color palette, or choose one of the curated cultural sparks below:
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {EDITORIAL_SEARCH_EXAMPLES.slice(0, 8).map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      setSearchQuery(example);
                      setActiveMode('atmosphere');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-bg-elevated border border-border-subtle hover:border-text-primary text-xs text-text-secondary hover:text-text-primary transition-all shadow-xs cursor-pointer"
                  >
                    “{example}”
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* EMPTY STATE B: NO RESULTS MATCH FILTER */
            /* ============================================================== */
            <div className="py-20 px-6 text-center max-w-md mx-auto space-y-4">
              <p className="text-lg font-serif text-text-primary">
                No matching artifacts found
              </p>
              <p className="text-xs text-text-secondary font-light leading-relaxed">
                No cultural artifacts in your current catalog matched both the atmosphere "{searchQuery}" and the selected color palette.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {colorMatchMode === 'all' && (
                  <button
                    onClick={() => setColorMatchMode('any')}
                    className="px-4 py-2 rounded-lg bg-bg-secondary text-xs text-text-primary hover:bg-bg-secondary-hover border border-border-subtle transition-colors cursor-pointer"
                  >
                    Switch Color Mode to "Any Color"
                  </button>
                )}
                {colorThreshold < 0.35 && (
                  <button
                    onClick={() => setColorThreshold(0.38)}
                    className="px-4 py-2 rounded-lg bg-bg-secondary text-xs text-text-primary hover:bg-bg-secondary-hover border border-border-subtle transition-colors cursor-pointer"
                  >
                    Expand Color Similarity Threshold
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg bg-text-primary text-bg-base text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Discovery;
