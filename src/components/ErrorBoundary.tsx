"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="border border-red-500/20 bg-red-500/5 px-6 py-4 max-w-md text-center">
            <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest mb-2">
              System_Error
            </p>
            <p className="text-sm text-white/60 mb-3">
              Something went wrong rendering this section.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-[9px] font-mono uppercase tracking-widest text-shift5-orange border border-shift5-orange/30 px-3 py-1 hover:bg-shift5-orange/10 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
