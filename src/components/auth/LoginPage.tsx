'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { UserProfile, UserRole } from '@/types';
import { AppStore } from '@/lib/app-store';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const profiles = AppStore.getProfiles();
    const user = profiles.find(
      (p) => p.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
    );

    if (!user) {
      setError('Employee ID not recognized. Please verify or use a demo account below.');
      setIsLoading(false);
      return;
    }

    if (!user.isActive) {
      setError('This employee account has been deactivated. Please contact HR or Admin.');
      setIsLoading(false);
      return;
    }

    // Success
    AppStore.setCurrentUser(user);
    onLoginSuccess(user);
    setIsLoading(false);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const user = AppStore.switchRole(role);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-3 sm:p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-3 sm:p-4 gap-4">
        
        {/* Left Column: Clean Hero Illustration Card */}
        <div className="lg:col-span-6 xl:col-span-7 relative rounded-[2rem] bg-gradient-to-b from-[#E8EFFB] via-[#E2ECFA] to-[#D8E6F9] overflow-hidden flex items-center justify-center p-6 sm:p-10 min-h-[380px] lg:min-h-[540px] border border-slate-200/60 shadow-inner">
          <img
            src="/login-hero.jpg"
            alt="Team Collaboration & Attendance"
            className="w-full max-w-lg h-auto object-contain rounded-2xl drop-shadow-md transition-transform duration-500 hover:scale-[1.02] z-10"
          />
        </div>

        {/* Right Column: Clean White Authentication Form */}
        <div className="lg:col-span-6 xl:col-span-5 p-4 sm:p-8 flex flex-col justify-between space-y-6 bg-white text-slate-900">
          {/* Top Brand Logo and Name */}
          <div className="flex items-center">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="puchIn Logo"
                className="w-8 h-8 rounded-xl object-contain shadow-xs"
              />
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                puchIn
              </span>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-5 my-auto">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Sign in
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Welcome to puchIn Workforce Portal
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Employee ID or Email"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-red-500 hover:text-red-600 font-semibold transition"
                >
                  Forgot password ?
                </button>
              </div>

              {/* Or Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">
                  or
                </span>
              </div>

              {/* Instant Role Demo Picker */}
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl text-center">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('employee')}
                    className="py-2 text-[11px] font-semibold rounded-lg hover:bg-white hover:shadow-xs transition text-slate-700"
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('hr')}
                    className="py-2 text-[11px] font-semibold rounded-lg hover:bg-white hover:shadow-xs transition text-slate-700"
                  >
                    HR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="py-2 text-[11px] font-semibold rounded-lg hover:bg-white hover:shadow-xs transition text-slate-700"
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Vibrant Red Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-lg shadow-red-600/30 transition text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign in</span>
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center pt-1">
              Don&apos;t have an account?{' '}
              <span className="text-red-500 font-semibold hover:underline cursor-pointer">
                Contact HR
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
