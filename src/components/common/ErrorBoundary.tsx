import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0c0c0e] text-zinc-100 font-sans">
          <div className="bg-[#151518] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Title & Desc */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Une erreur inattendue est survenue</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                L'application a rencontré un problème lors de l'affichage. Vous pouvez rafraîchir la page ou réinitialiser les données locales si le problème persiste.
              </p>
            </div>

            {/* Error Detail Message */}
            {this.state.error && (
              <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-left overflow-x-auto max-h-32 text-[11px] font-mono text-red-300/90">
                <span className="font-bold">{this.state.error.toString()}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 h-11 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-amber-950/50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Rafraîchir la page</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full sm:w-auto flex-1 h-11 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-orange-400" />
                <span>Réinitialiser les données</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
