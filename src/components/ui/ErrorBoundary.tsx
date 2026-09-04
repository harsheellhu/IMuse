import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props!: Props;
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[iMUSE ErrorBoundary Caught]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base text-text-primary p-6 selection:bg-text-primary selection:text-bg-base">
          <div className="w-full max-w-md p-8 rounded-2xl bg-surface/50 border border-border-subtle backdrop-blur-xl text-center flex flex-col items-center gap-4 shadow-2xl">
            <div className="font-serif text-2xl tracking-wide font-medium">iMuse</div>
            <div className="text-xs uppercase tracking-widest text-text-muted font-mono">Resilience Shield</div>
            <p className="text-sm text-text-secondary mt-2">
              An unexpected render anomaly occurred, but your local state remains safe.
            </p>
            {this.state.error && (
              <pre className="w-full p-3 rounded-lg bg-bg-base/80 text-[11px] font-mono text-left text-text-muted overflow-x-auto max-h-28 border border-border-subtle/50">
                {this.state.error.message || 'Unknown error'}
              </pre>
            )}
            <div className="flex gap-3 mt-4 w-full">
              <button
                onClick={this.handleHome}
                className="flex-1 py-2.5 px-4 rounded-xl bg-surface border border-border-subtle text-xs uppercase tracking-wider font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                Return Home
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-text-primary text-bg-base text-xs uppercase tracking-wider font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-md"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
