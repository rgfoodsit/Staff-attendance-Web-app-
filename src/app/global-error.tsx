'use client';

import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = window.location.origin + '?ts=' + Date.now();
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Application Refresh Needed
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              The application encountered a browser cache synchronization error. Clear session cache to load the latest build.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleClearCacheAndReload}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Cache & Reload App</span>
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="w-full h-10 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
