import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingCardProps {
  key?: React.Key;
  id: string;
  title: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  previewNode?: React.ReactNode;
}

export function SettingCard({ id, title, description, isSelected, onClick, previewNode }: SettingCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        "relative flex-shrink-0 w-64 h-48 rounded-xl border text-left overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary",
        isSelected 
          ? "border-text-primary shadow-sm" 
          : "border-border-subtle hover:border-text-secondary"
      )}
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-bg-secondary/50 overflow-hidden pointer-events-none">
        {previewNode}
      </div>
      
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg-base/90 via-bg-base/40 to-transparent pointer-events-none" />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-end z-20 pointer-events-none">
        <div className="flex items-center justify-between">
          <h3 className={clsx(
            "text-sm font-medium transition-colors",
            isSelected ? "text-text-primary" : "text-text-secondary"
          )}>{title}</h3>
          
          {isSelected && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-5 h-5 rounded-full bg-text-primary text-bg-base flex items-center justify-center"
            >
              <Check className="w-3 h-3" />
            </motion.div>
          )}
        </div>
        {description && (
          <p className="text-xs text-text-muted mt-1 max-w-[85%] leading-relaxed">{description}</p>
        )}
      </div>
    </motion.button>
  );
}
