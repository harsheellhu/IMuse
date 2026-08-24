import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Plus, User, Compass, Moon, Sun, Laptop, Palette, Paintbrush, SlidersHorizontal, Image, Link2, Book, Film } from 'lucide-react';
import { useStore, Theme, ColorMode } from '../../store/useStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import clsx from 'clsx';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentUser, theme, setTheme, colorMode, setColorMode, 
    bgGradient, setBgGradient, isAuthenticated, setAuthModalOpen,
    isSearchOpen, setSearchOpen, searchQuery, setSearchQuery,
    preferences, setPreferences
  } = useStore();
  
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [gradientMenuOpen, setGradientMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [customizationMenuOpen, setCustomizationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  
  // Make navbar background appear on scroll
  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.85]);
  const blur = useTransform(scrollY, [0, 50], [0, 16]);
  
  // Check if we are in dark mode visually
  const isDark = document.documentElement.classList.contains('dark');

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Explore World', path: '/explore' },
    { label: 'Books', path: '/books' },
    { label: 'Films', path: '/films' },
    { label: 'Collections', path: '/collections' },
  ];

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between transition-all duration-500"
      style={{ 
        backgroundColor: useTransform(bgOpacity, v => 
          isDark ? `rgba(10, 10, 10, ${v})` : `rgba(253, 252, 251, ${v})`
        ),
        backdropFilter: useTransform(blur, v => `blur(${v}px)`)
      }}
    >
      <div className="flex items-center gap-12">
        <Link to="/" className="text-xl font-serif font-medium tracking-tight text-text-primary">IMuse</Link>
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'text-[13px] tracking-wide transition-colors duration-300',
                location.pathname === item.path ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {item.label}
            </Link>
          ))}
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
              setGradientMenuOpen(false);
              setCustomizationMenuOpen(false);
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
                  { icon: Link2, label: 'Add link' },
                  { icon: Plus, label: 'Create collection', divider: true }
                ].map((item, i) => (
                  <React.Fragment key={item.label}>
                    {item.divider && <div className="h-px bg-border-subtle/50 my-1 mx-3" />}
                    <button
                      onClick={() => {
                        setCreateMenuOpen(false);
                        if (!isAuthenticated) setAuthModalOpen(true);
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
                setGradientMenuOpen(false);
                setCreateMenuOpen(false);
                setCustomizationMenuOpen(false);
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
    </motion.nav>
  );
}

export function MobileNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Compass, path: '/' },
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
