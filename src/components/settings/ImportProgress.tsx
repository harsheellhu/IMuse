import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Play, Pause, X, Loader2 } from 'lucide-react';
import { cancelDiscoveryImport, pauseDiscoveryImport, resumeDiscoveryImport } from '../../utils/discoveryImport';

export function ImportProgress() {
  const { discoveryTask } = useSettingsStore();

  if (!discoveryTask.isActive && discoveryTask.stage === null && !discoveryTask.error) {
    return null;
  }

  const handlePauseResume = () => {
    if (discoveryTask.isPaused) {
      resumeDiscoveryImport();
    } else {
      pauseDiscoveryImport();
    }
  };

  const handleCancel = () => {
    cancelDiscoveryImport();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[110] w-80 bg-bg-elevated border border-border-subtle rounded-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        <div className="p-4 border-b border-border-subtle/50">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
              {discoveryTask.stage !== 'finalizing' && !discoveryTask.error && (
                <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              )}
              {discoveryTask.error ? 'Import Failed' : `Importing ${discoveryTask.packName}...`}
            </h4>
            <span className="text-xs font-medium text-text-secondary">{Math.round(discoveryTask.progress)}%</span>
          </div>
          <p className="text-xs text-text-muted capitalize">
            {discoveryTask.error || discoveryTask.stage || 'Preparing'} 
            {discoveryTask.totalItems > 0 && ` (${discoveryTask.itemsProcessed} / ${discoveryTask.totalItems})`}
          </p>
        </div>
        
        <div className="h-1.5 bg-bg-secondary w-full overflow-hidden">
          <motion.div 
            className="h-full bg-text-primary"
            initial={{ width: 0 }}
            animate={{ width: `${discoveryTask.progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        <div className="px-4 py-2 bg-bg-secondary/50 flex justify-end gap-2">
          {!discoveryTask.error && discoveryTask.stage !== 'finalizing' && (
            <button
              onClick={handlePauseResume}
              className="px-3 py-1.5 flex items-center gap-1.5 rounded bg-bg-elevated text-xs font-medium text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
            >
              {discoveryTask.isPaused ? (
                <><Play className="w-3 h-3" /> Resume</>
              ) : (
                <><Pause className="w-3 h-3" /> Pause</>
              )}
            </button>
          )}
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 flex items-center gap-1.5 rounded bg-bg-elevated text-xs font-medium text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
          >
            <X className="w-3 h-3" />
            {discoveryTask.error || discoveryTask.stage === 'finalizing' ? 'Dismiss' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
