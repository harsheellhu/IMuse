import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Key, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { authApi } from '../../api/auth';
import clsx from 'clsx';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        const user = await authApi.login({ email, password });
        useStore.setState({ currentUser: user });
        login();
      } else {
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        const user = await authApi.register({ username, email, password });
        useStore.setState({ currentUser: user as any });
        login();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
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

              {/* Separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-[10px] tracking-widest uppercase text-text-muted">or</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Demo Login */}
              <button
                onClick={async () => {
                  setIsLoading(true);
                  setError(null);
                  try {
                    const user = await authApi.login({ email: 'demo@imuse.app', password: 'demo' });
                    useStore.setState({ currentUser: user });
                    login();
                  } catch (err: any) {
                    setError(err.message || 'Demo login failed');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full h-12 border border-border-subtle text-text-primary flex items-center justify-center text-xs uppercase tracking-[0.2em] hover:bg-bg-secondary transition-all disabled:opacity-50 gap-2"
              >
                <Zap className="w-4 h-4" />
                Try Demo — No Sign Up Needed
              </button>

              <div className="mt-6 text-center">
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
