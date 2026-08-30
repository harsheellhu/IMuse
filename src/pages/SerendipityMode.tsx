import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Save, X } from 'lucide-react';
import { engineApi } from '../api/engine';
import { useSettingsStore } from '../store/useSettingsStore';

import { useStore } from '../store/useStore';

export function SerendipityMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const { posts } = useStore();
  const [level, setLevel] = useState('unexpected'); // gentle, unexpected, wild
  const [history, setHistory] = useState<any[]>([]);
  const [currentLeap, setCurrentLeap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { typography, motion: motionMode } = useSettingsStore();

  // Grab a starting point from location state, posts, or fallback to seeded architecture item
  const startId = location.state?.fromContentId || posts[0]?.id || 'architecture-0';

  const fetchNextLeap = (fromId: string) => {
    setIsLoading(true);
    engineApi.getSerendipityLeap(fromId, level)
      .then(leap => {
        setCurrentLeap(leap);
        if (history.length === 0) {
          setHistory([leap.source, leap.target]);
        } else {
          setHistory(prev => [...prev, leap.target]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (startId) {
      fetchNextLeap(startId);
    }
  }, [startId]);

  const handleNext = () => {
    if (currentLeap?.target) {
      fetchNextLeap(currentLeap.target.id);
    }
  };

  const handleSaveThread = async () => {
    if (history.length < 2) return;
    try {
      setIsSaving(true);
      await engineApi.saveSerendipityTrail(history);
      alert('Serendipity trail saved as a new Collection!');
    } catch (err) {
      console.error(err);
      alert('Failed to save trail.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentLeap && isLoading) {
    return (
      <div className={`w-full min-h-screen bg-[#050505] text-white flex items-center justify-center typography-${typography}`}>
        <span className="text-xs uppercase tracking-[0.3em] text-white/50 animate-pulse">Calculating Leap...</span>
      </div>
    );
  }

  if (!currentLeap) {
    return (
      <div className={`w-full min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center typography-${typography}`}>
        <span className="text-sm text-white/50 mb-4">No serendipity connection found.</span>
        <button onClick={() => navigate(-1)} className="text-white underline">Return</button>
      </div>
    );
  }

  const { source, target, explanation } = currentLeap;

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#050505] text-white overflow-hidden flex flex-col typography-${typography}`}>
      {/* Header */}
      <header className="p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Serendipity Mode
          </span>
          <div className="flex gap-4">
            {['gentle', 'unexpected', 'wild'].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`text-[10px] uppercase tracking-widest transition-colors ${level === lvl ? 'text-[#4ADE80] font-medium' : 'text-white/40 hover:text-white/80'}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6 md:px-12">
        <AnimatePresence mode="wait">
          {!isLoading ? (
            <motion.div 
              key={target.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center w-full max-w-5xl"
            >
              
              <div className="flex flex-col md:flex-row items-center w-full justify-between gap-12">
                
                {/* SOURCE */}
                <div className="flex-1 flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-6 block">You were looking at</span>
                  <div className="w-32 h-40 md:w-48 md:h-64 rounded-lg overflow-hidden border border-white/10 mb-6">
                    {source.image_url ? (
                      <img src={source.image_url} alt={source.title} className="w-full h-full object-cover grayscale" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs uppercase">{source.type}</div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl line-clamp-1">{source.title}</h3>
                </div>

                {/* CONNECTION EXPLANATION */}
                <div className="flex-1 flex flex-col items-center text-center max-w-sm px-4 relative">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent absolute top-1/2 -z-10" />
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#4ADE80] mb-4 bg-[#050505] px-4 py-1 rounded-full border border-[#4ADE80]/30">Why</span>
                  <p className="text-sm md:text-base text-white/80 font-serif italic leading-relaxed bg-[#050505] px-4 py-2">
                    {explanation}
                  </p>
                </div>

                {/* TARGET */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white mb-6 block">You might not expect</span>
                  <div className="w-48 h-64 md:w-64 md:h-80 rounded-xl overflow-hidden border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-6">
                    {target.image_url ? (
                      <img src={target.image_url} alt={target.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs uppercase">{target.type}</div>
                    )}
                  </div>
                  <h3 className="font-serif text-3xl mb-2 line-clamp-1">{target.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-white/50">{target.type}</span>
                </div>

              </div>

              <div className="mt-20 flex gap-6">
                <button 
                  onClick={handleNext}
                  className="px-8 py-4 bg-white text-black rounded-full text-xs uppercase tracking-[0.2em] font-medium hover:bg-white/90 transition-colors flex items-center gap-3"
                >
                  Keep Going <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <div className="w-32 h-32 border border-white/20 rounded-full animate-ping" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Sidebar/Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end pointer-events-none z-50">
        <div className="flex gap-2 items-center pointer-events-auto max-w-2xl overflow-x-auto scrollbar-hide">
          <span className="text-[9px] uppercase tracking-widest text-white/40 shrink-0 mr-4">Trail</span>
          {history.map((node, i) => (
            <React.Fragment key={i}>
              <div className="shrink-0 w-10 h-10 rounded border border-white/20 overflow-hidden" title={node.title}>
                {node.image_url ? <img src={node.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10" />}
              </div>
              {i < history.length - 1 && <span className="text-white/20 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
        
        {history.length > 1 && (
          <button 
            onClick={handleSaveThread}
            disabled={isSaving}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-[9px] uppercase tracking-[0.2em]"
          >
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : 'Save Thread'}
          </button>
        )}
      </div>

    </div>
  );
}
