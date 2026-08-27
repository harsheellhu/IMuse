import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Edit2, MapPin, Clock, Calendar, Share2, MoreHorizontal, Trash } from 'lucide-react';
import { Experience } from '../types';
import { experiencesApi } from '../api/experiences';
import { useSettingsStore } from '../store/useSettingsStore';
import clsx from 'clsx';
import { useImagePalette } from '../hooks/useImagePalette';

export function ExperiencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { motion: motionMode, typography } = useSettingsStore();

  const primaryImage = experience?.events?.[0]?.imageUrl;
  const { palette } = useImagePalette(primaryImage || '');

  useEffect(() => {
    if (id) {
      experiencesApi.getById(id)
        .then(data => {
          setExperience(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this connected experience?')) {
      if (id) {
        await experiencesApi.delete(id);
        navigate('/profile');
      }
    }
  };

  if (isLoading) {
    return <div className="w-full min-h-screen pt-20 flex items-center justify-center">Loading...</div>;
  }

  if (!experience) {
    return <div className="w-full min-h-screen pt-20 flex items-center justify-center">Experience not found.</div>;
  }

  // Calculate intervals
  const eventsWithIntervals = experience.events?.map((ev, index, arr) => {
    let intervalDays = 0;
    if (index > 0) {
      const prevDate = new Date(arr[index - 1].eventAt);
      const currDate = new Date(ev.eventAt);
      intervalDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return { ...ev, intervalDays };
  });

  return (
    <div 
      className={clsx(
        "w-full min-h-screen pb-32 transition-colors duration-1000 relative",
        `typography-${typography}`
      )}
      style={{
        backgroundColor: palette?.vibrant ? `${palette.vibrant}08` : undefined
      }}
    >
      {/* Ambient background blur */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-40 transition-colors duration-1000 mix-blend-screen"
        style={{
          background: palette?.vibrant 
            ? `radial-gradient(circle at 50% 0%, ${palette.vibrant}33, transparent 70%)` 
            : 'none'
        }}
      />

      <div className="w-full max-w-[1200px] mx-auto px-6 md:px-12 pt-24 relative z-10">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-16">
          <Link to="/profile" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" />
            <span>Profile</span>
          </Link>
          
          <div className="flex gap-4">
            <button className="text-text-secondary hover:text-text-primary transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="text-text-secondary hover:text-red-500 transition-colors">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Title */}
        <motion.div 
          initial={motionMode !== 'static' ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mb-24"
        >
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary mb-4 block">
            Connected Experience
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-text-primary mb-6 leading-tight">
            {experience.title}
          </h1>
          {experience.description && (
            <p className="text-lg text-text-secondary font-light">
              {experience.description}
            </p>
          )}
        </motion.div>

        {/* Constellation / Timeline */}
        <div className="relative max-w-4xl mx-auto pl-4 md:pl-0">
          {eventsWithIntervals?.map((ev, index) => {
            const isLast = index === (eventsWithIntervals.length - 1);
            
            return (
              <div key={ev.id} className="relative flex flex-col md:flex-row gap-8 md:gap-16 mb-20 group">
                
                {/* Connecting Line */}
                {!isLast && (
                  <div className="absolute left-[11px] md:left-[50%] md:-ml-px top-8 bottom-[-5rem] w-[2px] bg-border-subtle/50 group-hover:bg-text-primary/20 transition-colors" />
                )}

                {/* Timeline Dot (Mobile: left, Desktop: center) */}
                <div className="absolute left-0 md:left-1/2 top-4 w-6 h-6 -ml-3 md:-ml-3 rounded-full bg-bg-base border-[3px] border-text-primary z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-primary" />
                </div>

                {/* Date & Event Type (Left side on desktop) */}
                <div className="md:w-1/2 md:text-right pt-2 pl-10 md:pl-0 md:pr-12 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
                    {ev.eventType}
                  </div>
                  <div className="text-sm text-text-secondary flex items-center md:justify-end gap-2">
                    {new Date(ev.eventAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: ev.datePrecision !== 'month' && ev.datePrecision !== 'year' ? 'numeric' : undefined 
                    })}
                  </div>
                  {ev.datePrecision === 'exact' && (
                    <div className="text-xs text-text-muted flex items-center md:justify-end gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.eventAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {ev.locationName && (
                    <div className="text-xs text-text-muted flex items-center md:justify-end gap-1.5 pt-1">
                      <MapPin className="w-3 h-3" />
                      {ev.locationName}
                    </div>
                  )}
                  
                  {ev.intervalDays > 0 && (
                    <div className="mt-8 pt-8 text-[10px] uppercase tracking-widest text-text-muted/50 hidden md:block">
                      {ev.intervalDays} days later
                    </div>
                  )}
                </div>

                {/* Content Card (Right side on desktop) */}
                <motion.div 
                  initial={motionMode !== 'static' ? { opacity: 0, x: 20 } : false}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="md:w-1/2 pl-10 md:pl-12"
                >
                  <div className="bg-bg-elevated/50 backdrop-blur-sm border border-border-subtle rounded-2xl overflow-hidden hover:border-text-primary/30 transition-colors p-4 group/card">
                    <div className="flex gap-4">
                      {ev.imageUrl ? (
                        <img 
                          src={ev.imageUrl} 
                          alt={ev.contentTitle}
                          className="w-20 h-28 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-28 bg-bg-base rounded-lg flex items-center justify-center border border-border-subtle">
                          <span className="text-xs text-text-muted uppercase">{ev.contentType}</span>
                        </div>
                      )}
                      <div className="flex-1 py-1">
                        <span className="text-[10px] uppercase tracking-widest text-text-muted mb-1 block">
                          {ev.contentType}
                        </span>
                        <h4 className="font-serif text-lg text-text-primary leading-tight mb-2 line-clamp-2">
                          {ev.contentTitle}
                        </h4>
                        {ev.note && (
                          <p className="text-sm text-text-secondary italic line-clamp-3 bg-bg-base/50 p-2 rounded-md">
                            "{ev.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {ev.intervalDays > 0 && (
                    <div className="mt-6 text-[10px] uppercase tracking-widest text-text-muted/50 md:hidden">
                      {ev.intervalDays} days later
                    </div>
                  )}
                </motion.div>
                
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
