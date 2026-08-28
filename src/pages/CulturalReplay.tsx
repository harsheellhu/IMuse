import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight, X } from 'lucide-react';
import { activityApi, CulturalReplay as ReplayData } from '../api/activity';
import { useSettingsStore } from '../store/useSettingsStore';

export function CulturalReplay() {
  const [year, setYear] = useState('2026');
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(0); // 0: Opening, 1: Summary, 2: Timeline, 3: Themes, 4: Outro
  const { typography } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    activityApi.getCulturalReplay(year)
      .then(data => {
        setReplay(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [year]);

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg-base z-[1000] flex items-center justify-center">
        <span className="text-text-muted tracking-[0.2em] uppercase text-xs animate-pulse">Loading Archive...</span>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="fixed inset-0 bg-bg-base z-[1000] flex flex-col items-center justify-center gap-4">
        <span className="text-text-muted">No activity found for {year}.</span>
        <button onClick={() => navigate('/profile')} className="text-text-primary underline">Return</button>
      </div>
    );
  }

  const monthNames = ["", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  return (
    <div className={`fixed inset-0 bg-black text-white z-[1000] overflow-hidden flex flex-col typography-${typography}`}>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="flex gap-4 items-center">
          <select 
            value={year} 
            onChange={(e) => { setYear(e.target.value); setStep(0); }}
            className="bg-transparent text-white border-b border-white/20 pb-1 focus:outline-none cursor-pointer uppercase tracking-widest text-xs"
          >
            <option value="2026" className="bg-black">2026</option>
            <option value="2025" className="bg-black">2025</option>
          </select>
        </div>
        <button onClick={() => navigate('/profile')} className="text-white/50 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Cinematic Content */}
      <div className="flex-1 w-full h-full relative" onClick={nextStep}>
        <AnimatePresence mode="wait">
          {/* STEP 0: OPENING */}
          {step === 0 && (
            <motion.div 
              key="opening"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <h2 className="text-[200px] font-serif leading-none tracking-tighter opacity-10">{year}</h2>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs uppercase tracking-[0.4em] text-white/60 mb-6">Your Year in Culture</span>
                <h1 className="text-5xl md:text-7xl font-serif">The Archive</h1>
              </div>
              <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-50 animate-pulse">
                <span className="text-[10px] uppercase tracking-widest">Click to begin</span>
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </motion.div>
          )}

          {/* STEP 1: SUMMARY */}
          {step === 1 && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer px-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16 text-center">
                <div>
                  <div className="text-5xl md:text-7xl font-serif mb-2">{replay.metrics.films}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Films Watched</div>
                </div>
                <div>
                  <div className="text-5xl md:text-7xl font-serif mb-2">{replay.metrics.books}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Books Read</div>
                </div>
                <div>
                  <div className="text-5xl md:text-7xl font-serif mb-2">{replay.metrics.places}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Places Visited</div>
                </div>
                <div>
                  <div className="text-5xl md:text-7xl font-serif mb-2">{replay.metrics.savedImages}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Images Saved</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TIMELINE */}
          {step === 2 && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex items-center overflow-x-auto scrollbar-hide snap-x cursor-grab active:cursor-grabbing px-12 md:px-32"
              onClick={(e) => e.stopPropagation()} // Let them scroll
            >
              <div className="flex gap-24 h-full items-center">
                {replay.timeline.map((month) => (
                  <div key={month.month} className="snap-center shrink-0 w-[300px] md:w-[400px]">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80 mb-2">
                      {monthNames[month.month]}
                    </h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-8">{month.shift}</p>
                    
                    <div className="space-y-6">
                      {month.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded shadow-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-white/5 rounded border border-white/10" />
                          )}
                          <div>
                            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{item.event_type}</div>
                            <div className="font-serif text-lg line-clamp-2">{item.title}</div>
                          </div>
                        </div>
                      ))}
                      {month.items.length > 4 && (
                        <div className="text-xs text-white/40 italic">+{month.items.length - 4} more experiences</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Spacer to allow scrolling past the end */}
                <div className="w-[10vw]" />
                
                <button 
                  onClick={nextStep}
                  className="shrink-0 flex items-center justify-center w-24 h-24 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: THEMES */}
          {step === 3 && (
            <motion.div 
              key="themes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer px-6 text-center"
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-12">Recurring Elements</span>
              <div className="space-y-6">
                {replay.topThemes.map((theme, i) => (
                  <motion.div 
                    key={theme}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="text-4xl md:text-6xl font-serif capitalize opacity-90 hover:opacity-100 transition-opacity"
                  >
                    {theme}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: OUTRO */}
          {step === 4 && (
            <motion.div 
              key="outro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <h2 className="text-2xl md:text-4xl font-serif leading-relaxed max-w-2xl mb-16 text-white/90">
                Your year, defined by the art, spaces, and narratives you chose to experience.
              </h2>
              
              <Link 
                to="/profile"
                className="group flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
                  Return to Museum
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Progress indicators */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-2 z-50 pointer-events-none">
        {[0, 1, 2, 3, 4].map(s => (
          <div 
            key={s} 
            className={`h-0.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-white/40' : 'w-4 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
