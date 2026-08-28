import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { Pattern } from '../../api/activity';

interface PatternCardProps {
  pattern: Pattern;
}

export function PatternCard({ pattern }: PatternCardProps) {
  return (
    <Link 
      to={`/patterns/${pattern.id}`}
      className="block relative overflow-hidden rounded-2xl bg-bg-elevated/40 border border-border-subtle hover:border-text-primary/30 transition-all group"
    >
      <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated via-bg-elevated/80 to-transparent z-10" />
        {pattern.covers.length > 0 && (
          <img 
            src={pattern.covers[0]} 
            alt="Theme background" 
            className="w-full h-full object-cover blur-sm"
          />
        )}
      </div>

      <div className="relative z-10 p-6 flex flex-col h-full justify-between min-h-[240px]">
        <div>
          <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-text-muted mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            You keep returning to...
          </h3>
          <h4 className="font-serif text-3xl text-text-primary capitalize leading-tight">
            {pattern.theme}
          </h4>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            {pattern.reason}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-text-primary">
            {pattern.breakdown.films > 0 && <span className="bg-bg-base/80 px-2 py-1 rounded">{pattern.breakdown.films} films</span>}
            {pattern.breakdown.books > 0 && <span className="bg-bg-base/80 px-2 py-1 rounded">{pattern.breakdown.books} books</span>}
            {pattern.breakdown.places > 0 && <span className="bg-bg-base/80 px-2 py-1 rounded">{pattern.breakdown.places} places</span>}
            {pattern.breakdown.tv_shows > 0 && <span className="bg-bg-base/80 px-2 py-1 rounded">{pattern.breakdown.tv_shows} shows</span>}
            {pattern.breakdown.songs > 0 && <span className="bg-bg-base/80 px-2 py-1 rounded">{pattern.breakdown.songs} songs</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
