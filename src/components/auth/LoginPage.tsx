'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, UserCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '@/types';
import { AppStore } from '@/lib/app-store';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

interface MasterOption {
  id: string;
  name?: string;
  title?: string;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Status check
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [departments, setDepartments] = useState<MasterOption[]>([]);
  const [designations, setDesignations] = useState<MasterOption[]>([]);

  // Sign-in Form (Empty defaults for deploy-ready production)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Setup Super Admin Form (First run)
  const [setupFullName, setSetupFullName] = useState('');
  const [setupEmployeeId, setSetupEmployeeId] = useState('ADM-001');
  const [setupPassword, setSetupPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupDepartmentId, setSetupDepartmentId] = useState('');
  const [setupDesignationId, setSetupDesignationId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok) {
          const data = await res.json();
          if (data.initialized !== undefined) {
            setIsInitialized(!!data.initialized);
          }
          setDepartments(data.departments || []);
          setDesignations(data.designations || []);
          if (data.departments?.length > 0) {
            setSetupDepartmentId(data.departments[0].id);
          }
          if (data.designations?.length > 0) {
            setSetupDesignationId(data.designations[0].id);
          }
        }
      } catch (err) {
        console.warn('Auth status notice:', err);
      }
    }

    checkAuthStatus();
  }, []);

  // Handle standard real authentication (Employee ID or Email)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const query = identifier.trim();
    if (!query) {
      setError('Please enter your Employee ID.');
      setIsLoading(false);
      return;
    }

    if (!password || password.trim().length === 0) {
      setError('Please enter your password.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: query, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      const profile = data.profile || data.user;
      if (!profile) {
        setError('Profile data missing in response. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!profile.isActive) {
        setError('This employee account has been deactivated. Please contact Management.');
        setIsLoading(false);
        return;
      }

      AppStore.setCurrentUser(profile);
      onLoginSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Network error connecting to auth service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Initial Super Admin Creation
  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!setupFullName.trim()) {
      setError('Admin Full Name is required.');
      setIsLoading(false);
      return;
    }
    if (!setupEmployeeId.trim()) {
      setError('Admin Employee ID is required.');
      setIsLoading(false);
      return;
    }
    if (!setupPassword || setupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: setupFullName.trim(),
          employeeId: setupEmployeeId.trim().toUpperCase(),
          password: setupPassword,
          departmentId: setupDepartmentId || undefined,
          designationId: setupDesignationId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to setup Super Admin.');
        setIsLoading(false);
        return;
      }

      AppStore.setCurrentUser(data.profile);
      onLoginSuccess(data.profile);
    } catch (err: any) {
      setError(err.message || 'Network error initializing system.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="text-xs font-semibold tracking-wide uppercase">Connecting to Workforce Core...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tight, Deploy-Level Login Card */}
      <div className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 border border-slate-100 text-slate-900">
        {/* Top Brand Logo and Name */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="StaffTrack Logo"
              className="w-9 h-9 object-contain drop-shadow-xs"
            />
            <div>
              <div className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                StaffTrack
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight">Workforce Portal</div>
            </div>
          </div>

        </div>

        {/* Hero Illustration: Sized Naturally according to image aspect ratio */}
        <div className="w-full overflow-hidden rounded-2xl bg-white border border-slate-100 p-1 shadow-xs">
          <img
            src="/login-hero.jpg"
            alt="Workplace Collaboration & Attendance"
            className="w-full h-auto object-contain block transition-transform duration-300 hover:scale-[1.01]"
          />
        </div>

        {/* Form Content */}
        {!isInitialized ? (
          /* Initial Setup Super Admin Screen */
          <div className="space-y-4 pt-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>First-Time Workspace Setup</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Create Admin Account
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up your primary administrator account to begin live workforce tracking.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSetupAdmin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={setupEmployeeId}
                    onChange={(e) => setSetupEmployeeId(e.target.value)}
                    placeholder="ADM-001"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-mono uppercase placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Department
                  </label>
                  <select
                    value={setupDepartmentId}
                    onChange={(e) => setSetupDepartmentId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:border-red-500 transition"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Password (min 6 chars) *
                </label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showSetupPassword ? 'Hide password' : 'View password'}
                    aria-label={showSetupPassword ? 'Hide password' : 'View password'}
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-red-600/30 transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Create Super Admin & Launch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Standard Production Sign In Screen (Tight & Deploy-Ready) */
          <div className="space-y-4 pt-1">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your Employee ID to access the portal
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. EMP-101"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-mono uppercase placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'View password'}
                    aria-label={showPassword ? 'Hide password' : 'View password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-red-600/25 transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Employee account help?</span>
              <span className="text-red-600 font-semibold">Contact HR / Admin</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
