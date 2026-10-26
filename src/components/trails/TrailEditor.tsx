import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, ArrowUp, ArrowDown, Compass, 
  Sparkles, Check, ArrowRight, Layers, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { Trail, TrailStep, TrailConnectionType } from '../../types';
import { useStore } from '../../store/useStore';
import { ArtifactPickerModal } from '../ui/ArtifactPickerModal';
import { OptimizedImage } from '../ui/OptimizedImage';
import { CONNECTION_LABELS } from './TrailViewer';

interface TrailEditorProps {
  isOpen: boolean;
  onClose: () => void;
  trail?: Trail | Partial<Trail> | null;
}

export function TrailEditor({ isOpen, onClose, trail }: TrailEditorProps) {
  const { saveTrail } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [theme, setTheme] = useState('cinematic');
  const [status, setStatus] = useState<'draft' | 'completed'>('draft');
  const [steps, setSteps] = useState<any[]>([]);

  // Modals & dirty state
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [replacingStepIndex, setReplacingStepIndex] = useState<number | null>(null);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | null>(null);
  const [isWarnCloseOpen, setWarnCloseOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (trail) {
        setTitle(trail.title || '');
        setDescription(trail.description || '');
        setCoverImage(trail.coverImage || '');
        setTheme(trail.theme || 'cinematic');
        setStatus(trail.status || 'draft');
        setSteps(trail.steps && Array.isArray(trail.steps) ? [...trail.steps] : []);
      } else {
        setTitle('');
        setDescription('');
        setCoverImage('');
        setTheme('cinematic');
        setStatus('draft');
        setSteps([]);
      }
    }
  }, [isOpen, trail]);

  // Handle adding or replacing an artifact from the picker
  const handleArtifactSelected = (artifact: any) => {
    if (replacingStepIndex !== null) {
      // Replace existing step artifact
      setSteps(prev => prev.map((s, idx) => {
        if (idx !== replacingStepIndex) return s;
        return {
          ...s,
          contentId: artifact.id,
          artifact
        };
      }));
      setReplacingStepIndex(null);
      return;
    }

    const newStep: Partial<TrailStep> = {
      id: `ts-${Date.now()}`,
      contentId: artifact.id,
      stepOrder: steps.length,
      annotation: '',
      connectionType: 'leads_to',
      connectionText: '',
      artifact
    };

    if (insertAfterIndex !== null) {
      // Insert between steps
      const updated = [...steps];
      updated.splice(insertAfterIndex + 1, 0, newStep);
      setSteps(updated);
      setInsertAfterIndex(null);
    } else {
      // Append to end
      setSteps([...steps, newStep]);
    }

    // Default cover image if empty
    if (!coverImage) {
      const img = artifact.imageUrl || artifact.image_url;
      if (img) setCoverImage(img);
    }
  };

  const handleUpdateStep = (index: number, updates: Partial<TrailStep>) => {
    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, ...updates } : s));
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setSteps(reordered);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const finalCover = coverImage || steps[0]?.artifact?.imageUrl || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26';
      await saveTrail({
        id: trail?.id,
        title: title.trim(),
        description: description.trim(),
        coverImage: finalCover,
        theme,
        status,
        steps: steps.map((s, idx) => ({
          ...s,
          stepOrder: idx
        }))
      });
      onClose();
    } catch (err) {
      console.error('Failed to save trail:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestClose = () => {
    // If dirty, warn
    if (title.trim() || steps.length > 0) {
      setWarnCloseOpen(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const themes = [
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'architectural', label: 'Architectural' },
    { id: 'midnight', label: 'Midnight / Noir' },
    { id: 'literary', label: 'Literary & Philosophy' },
    { id: 'retrospective', label: 'Retrospective' }
  ];

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
            onClick={handleRequestClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-medium tracking-tight text-text-primary">
                    {trail?.id ? 'Edit Cultural Trail' : 'Create Cultural Trail'}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Map how cultural artifacts influence, evoke, and lead to one another
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestClose}
                className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta Row: Title, Theme, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-1.5">
                    Trail Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Tokyo After Dark"
                    required
                    className="w-full h-10 px-3.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-1.5">
                    Thematic Atmosphere
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full h-10 px-3 bg-bg-secondary border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-accent-primary cursor-pointer"
                  >
                    {themes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block mb-1.5">
                  Trail Narrative Introduction
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the conceptual throughline connecting these artifacts..."
                  rows={2}
                  className="w-full p-3 bg-bg-secondary border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-accent-primary transition-colors resize-none"
                />
              </div>

              {/* Steps Sequence */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-secondary font-mono block">
                      Trail Sequence ({steps.length} Steps)
                    </label>
                    <span className="text-[11px] text-text-muted">
                      Order artifacts and define why one leads to the next
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReplacingStepIndex(null);
                      setInsertAfterIndex(null);
                      setPickerOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-accent-primary text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Artifact
                  </button>
                </div>

                {steps.length === 0 ? (
                  <div className="py-12 border border-dashed border-border-subtle rounded-2xl text-center p-6 bg-bg-secondary/20">
                    <Compass className="w-10 h-10 text-accent-primary/60 mx-auto mb-2" />
                    <h4 className="font-serif text-sm font-medium text-text-primary mb-1">Begin Your Cultural Trail</h4>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4 font-light">
                      Add your first artifact to establish where the journey begins.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="px-4 py-2 rounded-full border border-border-subtle text-xs text-text-primary hover:bg-bg-elevated font-medium transition-colors cursor-pointer"
                    >
                      Browse Archive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, idx) => {
                      const artifact = step.artifact;
                      const isLast = idx === steps.length - 1;

                      return (
                        <div
                          key={step.id || idx}
                          className="p-4 rounded-xl bg-bg-secondary/40 border border-border-subtle flex flex-col gap-3.5 relative"
                        >
                          {/* Step Header: Order, Artifact Info, Actions */}
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center font-mono text-xs font-bold text-text-primary shrink-0">
                              {idx + 1}
                            </span>

                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface shrink-0 border border-border-subtle">
                              <OptimizedImage
                                src={artifact?.imageUrl || artifact?.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-text-primary truncate">
                                {artifact?.title || 'Selected Artifact'}
                              </h4>
                              <p className="text-[10px] text-text-secondary truncate mt-0.5">
                                {artifact?.creator || artifact?.category || artifact?.type || 'Artifact'}
                              </p>
                            </div>

                            {/* Move & Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStep(idx, 'up')}
                                className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer"
                                title="Move Earlier"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveStep(idx, 'down')}
                                className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer"
                                title="Move Later"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplacingStepIndex(idx);
                                  setPickerOpen(true);
                                }}
                                className="text-[10px] text-accent-primary hover:underline px-2 cursor-pointer"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveStep(idx)}
                                className="p-1.5 text-red-400/80 hover:text-red-400 cursor-pointer ml-1"
                                title="Remove Step"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Step Annotation Input */}
                          <div>
                            <input
                              type="text"
                              value={step.annotation || ''}
                              onChange={(e) => handleUpdateStep(idx, { annotation: e.target.value })}
                              placeholder="Personal annotation or observation for this step..."
                              className="w-full h-8 px-3 bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-accent-primary"
                            />
                          </div>

                          {/* Connection to Following Step (Shown on all except last) */}
                          {!isLast && (
                            <div className="p-3 rounded-lg bg-bg-elevated/70 border border-border-subtle/80 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <div className="flex items-center gap-1.5 text-accent-primary text-[10px] font-mono uppercase font-bold shrink-0">
                                <ArrowRight className="w-3 h-3" /> Connection:
                              </div>

                              <select
                                value={step.connectionType || 'leads_to'}
                                onChange={(e) => handleUpdateStep(idx, { connectionType: e.target.value as any })}
                                className="h-7 px-2 bg-bg-secondary border border-border-subtle rounded text-[11px] text-text-primary outline-none focus:border-accent-primary cursor-pointer shrink-0"
                              >
                                {Object.entries(CONNECTION_LABELS).map(([k, label]) => (
                                  <option key={k} value={k}>{label}</option>
                                ))}
                              </select>

                              <input
                                type="text"
                                value={step.connectionText || ''}
                                onChange={(e) => handleUpdateStep(idx, { connectionText: e.target.value })}
                                placeholder="Short explanation (e.g. Echoes of structural brutalism)..."
                                className="flex-1 w-full h-7 px-2.5 bg-bg-secondary border border-border-subtle rounded text-[11px] text-text-primary outline-none focus:border-accent-primary"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  setInsertAfterIndex(idx);
                                  setReplacingStepIndex(null);
                                  setPickerOpen(true);
                                }}
                                className="text-[10px] text-text-secondary hover:text-text-primary font-medium shrink-0 flex items-center gap-1 cursor-pointer ml-auto"
                                title="Insert an artifact between these steps"
                              >
                                <Plus className="w-3 h-3" /> Insert Between
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Setting */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-[10px] uppercase tracking-widest text-text-secondary font-mono">Status:</span>
                <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="trail-status"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="text-accent-primary"
                  />
                  Draft
                </label>
                <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="trail-status"
                    checked={status === 'completed'}
                    onChange={() => setStatus('completed')}
                    className="text-accent-primary"
                  />
                  Completed Journey
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-bg-elevated">
              <button
                type="button"
                onClick={handleRequestClose}
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
                <Check className="w-3.5 h-3.5" /> Save Trail
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Artifact Picker */}
      <ArtifactPickerModal
        isOpen={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleArtifactSelected}
        title={replacingStepIndex !== null ? 'Replace Artifact' : 'Add Artifact to Trail'}
        selectedIds={steps.map(s => s.contentId)}
      />

      {/* Warn on Discard Edits */}
      <AnimatePresence>
        {isWarnCloseOpen && (
          <div className="fixed inset-0 z-[12500] flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-bg-elevated border border-border-subtle shadow-2xl text-center"
            >
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-medium text-text-primary mb-2">Discard Unsaved Trail Edits?</h3>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                You have unsaved changes to this cultural trail. Closing will discard any new steps or annotations you defined.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setWarnCloseOpen(false)}
                  className="px-4 py-2 rounded-full border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWarnCloseOpen(false);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs uppercase tracking-wider font-medium shadow-md transition-all cursor-pointer"
                >
                  Discard Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
