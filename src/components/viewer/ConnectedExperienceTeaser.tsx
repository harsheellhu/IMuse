import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Experience } from '../../types';
import { experiencesApi } from '../../api/experiences';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface ConnectedExperienceTeaserProps {
  contentId: string;
}

export function ConnectedExperienceTeaser({ contentId }: ConnectedExperienceTeaserProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    experiencesApi.getByContentId(contentId)
      .then((data) => {
        if (mounted) {
          setExperiences(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load related experiences', err);
        if (mounted) setIsLoading(false);
      });
      
    return () => { mounted = false; };
  }, [contentId]);

  if (isLoading || experiences.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border-subtle/40 pointer-events-auto">
      <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-muted mb-4 flex items-center gap-2">
        <Activity className="w-3 h-3" />
        Part of an experience
      </h3>
      
      <div className="space-y-3">
        {experiences.map((exp) => {
          // Render a small visual chain
          const formatEventType = (type: string) => {
            if (!type) return 'Logged';
            if (type === 'STARTED_READING') return 'Started reading';
            if (type === 'FINISHED_READING') return 'Finished reading';
            return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
          };
          const chain = exp.events?.map(e => formatEventType(e.eventType)) || [];
          
          let dateStr = '';
          if (exp.events && exp.events.length > 0) {
            const firstDate = new Date(exp.events[0].eventAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const lastDate = new Date(exp.events[exp.events.length - 1].eventAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            dateStr = firstDate === lastDate ? firstDate : `${firstDate} — ${lastDate}`;
          }

          return (
            <Link 
              key={exp.id} 
              to={`/experience/${exp.id}`}
              className="block bg-bg-elevated/40 hover:bg-bg-elevated/80 border border-border-subtle hover:border-text-primary/30 rounded-xl p-4 transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-serif text-lg text-text-primary group-hover:text-text-primary/80 transition-colors">
                  {exp.title}
                </h4>
                {exp.events?.length && (
                  <span className="text-[10px] uppercase tracking-widest text-text-muted">
                    {exp.events.length} events
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary uppercase tracking-widest font-medium mb-3">
                {chain.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-text-muted/50 text-[10px]">→</span>}
                    <span>{c}</span>
                  </React.Fragment>
                ))}
              </div>

              {dateStr && (
                <div className="text-[10px] uppercase tracking-widest text-text-muted/70">
                  {dateStr}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
