'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('StaffTrack App Error Boundary caught:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        // Force complete cache-busting reload
        window.location.href = window.location.origin + '?ts=' + Date.now();
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Connection or Cache Update
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            A temporary browser session or network sync issue occurred. Clearing local session data will restore normal operation immediately.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">
              Diagnostic Notice
            </span>
            <p className="text-xs font-mono text-rose-300 break-words line-clamp-2">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleClearCacheAndReload}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Clear Cache & Reload App</span>
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full h-10 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition active:scale-[0.98] cursor-pointer"
          >
            Try Again
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
          StaffTrack Attendance System
        </div>
      </div>
    </div>
  );
}
