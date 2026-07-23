import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8" dir="rtl">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              خطایی رخ داده است
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              برنامه با خطای غیرمنتظره‌ای مواجه شد. لطفاً صفحه را بازخوانی کنید.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              تلاش مجدد
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
