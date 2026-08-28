import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Plus, User, Compass, Moon, Sun, Laptop, Palette, Paintbrush, SlidersHorizontal, Image, Link2, Book, Film, Tv, MapPin, Music } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import * as mm from 'music-metadata-browser';
import { musicDB } from '../../utils/musicDB';
import { Song } from '../../types';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser, 
    bgGradient, setBgGradient, isAuthenticated, setAuthModalOpen,
    isSearchOpen, setSearchOpen, searchQuery, setSearchQuery,
    preferences, setPreferences
  } = useStore();
  
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  
  // Make navbar background appear on scroll
  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.85]);
  const blur = useTransform(scrollY, [0, 50], [0, 16]);
  

  const navItems = [
    { label: 'Home', path: '/home' },
    { label: 'Explore World', path: '/explore' },
    { label: 'Books', path: '/books' },
    { label: 'Films', path: '/films' },
    { label: 'TV Shows', path: '/tv-shows' },
    { label: 'Places', path: '/places' },
    { label: 'Collections', path: '/collections' },
    { label: 'Music', path: '/music' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let metadata;
      let artworkUrl = undefined;
      
      try {
        metadata = await mm.parseBlob(file);
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const picture = metadata.common.picture[0];
          const base64String = btoa(
            new Uint8Array(picture.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          artworkUrl = `data:${picture.format};base64,${base64String}`;
        }
      } catch (metaErr) {
        console.warn('Metadata parsing failed, using fallback', metaErr);
      }

      const newSong: Song = {
        id: `song-${Date.now()}`,
        title: metadata?.common.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata?.common.artist || 'Unknown Artist',
        album: metadata?.common.album,
        albumArtist: metadata?.common.albumartist,
        genre: metadata?.common.genre?.[0],
        year: metadata?.common.year,
        duration: metadata?.format?.duration || 0,
        artworkUrl,
        addedAt: new Date().toISOString(),
        playCount: 0,
        isFavorite: false,
      };

      await musicDB.saveSong(newSong, file);
      
      // Navigate to music library so user can see it
      navigate('/music');
    } catch (err) {
      console.error('Error importing song:', err);
      alert('Failed to import song.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between transition-all duration-500"
      style={{
        backgroundColor: useTransform(bgOpacity, v => 
          `color-mix(in srgb, var(--color-background) ${Math.round(v * 100)}%, transparent)`
        ),
        backdropFilter: useTransform(blur, v => `blur(${v}px)`)
      }}
    >
      <div className="flex items-center gap-12">
        <Link to="/" className="text-xl font-serif font-medium tracking-tight text-text-primary">IMuse</Link>
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'relative text-[13px] tracking-wide transition-colors duration-300 py-2',
                  isActive ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-text-primary rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <button 
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full text-text-primary hover:bg-bg-secondary transition-colors duration-300"
        >
          <Search className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Create / Plus */}
        <div className="relative hidden md:block">
          <button 
            onClick={() => {
              setCreateMenuOpen(!createMenuOpen);
              setProfileMenuOpen(false);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full text-text-primary hover:bg-bg-secondary transition-colors duration-300"
          >
            <Plus className="w-5 h-5 stroke-[1.5]" />
          </button>
          <AnimatePresence>
            {createMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-0 w-48 bg-bg-elevated border border-border-subtle rounded-xl shadow-lg py-2 flex flex-col z-50 overflow-hidden"
              >
                {[
                  { icon: Image, label: 'Add inspiration' },
                  { icon: Book, label: 'Add book' },
                  { icon: Film, label: 'Add film' },
                  { icon: Tv, label: 'Add TV show' },
                  { icon: MapPin, label: 'Add place' },
                  { icon: Link2, label: 'Add link' },
                  { icon: Music, label: 'Add song' },
                  { icon: Plus, label: 'Create collection', divider: true }
                ].map((item, i) => (
                  <React.Fragment key={item.label}>
                    {item.divider && <div className="h-px bg-border-subtle/50 my-1 mx-3" />}
                    <button
                      onClick={() => {
                        setCreateMenuOpen(false);
                        if (item.label === 'Create collection') {
                          useStore.getState().interceptAction(() => {
                            useStore.getState().setCreateCollectionOpen(true);
                          });
                        } else if (item.label === 'Add song') {
                          fileInputRef.current?.click();
                        } else {
                          useStore.getState().interceptAction(() => {});
                        }
                      }}
                      className="px-4 py-2.5 text-[13px] text-left flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  </React.Fragment>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings (Customization) */}
        <div className="relative hidden md:block">
          <button 
            onClick={() => {
              useSettingsStore.getState().setSettingsOpen(true);
              setCreateMenuOpen(false);
              setProfileMenuOpen(false);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full text-text-primary hover:bg-bg-secondary transition-colors duration-300"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Laptop (Library) */}
        <Link 
          to="/library"
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-text-primary hover:bg-bg-secondary transition-colors duration-300"
        >
          <Laptop className="w-4 h-4" />
        </Link>

        {/* Profile */}
        <div className="relative">
          <button 
            onClick={() => {
              if (isAuthenticated) {
                setProfileMenuOpen(!profileMenuOpen);
                setCreateMenuOpen(false);
              } else {
                setAuthModalOpen(true);
              }
            }}
            className="block w-8 h-8 rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 border border-border-subtle"
          >
            {isAuthenticated ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
            ) : (
              <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-text-secondary" />
              </div>
            )}
          </button>

          <AnimatePresence>
            {profileMenuOpen && isAuthenticated && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-0 w-48 bg-bg-elevated border border-border-subtle rounded-xl shadow-lg py-2 flex flex-col z-50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-border-subtle/50 mb-1">
                  <p className="text-sm font-medium text-text-primary truncate">{currentUser.name}</p>
                  <p className="text-xs text-text-muted truncate">@{currentUser.id || 'user'}</p>
                </div>
                <Link to="/profile/me" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors">Your Profile</Link>
                <Link to="/library" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors">Library</Link>
                <Link to="/collections" onClick={() => setProfileMenuOpen(false)} className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors">Collections</Link>
                <div className="h-px bg-border-subtle/50 my-1 mx-3" />
                <button 
                  onClick={() => {
                    setProfileMenuOpen(false);
                    useStore.getState().logout();
                  }}
                  className="px-4 py-2 text-[13px] text-left text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="audio/*" 
        onChange={handleFileUpload} 
      />
    </motion.nav>
  );
}

export function MobileNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Compass, path: '/home' },
    { icon: Search, path: '/explore' },
    { icon: Plus, path: '/create' },
    { icon: User, path: '/profile/me' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-elevated/90 backdrop-blur-xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.2)] border border-border-subtle z-50 flex items-center justify-center gap-2 px-4 py-2 rounded-full">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/profile/me' && location.pathname.startsWith('/profile'));
        return (
          <Link key={idx} to={item.path} className="p-3 rounded-full hover:bg-bg-secondary transition-colors">
            <Icon className={clsx("w-5 h-5 transition-colors duration-300", isActive ? "text-text-primary" : "text-text-muted")} />
          </Link>
        );
      })}
    </div>
  );
}
