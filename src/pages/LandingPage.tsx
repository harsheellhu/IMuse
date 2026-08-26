import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';
import { SlideshowLanding } from '../components/landing/SlideshowLanding';
import { landingFeatures } from '../utils/landingData';

export function LandingPage() {
  const { skipLandingPage } = useSettingsStore();

  if (skipLandingPage) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-bg-base overflow-hidden selection:bg-text-primary selection:text-bg-base">
      {/* 
        The SlideshowLanding component handles the immersive background, captions, 
        and the ambient background coloring. We pass our curated landing dataset.
      */}
      <SlideshowLanding features={landingFeatures} />

      {/* 
        Restrained, minimal Navigation overlay for the Landing Page.
        This sits ABOVE the slideshow z-index.
      */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 md:p-12 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <Link to="/" className="text-base md:text-lg font-serif font-medium tracking-wide text-white drop-shadow-md mix-blend-normal opacity-90 hover:opacity-100 transition-opacity">
            IMuse
          </Link>
        </div>
        <div className="pointer-events-auto">
          <Link 
            to="/home" 
            className="flex items-center gap-2 text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors group mix-blend-normal drop-shadow-md"
          >
            <span>Enter IMuse</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
