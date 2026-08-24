import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="w-full relative flex items-center justify-center overflow-hidden bg-black" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      {/* Absolute full cover black-and-white background image */}
      <div 
        className="absolute -top-24 -left-0 -right-0 -bottom-32 md:-bottom-12 z-0 bg-cover bg-center grayscale opacity-40"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600697395543-ef3ee6e9af7b?q=80&w=2070&auto=format&fit=crop)' }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
        <motion.h1 
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.2em' }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-white text-4xl md:text-6xl font-sans uppercase tracking-[0.2em] mb-8 font-light"
        >
          IMuse
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 1 }}
          className="text-gray-300 text-xs md:text-sm max-w-md tracking-[0.15em] uppercase font-light leading-relaxed mb-12"
        >
          A minimalist curation of things worth keeping
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2 }}
        >
          <Link 
            to="/explore" 
            className="border border-white text-white px-10 py-4 uppercase tracking-[0.2em] text-xs transition-all hover:bg-white hover:text-black duration-700 backdrop-blur-sm"
          >
            Enter Gallery
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
