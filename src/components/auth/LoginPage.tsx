'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';
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
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [departments, setDepartments] = useState<MasterOption[]>([]);
  const [designations, setDesignations] = useState<MasterOption[]>([]);

  // Sign-in Form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Setup Super Admin Form (First run)
  const [setupFullName, setSetupFullName] = useState('');
  const [setupEmployeeId, setSetupEmployeeId] = useState('ADM-001');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
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
          setIsInitialized(!!data.initialized);
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
        console.error('Failed to query auth status:', err);
      } finally {
        setCheckingStatus(false);
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
      setError('Please enter your Employee ID or Work Email.');
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

      if (!data.profile?.isActive) {
        setError('This employee account has been deactivated. Please contact Management.');
        setIsLoading(false);
        return;
      }

      AppStore.setCurrentUser(data.profile);
      onLoginSuccess(data.profile);
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
    if (!setupEmail.trim()) {
      setError('Official Work Email is required.');
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
          email: setupEmail.trim().toLowerCase(),
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
            {!isInitialized ? (
              /* Initial Setup Super Admin Screen */
              <>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>First-Time Workspace Setup</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Create Admin
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Set up your primary organization administrator account to begin live workforce tracking.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                      placeholder="e.g. Alex Morgan"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
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
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-mono uppercase placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Department
                      </label>
                      <select
                        value={setupDepartmentId}
                        onChange={(e) => setSetupDepartmentId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-hidden focus:border-red-500 transition"
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
                      Official Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-lg shadow-red-600/30 transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
              </>
            ) : (
              /* Standard Production Sign In Screen */
              <>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Sign in
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in with your Employee ID or Work Email
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Employee ID or Email
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. ADM-001 or name@company.com"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-lg shadow-red-600/30 transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Need an employee account?</span>
                  <span className="text-red-600 font-semibold">Contact your HR or Admin</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
