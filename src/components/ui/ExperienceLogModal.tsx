import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Clock } from 'lucide-react';
import { Post } from '../../types';
import { experiencesApi } from '../../api/experiences';

interface ExperienceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Post; // Can be any content type
}

export function ExperienceLogModal({ isOpen, onClose, content }: ExperienceLogModalProps) {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setStep(1);
    setEventType('');
    setDate('');
    setTime('');
    setLocationName('');
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      let datePrecision: 'exact' | 'day' = 'day';
      let finalEventAt = new Date().toISOString();
      
      if (date) {
        const d = new Date(date);
        if (time) {
          const [hours, minutes] = time.split(':');
          d.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          datePrecision = 'exact';
        }
        finalEventAt = d.toISOString();
      }

      await experiencesApi.logEvent('new', {
        contentId: content.id,
        eventType,
        eventAt: finalEventAt,
        datePrecision,
        locationName: locationName || undefined,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to log experience:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypes = () => {
    switch (content.type) {
      case 'book': return ['Read', 'Started reading', 'Finished reading'];
      case 'film':
      case 'tv-show': return ['Watched', 'Rewatched'];
      case 'place': return ['Visited'];
      default: return ['Discovered', 'Saved', 'Experienced'];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-between items-center p-4 border-b border-border-subtle/50">
                <h3 className="text-sm font-medium uppercase tracking-widest text-text-primary">
                  Log Experience
                </h3>
                <button onClick={handleClose} className="p-2 hover:bg-bg-base/50 rounded-full transition-colors text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  {content.imageUrl && (
                    <img src={content.imageUrl} alt={content.title} className="w-12 h-12 object-cover rounded-md shadow-sm" />
                  )}
                  <div>
                    <h4 className="font-serif text-lg text-text-primary line-clamp-1">{content.title}</h4>
                    <p className="text-xs uppercase tracking-widest text-text-muted">{content.type}</p>
                  </div>
                </div>

                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h4 className="text-sm text-text-secondary">What did you do?</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {getEventTypes().map((type) => (
                        <button
                          key={type}
                          onClick={() => { setEventType(type); setStep(2); }}
                          className="px-4 py-3 text-left rounded-xl border border-border-subtle hover:border-text-primary hover:bg-bg-base/50 transition-colors text-text-primary"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="space-y-3">
                      <label className="text-sm text-text-secondary flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> When? (Optional)
                      </label>
                      <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-text-primary"
                      />
                    </div>
                    
                    {date && (
                      <div className="space-y-3">
                        <label className="text-sm text-text-secondary flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Time? (Optional)
                        </label>
                        <input 
                          type="time" 
                          value={time} 
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-text-primary"
                        />
                      </div>
                    )}

                    {['Visited', 'Watched'].includes(eventType) && (
                      <div className="space-y-3">
                        <label className="text-sm text-text-secondary flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Where? (Optional)
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. Athens, Greece or Home"
                          value={locationName} 
                          onChange={(e) => setLocationName(e.target.value)}
                          className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-text-primary"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle/50">
                      <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
                        Back
                      </button>
                      <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-text-primary text-bg-base rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
