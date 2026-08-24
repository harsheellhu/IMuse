import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Key } from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setAuthModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      login(); // Calls our mock login which persists to localStorage and sets isAuthenticated=true
    }, 800);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm"
            onClick={() => setAuthModalOpen(false)}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-bg-elevated border border-border-subtle shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors p-2"
              aria-label="Close authentication modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-serif tracking-tight text-text-primary mb-2">
                  {mode === 'signin' ? 'Welcome back' : 'Join the archive'}
                </h2>
                <p className="text-sm text-text-secondary font-light">
                  {mode === 'signin' 
                    ? 'Sign in to access your saved items and collections.' 
                    : 'Create an account to start curating your own visual universe.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-bg-secondary border border-transparent focus:border-border-subtle focus:bg-bg-elevated rounded-none text-sm text-text-primary placeholder:text-text-muted transition-all outline-none"
                    required
                  />
                </div>

                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-bg-secondary border border-transparent focus:border-border-subtle focus:bg-bg-elevated rounded-none text-sm text-text-primary placeholder:text-text-muted transition-all outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full h-12 bg-text-primary text-bg-base flex items-center justify-center text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors tracking-wide underline-offset-4 hover:underline"
                >
                  {mode === 'signin' 
                    ? "Don't have an account? Create one." 
                    : "Already have an account? Sign in."}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
