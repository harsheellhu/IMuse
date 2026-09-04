import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Dna, Activity } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { dnaApi, CulturalDNAProfile } from '../api/dna';

export function CulturalDNAPage() {
  const [profile, setProfile] = useState<CulturalDNAProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { typography } = useSettingsStore();

  useEffect(() => {
    dnaApi.getProfile()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-bg-base flex items-center justify-center typography-${typography}`}>
        <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary animate-pulse flex items-center gap-2">
          <Dna className="w-4 h-4 animate-spin-slow text-accent-primary" /> Analyzing DNA...
        </span>
      </div>
    );
  }

  if (!profile || profile.clusters.length === 0) {
    return (
      <div className={`min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center typography-${typography}`}>
        <span className="text-sm text-text-secondary mb-4">Not enough activity to form a Cultural DNA yet.</span>
        <Link to="/explore" className="text-xs uppercase tracking-widest underline text-text-primary">Explore the World</Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-bg-base text-text-primary overflow-hidden typography-${typography} relative`}>
      {/* Header */}
      <header className="px-6 md:px-12 pt-12 pb-8 flex justify-between items-center z-50 relative">
        <Link to="/profile/me" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity font-medium text-text-primary">
          <ArrowLeft className="w-4 h-4" /> Profile
        </Link>
        <span className="text-[9px] uppercase tracking-[0.4em] opacity-40 font-bold text-text-secondary">Your Cultural DNA</span>
      </header>

      {/* Main Visualization Area */}
      <main className="px-6 md:px-12 pb-32 h-full flex flex-col md:flex-row gap-12 relative z-10">
        
        {/* Constellation Canvas (Left/Top) */}
        <div className="flex-1 min-h-[500px] relative flex items-center justify-center border border-border-subtle rounded-2xl bg-bg-elevated/40 overflow-hidden shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Dna className="w-96 h-96 text-text-primary" />
          </div>
          <ConstellationGraph clusters={profile.clusters} />
        </div>

        {/* Analytics & Threads (Right/Bottom) */}
        <div className="w-full md:w-96 shrink-0 flex flex-col gap-12">
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-serif font-light mb-8 text-text-primary">Cultural DNA</h2>
            
            {/* Emerging & Constant */}
            <div className="space-y-6 mb-12">
              {profile.emerging && (
                <div className="p-4 border border-border-subtle rounded-xl bg-bg-elevated shadow-sm">
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-emerald-400 mb-2 font-medium">
                    <Activity className="w-3 h-3" /> Emerging Theme
                  </div>
                  <div className="font-serif text-xl mb-1 text-text-primary">{profile.emerging.theme}</div>
                  <div className="text-xs text-text-secondary">{profile.emerging.reason}</div>
                </div>
              )}

              {profile.constant && (
                <div className="p-4 border border-border-subtle rounded-xl bg-bg-elevated shadow-sm">
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-text-secondary mb-2 font-medium">
                    Constant
                  </div>
                  <div className="font-serif text-xl mb-1 text-text-primary">{profile.constant.theme}</div>
                  <div className="text-xs text-text-secondary">{profile.constant.reason}</div>
                </div>
              )}
            </div>

            {/* Your Threads (Cross-Media) */}
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-6 font-medium border-b border-border-subtle pb-2 text-text-secondary">Your Threads</h3>
              <div className="space-y-6">
                {profile.threads.map((thread, i) => (
                  <div key={i} className="group">
                    <div className="font-serif text-lg mb-2 group-hover:translate-x-1 transition-transform text-text-primary">{thread.theme}</div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-secondary">
                      {thread.types.join(' ↔ ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}

function ConstellationGraph({ clusters }: { clusters: any[] }) {
  const maxScore = Math.max(...clusters.map(c => c.score));
  
  return (
    <div className="relative w-full h-full max-w-2xl max-h-2xl aspect-square flex items-center justify-center">
      {clusters.map((cluster, i) => {
        const golden_ratio = (Math.sqrt(5) + 1) / 2 - 1;
        const radius = Math.sqrt(i + 1) * 60;
        const theta = 2 * Math.PI * golden_ratio * i;
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        
        const size = Math.max(40, (cluster.score / maxScore) * 120);

        return (
          <motion.div
            key={cluster.tag}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: 'spring', damping: 20 }}
            className="absolute flex items-center justify-center text-center cursor-default group"
            style={{ 
              x, y,
              width: size, height: size,
              marginLeft: -size/2, marginTop: -size/2
            }}
          >
            <div 
              className="absolute inset-0 rounded-full border border-border-subtle bg-bg-elevated/70 backdrop-blur-sm group-hover:border-text-primary/60 transition-colors shadow-sm"
            />
            <span className="relative z-10 text-[9px] md:text-[11px] font-medium tracking-widest uppercase break-words px-2 leading-tight text-text-primary">
              {cluster.tag}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
