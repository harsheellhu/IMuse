import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { engineApi } from '../api/engine';
import { useSettingsStore } from '../store/useSettingsStore';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Palette } from 'lucide-react';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { useStore } from '../store/useStore';
import { extractArtifactColors } from '../utils/colorSearch';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function ColorMemory() {
  const navigate = useNavigate();
  const openViewer = useStore(s => s.openViewer);
  const [memory, setMemory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const { typography } = useSettingsStore();

  useEffect(() => {
    engineApi.getColorMemory('year').then(data => {
      setMemory(data);
      if (data.topPalettes && data.topPalettes.length > 0) {
        setActiveColor(data.topPalettes[0].palette.primary);
      }
      setIsLoading(false);
    }).catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-bg-base flex items-center justify-center typography-${typography}`}>
        <span className="text-xs tracking-[0.2em] uppercase text-text-secondary animate-pulse">Extracting Colors...</span>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className={`min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-6 text-center typography-${typography}`}>
        <h2 className="text-2xl font-serif text-text-primary">No Color Memory Extracted Yet</h2>
        <p className="text-sm text-text-secondary max-w-md">Save books, films, and imagery to let iMuse map your aesthetic spectrum over time.</p>
        <Link to="/home" className="px-6 py-2 rounded-full border border-border-subtle text-xs uppercase tracking-widest hover:border-text-primary transition-all text-text-primary">
          Explore Feed
        </Link>
      </div>
    );
  }

  const timeline = memory.timeline || [];
  const topPalettes = memory.topPalettes || [];

  const yearStrip = MONTHS.map((m, index) => {
    const monthIndexStr = (index + 1).toString().padStart(2, '0');
    const timelineEntry = timeline.find((t: any) => t.monthKey && t.monthKey.endsWith(`-${monthIndexStr}`));
    return {
      month: m,
      palette: timelineEntry?.dominantPalette || { primary: 'rgba(255,255,255,0.05)' }
    };
  });

  const activeColorGroup = topPalettes.find((p: any) => p.palette?.primary === activeColor) || topPalettes[0];

  return (
    <div className={`min-h-screen bg-bg-base text-text-primary pb-24 typography-${typography}`}>
      <header className="px-6 md:px-12 pt-12 pb-8 flex justify-between items-center">
        <Link to="/profile/me" className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] hover:opacity-70 transition-opacity text-text-primary font-medium">
          <ArrowLeft className="w-4 h-4" /> Profile
        </Link>
        <span className="text-[10px] uppercase tracking-[0.3em] text-text-secondary opacity-60">Taste Profile</span>
      </header>

      <main className="px-6 md:px-12">
        <h1 className="text-4xl md:text-6xl font-serif font-light mb-16 text-text-primary">Color Memory</h1>

        {/* 1. Year Color Strip */}
        <section className="mb-24">
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-6 text-text-secondary">This Year's Palette</h2>
          <div className="flex h-32 md:h-48 w-full rounded-xl overflow-hidden shadow-md border border-border-subtle">
            {yearStrip.map((item, i) => (
              <div 
                key={i} 
                className="flex-1 h-full relative group transition-all duration-500 hover:flex-[2]"
                style={{ backgroundColor: item.palette.primary }}
              >
                <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                    {item.month}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Colors You Return To */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-8 text-text-secondary">Colors You Return To</h2>
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Color Swatches */}
            <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
              {memory.topPalettes.map((group: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveColor(group.palette.primary)}
                  className={`relative w-24 h-24 rounded-lg overflow-hidden shrink-0 transition-transform cursor-pointer ${activeColor === group.palette.primary ? 'scale-110 shadow-lg ring-2 ring-offset-2 ring-offset-bg-base ring-text-primary z-10' : 'hover:scale-105'}`}
                  style={{ backgroundColor: group.palette.primary }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                    <span className="text-xs text-white font-medium drop-shadow">{group.count} Items</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Color Content */}
            <div className="flex-1 min-h-[400px]">
              {activeColorGroup && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle/50">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-4 h-4 rounded-full border border-border-subtle shadow-xs" 
                      style={{ backgroundColor: activeColor || activeColorGroup.palette?.primary }} 
                    />
                    <span className="text-xs uppercase tracking-widest text-text-secondary font-mono">
                      {activeColor || activeColorGroup.palette?.primary} · {activeColorGroup.count || activeColorGroup.items?.length || 0} artifacts
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const colors = extractArtifactColors(activeColorGroup.palette);
                      const targetColors = colors.length > 0 ? colors : [activeColor || activeColorGroup.palette?.primary];
                      navigate(`/discovery?mode=color&colors=${encodeURIComponent(targetColors.join(','))}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Search Similar in Discovery Studio ↗</span>
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {activeColorGroup && (
                  <motion.div
                    key={activeColor}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  >
                    {(activeColorGroup?.items || []).map((item: any) => {
                      const img = item.image_url || item.imageUrl || item.coverImage || item.posterImage;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => openViewer({ id: item.id, type: (item.type || 'post') as any, data: item })}
                          className="aspect-[3/4] rounded-sm overflow-hidden bg-bg-elevated border border-border-subtle group relative cursor-pointer shadow-sm hover:border-text-primary/40 transition-colors"
                        >
                          {img ? (
                            <OptimizedImage 
                              src={img} 
                              alt={item.title || ''} 
                              optimizeOptions={{ width: 400, quality: 80, format: 'webp' }}
                              fallbackText={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                              <span className="text-[9px] uppercase tracking-widest text-text-muted mb-2">{item.type}</span>
                              <span className="font-serif text-sm line-clamp-3 text-text-primary">{item.title}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-xs">
                            <span className="text-white text-[10px] uppercase tracking-widest px-4 text-center">{item.title}</span>
                          </div>
                        </div>
                      );
                    })}
                    {(!activeColorGroup || !activeColorGroup.items || activeColorGroup.items.length === 0) && (
                      <div className="col-span-full py-12 text-center text-text-secondary text-sm italic font-serif">
                        No saved items match this palette tone.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
