import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Compass, ArrowRight, 
  ExternalLink, RotateCcw, CheckCircle2, List, Sparkles, MapPin
} from 'lucide-react';
import { Trail, TrailStep, TrailConnectionType } from '../../types';
import { useStore } from '../../store/useStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useImagePalette } from '../../hooks/useImagePalette';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface TrailViewerProps {
  trail: Trail | null;
  isOpen: boolean;
  onClose: () => void;
  initialStepIndex?: number;
}

export const CONNECTION_LABELS: Record<TrailConnectionType, string> = {
  inspired_by: 'Inspired by',
  created_by: 'Created by',
  adaptation_of: 'Adaptation of',
  set_in: 'Set in',
  related_to: 'Related to',
  similar_atmosphere: 'Similar Atmosphere',
  personal_association: 'Personal Association',
  leads_to: 'Leads to',
  custom: 'Connected by'
};

export function TrailViewer({ trail, isOpen, onClose, initialStepIndex = 0 }: TrailViewerProps) {
  useBodyScrollLock(isOpen);
  const { openViewer, activeViewerItem } = useStore();
  const { appearance, motion: motionSetting } = useSettingsStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps = trail?.steps || [];
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];
  const nextStep = currentStepIndex < totalSteps - 1 ? steps[currentStepIndex + 1] : null;

  const currentArtifact = currentStep?.artifact;
  const currentImage = currentArtifact?.imageUrl || currentArtifact?.image_url || currentArtifact?.coverImage || trail?.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26';
  const { palette } = useImagePalette(currentImage);

  // Sync step index if initial changes
  useEffect(() => {
    setCurrentStepIndex(initialStepIndex);
    setIsCompleted(false);
  }, [initialStepIndex, trail?.id]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setIsCompleted(false);
    } else {
      setIsCompleted(true);
    }
  }, [currentStepIndex, totalSteps]);

  const handlePrev = useCallback(() => {
    if (isCompleted) {
      setIsCompleted(false);
      return;
    }
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex, isCompleted]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Open canonical detail viewer for this artifact while saving trail position
  const handleOpenArtifactDetail = () => {
    if (!currentArtifact) return;
    openViewer({
      id: currentArtifact.id,
      type: currentArtifact.type || 'post',
      data: currentArtifact,
      mode: 'detail'
    });
  };

  if (!isOpen || !trail) return null;

  const isTron = appearance === 'tron';
  const isDark = document.documentElement.classList.contains('dark') || isTron;
  const baseBg = isTron ? '#010409' : (isDark ? '#080808' : '#FAF9F6');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[10100] flex flex-col justify-between select-none overflow-hidden"
      >
        {/* Dynamic Palette Background Bloom */}
        <div className="absolute inset-0 transition-colors duration-700" style={{ backgroundColor: baseBg }} />
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-25 mix-blend-screen"
          style={{
            background: palette
              ? `radial-gradient(circle 800px at 50% 45%, ${palette.primary}45, transparent 75%)`
              : 'radial-gradient(circle 800px at 50% 45%, rgba(255, 255, 255, 0.06), transparent 75%)'
          }}
        />

        {/* Top Editorial Nav Header */}
        <header className="relative z-20 w-full px-6 md:px-12 py-5 flex items-center justify-between pointer-events-auto border-b border-border-subtle/40 backdrop-blur-sm bg-bg-base/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] text-text-secondary font-mono flex items-center gap-1.5">
                Cultural Trail · {trail.theme || 'Cinematic Journey'}
              </span>
              <h2 className="text-base md:text-lg font-serif tracking-tight text-text-primary line-clamp-1">
                {trail.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Overview / Steps Map Button */}
            <button
              type="button"
              onClick={() => setIsOverviewOpen(prev => !prev)}
              className="px-3 py-1.5 rounded-full bg-bg-elevated/70 hover:bg-bg-elevated border border-border-subtle text-xs text-text-primary font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span> ({totalSteps})
            </button>

            {/* Close Button */}
            <button
              type="button"
              aria-label="Close trail viewer"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-primary bg-bg-elevated/70 hover:bg-bg-elevated border border-border-subtle transition-all cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Viewer */}
        <main className="relative z-10 flex-1 flex items-center justify-center overflow-hidden px-4 md:px-12 py-4">
          {totalSteps === 0 ? (
            <div className="text-center p-8 max-w-md">
              <Compass className="w-12 h-12 text-accent-primary mx-auto mb-3 opacity-60" />
              <h3 className="font-serif text-xl font-medium text-text-primary mb-2">Trail In Progress</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                This cultural trail does not have any artifacts added yet. Add artifacts using the trail editor to map the narrative journey.
              </p>
            </div>
          ) : isCompleted ? (
            /* Completed Trail Milestone View */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-lg p-8 rounded-2xl bg-bg-elevated/90 border border-border-subtle shadow-2xl backdrop-blur-md"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 block mb-1">
                Journey Completed
              </span>
              <h3 className="font-serif text-3xl font-medium text-text-primary mb-3">
                {trail.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6 font-light">
                You have traversed all {totalSteps} artifacts and thematic connections along this cultural trail.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setIsCompleted(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-bg-secondary hover:bg-bg-elevated border border-border-subtle text-xs text-text-primary font-medium flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restart Journey
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-text-primary text-bg-base text-xs uppercase tracking-wider font-medium hover:opacity-90 transition-all cursor-pointer shadow-md"
                >
                  Return to Archive
                </button>
              </div>
            </motion.div>
          ) : (
            /* Active Step Display */
            <div className="relative w-full max-w-5xl h-full flex items-center justify-between">
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border border-border-subtle transition-all cursor-pointer z-20 ${
                  currentStepIndex === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-bg-elevated/80 text-text-primary hover:bg-bg-elevated hover:scale-105 shadow-md'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Step Card & Narrative Connection */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, x: 40, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -40, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 max-h-[75vh] w-full px-4 overflow-y-auto"
                >
                  {/* Left: Artifact Visual */}
                  <div className="w-full md:w-1/2 max-w-md flex flex-col items-center">
                    <div 
                      onClick={handleOpenArtifactDetail}
                      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-border-subtle shadow-2xl bg-surface group cursor-pointer"
                    >
                      <OptimizedImage
                        src={currentImage}
                        alt={currentArtifact?.title || 'Trail Artifact'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-black text-xs font-medium flex items-center gap-1.5 shadow-md">
                          <ExternalLink className="w-3.5 h-3.5" /> View Details
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Step Annotation & Connection Narrative */}
                  <div className="w-full md:w-1/2 max-w-md flex flex-col justify-center space-y-4">
                    {/* Step Sequence Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                        Step {currentStepIndex + 1} of {totalSteps}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                        {currentArtifact?.category || currentArtifact?.type || 'Artifact'}
                      </span>
                    </div>

                    {/* Artifact Title & Creator */}
                    <div>
                      <h3 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-text-primary mb-1">
                        {currentArtifact?.title || 'Untitled Artifact'}
                      </h3>
                      <p className="text-xs uppercase tracking-widest text-text-secondary">
                        {currentArtifact?.creator || currentArtifact?.metadata?.author || currentArtifact?.metadata?.director || currentArtifact?.location || 'Archived Work'}
                      </p>
                    </div>

                    {/* Step Personal Annotation */}
                    {currentStep?.annotation && (
                      <div className="p-4 rounded-xl bg-bg-elevated/70 border border-border-subtle/80 backdrop-blur-xs">
                        <p className="font-serif italic text-sm text-text-primary/90 leading-relaxed">
                          "{currentStep.annotation}"
                        </p>
                      </div>
                    )}

                    {/* Connection to Next Step */}
                    {nextStep && (
                      <div className="p-3.5 rounded-xl bg-bg-secondary/50 border border-border-subtle flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent-primary font-semibold">
                          <ArrowRight className="w-3 h-3" />
                          <span>
                            {CONNECTION_LABELS[currentStep?.connectionType as TrailConnectionType] || 'Leads to'}
                          </span>
                        </div>
                        {currentStep?.connectionText && (
                          <p className="text-xs text-text-secondary font-light">
                            {currentStep.connectionText}
                          </p>
                        )}
                        <span className="text-[11px] text-text-primary font-medium mt-0.5 truncate">
                          Next: {nextStep.artifact?.title || 'Next Step'}
                        </span>
                      </div>
                    )}

                    {/* Direct View Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleOpenArtifactDetail}
                        className="text-xs text-accent-primary hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Inspect Artifact in Full Detail
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-bg-elevated/80 text-text-primary hover:bg-bg-elevated hover:scale-105 backdrop-blur-md border border-border-subtle shadow-md transition-all cursor-pointer z-20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </main>

        {/* Bottom Timeline Strip & Progress Bar */}
        <footer className="relative z-20 w-full px-6 md:px-12 py-4 bg-bg-base/40 backdrop-blur-md border-t border-border-subtle/40">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Progress Percentage Bar */}
            <div className="w-full h-1 bg-border-subtle/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent-primary rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / (totalSteps || 1)) * 100}%`
                }}
              />
            </div>

            {/* Thumbnail Steps Row (Desktop Horizontal Timeline) */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-1">
              {steps.map((step, idx) => {
                const isSelected = idx === currentStepIndex && !isCompleted;
                const img = step.artifact?.imageUrl || step.artifact?.image_url;

                return (
                  <button
                    key={step.id || idx}
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      setIsCompleted(false);
                    }}
                    className={`relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent-primary ring-2 ring-accent-primary/30 scale-105 shadow-md opacity-100'
                        : 'border-border-subtle opacity-40 hover:opacity-80'
                    }`}
                  >
                    <OptimizedImage
                      src={img || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute top-1 left-1 bg-black/70 px-1 rounded text-[9px] font-mono text-white">
                      {idx + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </footer>

        {/* Overview Modal / Drawer */}
        <AnimatePresence>
          {isOverviewOpen && (
            <div className="fixed inset-0 z-[10500] flex justify-end select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-bg-base/70 backdrop-blur-sm"
                onClick={() => setIsOverviewOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-full max-w-md h-full bg-bg-elevated border-l border-border-subtle shadow-2xl flex flex-col z-10 overflow-hidden"
              >
                <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-serif text-xl font-medium text-text-primary">Trail Overview</h3>
                  <button
                    onClick={() => setIsOverviewOpen(false)}
                    className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {steps.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsCompleted(false);
                        setIsOverviewOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'bg-accent-primary/10 border-accent-primary/40 shadow-xs'
                          : 'bg-bg-secondary/40 border-border-subtle hover:bg-bg-secondary'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center font-mono text-xs font-bold text-text-primary shrink-0">
                        {idx + 1}
                      </div>

                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface shrink-0">
                        <OptimizedImage
                          src={step.artifact?.imageUrl || step.artifact?.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-text-primary truncate">
                          {step.artifact?.title || 'Untitled'}
                        </h4>
                        <p className="text-[10px] text-text-secondary truncate mt-0.5">
                          {step.annotation || step.artifact?.category || 'Step'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
