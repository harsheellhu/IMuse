import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Sliders, 
  Layers, Lock, Eye, Check, RefreshCw, Wand2, HelpCircle 
} from 'lucide-react';
import { Collection, CollectionType, CollectionMatchOperator, SmartRule } from '../../types';
import { useStore } from '../../store/useStore';
import { collectionsApi } from '../../api/collections';
import { 
  AVAILABLE_FIELDS, OPERATORS_BY_FIELD, SMART_RULE_TEMPLATES, 
  evaluateSmartRulesClient 
} from '../../utils/smartRules';
import { OptimizedImage } from '../ui/OptimizedImage';
import { CoverPickerModal } from './CoverPickerModal';

interface SmartRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCollection?: Collection | null;
}

export function SmartRuleBuilderModal({
  isOpen,
  onClose,
  initialCollection
}: SmartRuleBuilderModalProps) {
  const { createCollection, updateCollection, posts, books, films, places } = useStore();

  // Combine store artifacts for immediate client-side preview & offline evaluation
  const localArtifacts = useMemo(() => {
    return [
      ...posts.map(p => ({ ...p, type: p.type || 'post' })),
      ...books.map(b => ({ ...b, type: 'book', category: 'Literature' })),
      ...films.map(f => ({ ...f, type: 'film', category: 'Film' })),
      ...places.map(pl => ({ ...pl, type: 'place', category: 'Travel' }))
    ];
  }, [posts, books, films, places]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [type, setType] = useState<CollectionType>('smart');
  const [matchOperator, setMatchOperator] = useState<CollectionMatchOperator>('all');
  const [rules, setRules] = useState<SmartRule[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [layout, setLayout] = useState('grid');

  // Preview state
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCoverPickerOpen, setCoverPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      if (initialCollection) {
        setTitle(initialCollection.title || '');
        setDescription(initialCollection.description || '');
        setCoverImage(initialCollection.coverImage || '');
        setIsPrivate(Boolean(initialCollection.isPrivate));
        setType(initialCollection.type || 'smart');
        setMatchOperator(initialCollection.matchOperator || 'all');
        setRules(initialCollection.rules && initialCollection.rules.length > 0 
          ? initialCollection.rules 
          : [{ id: 'r0', field: 'type', operator: 'equals', value: 'film' }]
        );
        setPinnedIds(initialCollection.pinnedIds || []);
        setExcludedIds(initialCollection.excludedIds || []);
        setLayout(initialCollection.layout || 'grid');
      } else {
        // Defaults for new smart collection
        setTitle('');
        setDescription('');
        setCoverImage('');
        setIsPrivate(false);
        setType('smart');
        setMatchOperator('all');
        setRules([
          { id: 'r0', field: 'category', operator: 'equals', value: 'Film' }
        ]);
        setPinnedIds([]);
        setExcludedIds([]);
        setLayout('grid');
      }
    }
  }, [isOpen, initialCollection]);

  // Debounced live rule evaluation
  const runPreview = useCallback(async () => {
    if (type === 'manual') {
      setPreviewCount(pinnedIds.length);
      return;
    }

    setIsPreviewLoading(true);
    try {
      // 1. Try server preview
      const res = await collectionsApi.previewRules({
        rules,
        matchOperator,
        pinnedIds,
        excludedIds
      });
      setPreviewItems(res.items || []);
      setPreviewCount(res.matchCount || 0);

      // Auto-populate cover if empty and matching items found
      if (!coverImage && res.items?.[0]) {
        const firstImg = res.items[0].imageUrl || res.items[0].image_url;
        if (firstImg) setCoverImage(firstImg);
      }
    } catch (e) {
      // 2. Offline / zero-latency client fallback
      const evaluated = evaluateSmartRulesClient(
        localArtifacts,
        rules,
        matchOperator,
        pinnedIds,
        excludedIds
      );
      setPreviewItems(evaluated.slice(0, 50));
      setPreviewCount(evaluated.length);
      if (!coverImage && evaluated[0]?.imageUrl) {
        setCoverImage(evaluated[0].imageUrl);
      }
    } finally {
      setIsPreviewLoading(false);
    }
  }, [type, rules, matchOperator, pinnedIds, excludedIds, coverImage, localArtifacts]);

  useEffect(() => {
    const timer = setTimeout(runPreview, 250);
    return () => clearTimeout(timer);
  }, [runPreview]);

  // Handle template selection
  const handleApplyTemplate = (templateId: string) => {
    const template = SMART_RULE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    if (!title) setTitle(template.name);
    if (!description) setDescription(template.description);
    setMatchOperator(template.matchOperator);
    setRules(template.rules.map((r, idx) => ({ ...r, id: `r-${idx}-${Date.now()}` })));
  };

  // Rule management helpers
  const handleAddRule = () => {
    const newRule: SmartRule = {
      id: `r-${Date.now()}`,
      field: 'category',
      operator: 'equals',
      value: 'Visual'
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (index: number, updates: Partial<SmartRule>) => {
    setRules(prev => prev.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, ...updates };
      // When field changes, set default operator for that field
      if (updates.field && updates.field !== r.field) {
        const availableOps = OPERATORS_BY_FIELD[updates.field] || [];
        updated.operator = availableOps[0]?.value || 'equals';
        updated.value = '';
        updated.secondValue = undefined;
      }
      return updated;
    }));
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleMoveRule = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= rules.length) return;
    const reordered = [...rules];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setRules(reordered);
  };

  // Save collection
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const finalCover = coverImage || previewItems[0]?.imageUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f';

      if (initialCollection) {
        await updateCollection(initialCollection.id, {
          title: title.trim(),
          description: description.trim(),
          coverImage: finalCover,
          isPrivate,
          type,
          matchOperator,
          rules,
          pinnedIds,
          excludedIds,
          layout: layout as any
        });
      } else {
        await createCollection(title.trim(), description.trim(), isPrivate, {
          coverImage: finalCover,
          type,
          matchOperator,
          rules,
          pinnedIds,
          excludedIds,
          layout: layout as any
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save collection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[10200] flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-base/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-medium tracking-tight text-text-primary">
                    {initialCollection ? 'Edit Collection' : 'Create Smart Collection'}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Define automated rules or hybrid curation criteria
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with 2 Columns: Settings & Live Preview */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Left Column: Form & Conditions */}
              <div className="w-full md:w-7/12 p-6 border-b md:border-b-0 md:border-r border-border-subtle space-y-6 overflow-y-auto">
                {/* Collection Type Selector */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-2">
                    Collection Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('manual')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        type === 'manual'
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm'
                          : 'border-border-subtle text-text-secondary hover:border-text-secondary/40'
                      }`}
                    >
                      <Layers className="w-4 h-4 mb-1 text-blue-400" />
                      <div className="text-xs font-medium text-text-primary">Manual</div>
                      <div className="text-[9px] text-text-secondary leading-tight mt-0.5">User-curated items only</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('smart')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        type === 'smart'
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 shadow-sm'
                          : 'border-border-subtle text-text-secondary hover:border-text-secondary/40'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mb-1 text-purple-400" />
                      <div className="text-xs font-medium text-text-primary">Smart</div>
                      <div className="text-[9px] text-text-secondary leading-tight mt-0.5">Automated rule engine</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('hybrid')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        type === 'hybrid'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm'
                          : 'border-border-subtle text-text-secondary hover:border-text-secondary/40'
                      }`}
                    >
                      <Sliders className="w-4 h-4 mb-1 text-amber-400" />
                      <div className="text-xs font-medium text-text-primary">Hybrid</div>
                      <div className="text-[9px] text-text-secondary leading-tight mt-0.5">Rules + pins & exclusions</div>
                    </button>
                  </div>
                </div>

                {/* Templates Selector (Only for smart / hybrid) */}
                {type !== 'manual' && (
                  <div className="p-3.5 rounded-xl bg-bg-secondary/40 border border-border-subtle">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono flex items-center gap-1.5">
                        <Wand2 className="w-3 h-3 text-accent-primary" /> Starter Templates
                      </span>
                    </div>
                    <select
                      onChange={(e) => handleApplyTemplate(e.target.value)}
                      defaultValue=""
                      className="w-full h-9 px-3 bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-primary outline-none cursor-pointer focus:border-accent-primary transition-colors"
                    >
                      <option value="" disabled>Load a curated template...</option>
                      {SMART_RULE_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title & Description */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-1.5">
                      Collection Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Modern Cinema References"
                      required
                      className="w-full h-10 px-3.5 bg-bg-secondary border border-border-subtle/80 focus:border-accent-primary focus:bg-bg-elevated rounded-lg text-sm text-text-primary outline-none transition-all placeholder:text-text-muted"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Personal notes or purpose of this collection..."
                      rows={2}
                      className="w-full p-3 bg-bg-secondary border border-border-subtle/80 focus:border-accent-primary focus:bg-bg-elevated rounded-lg text-xs text-text-primary outline-none transition-all resize-none placeholder:text-text-muted"
                    />
                  </div>
                </div>

                {/* Rules Section (Only for Smart / Hybrid) */}
                {type !== 'manual' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">
                        Rule Conditions ({rules.length})
                      </label>

                      {/* AND / OR Match Operator Toggle */}
                      <div className="flex items-center gap-1 bg-bg-secondary p-0.5 rounded-lg border border-border-subtle">
                        <button
                          type="button"
                          onClick={() => setMatchOperator('all')}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                            matchOperator === 'all'
                              ? 'bg-accent-primary text-white shadow-xs font-bold'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          Match ALL (AND)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchOperator('any')}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                            matchOperator === 'any'
                              ? 'bg-accent-primary text-white shadow-xs font-bold'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          Match ANY (OR)
                        </button>
                      </div>
                    </div>

                    {/* Condition Rows */}
                    <div className="space-y-2.5">
                      {rules.map((rule, idx) => {
                        const availableOps = OPERATORS_BY_FIELD[rule.field] || [];

                        return (
                          <div
                            key={rule.id || idx}
                            className="p-3 rounded-xl bg-bg-secondary/50 border border-border-subtle flex flex-col gap-2 relative group"
                          >
                            <div className="flex items-center gap-2">
                              {/* Field Selector */}
                              <select
                                value={rule.field}
                                onChange={(e) => handleUpdateRule(idx, { field: e.target.value as any })}
                                className="h-8 px-2 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary outline-none focus:border-accent-primary cursor-pointer font-medium"
                              >
                                {AVAILABLE_FIELDS.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>

                              {/* Operator Selector */}
                              <select
                                value={rule.operator}
                                onChange={(e) => handleUpdateRule(idx, { operator: e.target.value as any })}
                                className="h-8 px-2 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-secondary outline-none focus:border-accent-primary cursor-pointer"
                              >
                                {availableOps.map(op => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>

                              {/* Reorder & Delete controls */}
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveRule(idx, 'up')}
                                  className="p-1 text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === rules.length - 1}
                                  onClick={() => handleMoveRule(idx, 'down')}
                                  className="p-1 text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRule(idx)}
                                  className="p-1 text-red-400/80 hover:text-red-400 cursor-pointer ml-1"
                                  title="Delete Condition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Value Input(s) */}
                            {rule.field !== 'saved' && rule.operator !== 'is_not_empty' && (
                              <div className="flex items-center gap-2 mt-1">
                                {rule.operator === 'between' ? (
                                  <>
                                    <input
                                      type="number"
                                      placeholder="Start Year (e.g. 2000)"
                                      value={rule.value || ''}
                                      onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                                      className="flex-1 h-8 px-2.5 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary outline-none focus:border-accent-primary"
                                    />
                                    <span className="text-text-secondary text-xs">to</span>
                                    <input
                                      type="number"
                                      placeholder="End Year (e.g. 2015)"
                                      value={rule.secondValue || ''}
                                      onChange={(e) => handleUpdateRule(idx, { secondValue: e.target.value })}
                                      className="flex-1 h-8 px-2.5 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary outline-none focus:border-accent-primary"
                                    />
                                  </>
                                ) : rule.field === 'category' ? (
                                  <select
                                    value={rule.value || 'Film'}
                                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                                    className="w-full h-8 px-2.5 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary outline-none focus:border-accent-primary cursor-pointer"
                                  >
                                    <option value="Film">Film</option>
                                    <option value="Literature">Literature</option>
                                    <option value="Visual">Visual</option>
                                    <option value="Travel">Travel / Place</option>
                                    <option value="Architecture">Architecture</option>
                                    <option value="Music">Music</option>
                                    <option value="Concept">Concept</option>
                                    <option value="TV">TV</option>
                                  </select>
                                ) : rule.field === 'type' ? (
                                  <select
                                    value={rule.value || 'film'}
                                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                                    className="w-full h-8 px-2.5 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary outline-none focus:border-accent-primary cursor-pointer"
                                  >
                                    <option value="film">film</option>
                                    <option value="book">book</option>
                                    <option value="place">place</option>
                                    <option value="post">post</option>
                                    <option value="music">music</option>
                                    <option value="tv_show">tv_show</option>
                                  </select>
                                ) : (
                                  <input
                                    type={rule.field === 'year' || rule.field === 'rating' ? 'number' : 'text'}
                                    step={rule.field === 'rating' ? '0.1' : undefined}
                                    placeholder={
                                      rule.field === 'year' ? 'e.g. 2000' :
                                      rule.field === 'color' ? 'e.g. blue, dark, monochrome, warm' :
                                      rule.field === 'creator' ? 'e.g. Christopher Nolan' :
                                      rule.field === 'tag' ? 'e.g. curated' : 'Enter match value...'
                                    }
                                    value={rule.value || ''}
                                    onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                                    className="w-full h-8 px-2.5 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary outline-none focus:border-accent-primary"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Condition Button */}
                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="w-full py-2 border border-dashed border-border-subtle hover:border-text-secondary text-text-secondary hover:text-text-primary text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Condition
                    </button>
                  </div>
                )}

                {/* Privacy Setting */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="smart-private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded text-accent-primary border-border-subtle cursor-pointer"
                  />
                  <label htmlFor="smart-private" className="text-xs text-text-primary cursor-pointer flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-text-secondary" /> Keep this collection private
                  </label>
                </div>
              </div>

              {/* Right Column: Live Results Preview */}
              <div className="w-full md:w-5/12 p-6 flex flex-col bg-bg-secondary/20">
                {/* Preview Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">
                      Live Preview
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                    previewCount > 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {previewCount} Matching Artifact{previewCount === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Selected Cover Thumbnail */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">Cover Artwork</span>
                    {previewItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCoverPickerOpen(true)}
                        className="text-[10px] text-accent-primary hover:underline cursor-pointer"
                      >
                        Choose from matches
                      </button>
                    )}
                  </div>
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-border-subtle bg-surface">
                    <OptimizedImage
                      src={coverImage || previewItems[0]?.imageUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Matching Items Preview Grid */}
                <div className="flex-1 overflow-y-auto min-h-[220px]">
                  {isPreviewLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-text-muted py-12">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-xs">Evaluating rule matches...</span>
                    </div>
                  ) : previewCount === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-subtle rounded-xl text-text-muted">
                      <HelpCircle className="w-8 h-8 mb-2 opacity-50 text-accent-primary" />
                      <h4 className="font-serif text-sm font-medium text-text-primary mb-1">No Matching Artifacts</h4>
                      <p className="text-xs leading-relaxed max-w-xs font-light">
                        {type === 'manual' 
                          ? 'This is a manual collection. Artifacts can be added directly from library or artifact viewer.'
                          : 'Try broadening your rule values, changing Match ALL to Match ANY, or selecting a starter template.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {previewItems.slice(0, 12).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border-subtle bg-surface group"
                        >
                          <OptimizedImage
                            src={item.imageUrl || item.image_url}
                            alt={item.title || 'Item'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-end">
                            <span className="text-[10px] text-white font-medium line-clamp-1">{item.title}</span>
                            <span className="text-[8px] text-white/70 font-mono uppercase tracking-wider">{item.category || item.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-bg-elevated">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-border-subtle hover:bg-bg-secondary text-xs uppercase tracking-wider font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving || !title.trim()}
                onClick={handleSave}
                className="px-6 py-2.5 rounded-full bg-text-primary text-bg-base text-xs uppercase tracking-wider font-medium hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {initialCollection ? 'Save Collection' : 'Create Collection'}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Cover Picker Modal */}
      <CoverPickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        items={previewItems}
        currentCover={coverImage}
        onSelectCover={(url) => setCoverImage(url)}
      />
    </>
  );
}
