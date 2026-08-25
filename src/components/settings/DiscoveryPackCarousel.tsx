import React from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useStore } from '../../store/useStore';
import { SettingCarousel } from './SettingCarousel';
import { motion } from 'motion/react';
import { Download } from 'lucide-react';
import { startDiscoveryImport } from '../../utils/discoveryImport';

const PACKS = [
  { id: 'architecture', title: 'Architecture', description: 'Brutalist, modern, and classical structures.', count: 500 },
  { id: 'cinema', title: 'Cinema', description: 'Cinematography stills and film history.', count: 1200 },
  { id: 'typography', title: 'Typography', description: 'Editorial and experimental type.', count: 350 },
  { id: 'sci-fi', title: 'Sci-Fi', description: 'Futuristic interfaces and concept art.', count: 800 },
  { id: 'nature', title: 'Nature', description: 'Landscapes and organic forms.', count: 600 },
];

export function DiscoveryPackCarousel() {
  const { discoveryTask } = useSettingsStore();

  const handleImport = (packId: string) => {
    useStore.getState().interceptAction(() => {
      startDiscoveryImport(packId);
    });
  };

  return (
    <SettingCarousel title="Discovery Packs" description="Import curated thematic collections into your library.">
      {PACKS.map(pack => (
        <div 
          key={pack.id} 
          className="relative flex-shrink-0 w-72 h-48 rounded-xl border border-border-subtle overflow-hidden flex flex-col justify-between p-5"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <div>
            <h3 className="text-base font-medium text-text-primary">{pack.title}</h3>
            <p className="text-sm text-text-secondary mt-1">{pack.description}</p>
            <p className="text-xs text-text-muted mt-2">{pack.count} items</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleImport(pack.id)}
            disabled={discoveryTask.isActive}
            className="w-full py-2 bg-text-primary text-bg-base rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-4 h-4" />
            {discoveryTask.isActive && discoveryTask.packName === pack.id ? 'Importing...' : 'Import Pack'}
          </motion.button>
        </div>
      ))}
    </SettingCarousel>
  );
}
