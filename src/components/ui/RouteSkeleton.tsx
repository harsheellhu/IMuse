import React from 'react';

export function RouteSkeleton() {
  return (
    <div className="w-full min-h-[calc(100vh-6rem)] px-6 md:px-12 py-8 animate-pulse">
      <div className="w-48 h-8 rounded-lg bg-surface/60 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-surface/40 border border-border-subtle/40" />
        ))}
      </div>
    </div>
  );
}
