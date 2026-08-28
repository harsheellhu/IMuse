import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowDown } from 'lucide-react';
import { activityApi, Pattern } from '../api/activity';
import { useSettingsStore } from '../store/useSettingsStore';

export function PatternThreadViewer() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { typography } = useSettingsStore();

  useEffect(() => {
    if (id) {
      activityApi.getPatternThread(id)
        .then(data => {
          setThread(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [id]);

  if (isLoading) return <div className="w-full min-h-screen pt-20 flex items-center justify-center">Loading...</div>;
  if (!thread) return <div className="w-full min-h-screen pt-20 flex items-center justify-center">Pattern not found.</div>;

  return (
    <div className={`w-full min-h-screen pb-32 typography-${typography}`}>
      <div className="w-full max-w-[800px] mx-auto px-6 pt-24 relative z-10">
        
        <div className="flex items-center justify-between mb-16">
          <Link to="/profile" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-4 block">
            Pattern Thread
          </span>
          <h1 className="text-4xl md:text-6xl font-serif text-text-primary capitalize leading-tight mb-8">
            {thread.theme}
          </h1>
          <div className="animate-bounce text-text-muted flex justify-center">
            <ArrowDown className="w-5 h-5" />
          </div>
        </motion.div>

        <div className="space-y-12">
          {thread.items.map((item: any, index: number) => (
            <motion.div 
              key={item.id + index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col md:flex-row items-center gap-8 bg-bg-elevated/30 border border-border-subtle p-6 rounded-2xl"
            >
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="w-32 h-48 object-cover rounded-lg shadow-md shrink-0"
                />
              )}
              <div className="flex-1 text-center md:text-left">
                <span className="text-[10px] uppercase tracking-widest text-text-muted mb-2 block">
                  {item.interaction_type} · {new Date(item.interaction_date).toLocaleDateString()}
                </span>
                <h3 className="font-serif text-2xl text-text-primary mb-2">{item.title}</h3>
                <span className="text-xs uppercase tracking-widest text-text-secondary">{item.type}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
