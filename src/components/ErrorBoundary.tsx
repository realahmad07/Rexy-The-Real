import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.operationType && parsed.authInfo) {
            isFirestoreError = true;
            errorMessage = `Security Error: Insufficient permissions for ${parsed.operationType} on ${parsed.path || 'unknown path'}.`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-rexy-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-rexy-border rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">System Alert</h2>
            <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left border border-slate-100">
              <p className="text-sm font-mono text-slate-600 break-words">
                {errorMessage}
              </p>
              {isFirestoreError && (
                <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Please ensure your wallet is correctly connected and authorized.
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-rexy-primary text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-rexy-primary/20"
            >
              <RefreshCcw className="w-4 h-4" />
              Restart Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
