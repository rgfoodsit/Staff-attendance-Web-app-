'use client';

import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Building2, 
  History, 
  Save, 
  ShieldCheck,
  AlertTriangle,
  FileEdit,
  RefreshCw,
  XCircle,
  MapPin,
  Lock,
  Briefcase,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { UserProfile, AttendanceRecord, AttendanceSettings, DailyWorkReport, AttendanceCorrection } from '@/types';
import { formatTime, formatDate, formatDuration, getLocalDateString } from '@/lib/utils';
import { LiveAttendanceModal } from './LiveAttendanceModal';
import { LeaveModal } from './LeaveModal';
import { CorrectionModal } from './CorrectionModal';

interface EmployeeViewProps {
  currentUser: UserProfile;
  todayRecord?: AttendanceRecord;
  historyRecords: AttendanceRecord[];
  todayReport?: DailyWorkReport;
  settings: AttendanceSettings;
  corrections?: AttendanceCorrection[];
  activeTab?: 'home' | 'history' | 'profile';
  onTabChange?: (tab: 'home' | 'history' | 'profile') => void;
  onCheckIn: (data: { selfieUrl: string; latitude: number; longitude: number; locationName: string }) => void;
  onCheckOut: (data: { selfieUrl: string; latitude: number; longitude: number; locationName: string }) => void;
  onMarkLeave: (data: { isHalfDay: boolean; halfType?: 'first_half' | 'second_half'; reason: string; comment?: string }) => void;
  onSaveWorkReport: (text: string) => void;
  onSubmitCorrection: (data: any) => void;
  onRefresh?: () => void;
  onLogout: () => void;
}

export function EmployeeView({
  currentUser,
  todayRecord,
  historyRecords,
  todayReport,
  settings,
  corrections = [],
  activeTab: propActiveTab,
  onTabChange,
  onCheckIn,
  onCheckOut,
  onMarkLeave,
  onSaveWorkReport,
  onSubmitCorrection,
  onRefresh,
  onLogout,
}: EmployeeViewProps) {
  const [modalType, setModalType] = useState<'checkin' | 'checkout' | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedCorrectionRecord, setSelectedCorrectionRecord] = useState<AttendanceRecord | null>(null);
  const [reportText, setReportText] = useState(todayReport?.reportText || '');
  const [reportSaved, setReportSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time second clock tick for terminal live feeling
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [internalTab, setInternalTab] = useState<'home' | 'history' | 'profile'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlTab = new URLSearchParams(window.location.search).get('tab');
        if (urlTab === 'history' || urlTab === 'profile' || urlTab === 'home') {
          return urlTab as 'home' | 'history' | 'profile';
        }
        const saved = sessionStorage.getItem('staff_app_employee_tab') || localStorage.getItem('staff_app_employee_tab');
        if (saved === 'history' || saved === 'profile' || saved === 'home') {
          return saved as 'home' | 'history' | 'profile';
        }
      } catch {}
    }
    return propActiveTab || 'home';
  });

  const activeTab = propActiveTab !== undefined ? propActiveTab : internalTab;

  useEffect(() => {
    if (propActiveTab) {
      setInternalTab(propActiveTab);
    }
  }, [propActiveTab]);

  useEffect(() => {
    if (todayReport?.reportText !== undefined) {
      setReportText(todayReport.reportText);
    }
  }, [todayReport?.reportText]);

  const setActiveTab = (tab: 'home' | 'history' | 'profile') => {
    setInternalTab(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('staff_app_employee_tab', tab);
        localStorage.setItem('staff_app_employee_tab', tab);
        const url = new URL(window.location.href);
        if (url.searchParams.get('tab') !== tab) {
          url.searchParams.set('tab', tab);
          window.history.replaceState(null, '', url.toString());
        }
      } catch {}
    }
    onTabChange?.(tab);
  };

  const hasCheckedIn = !!todayRecord?.checkinTime && todayRecord?.status !== 'forgotten_checkout';
  const hasCheckedOut = !!todayRecord?.checkoutTime && todayRecord?.status !== 'forgotten_checkout';
  const isOnLeave = todayRecord?.status === 'leave';
  const isHalfDayLeave = todayRecord?.status === 'half_day_leave';

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWorkReport(reportText);
    setReportSaved(true);
    setTimeout(() => setReportSaved(false), 3000);
  };

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusBadge = () => {
    if (!todayRecord || todayRecord.status === 'forgotten_checkout') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Not Checked In
        </span>
      );
    }
    if (todayRecord.status === 'leave') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Full-Day Leave
        </span>
      );
    }
    if (todayRecord.status === 'half_day_leave') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Half-Day Leave ({todayRecord.leaveType === 'first_half' ? '1st Half' : '2nd Half'})
        </span>
      );
    }
    if (hasCheckedOut) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Shift Completed
        </span>
      );
    }
    if (hasCheckedIn) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs ${
          todayRecord.isLate
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${todayRecord.isLate ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} />
          Active on Shift ({todayRecord.isLate ? 'Late Arrival' : 'On-Time'})
        </span>
      );
    }
    return null;
  };

  // Quick statistics for Profile Tab
  const totalDaysLogged = historyRecords.length;
  const onTimeCount = historyRecords.filter(r => !r.isLate && r.status === 'present').length;
  const onTimePercentage = totalDaysLogged > 0 ? Math.round((onTimeCount / totalDaysLogged) * 100) : 100;
  const leaveCount = historyRecords.filter(r => r.status === 'leave' || r.status === 'half_day_leave').length;

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-950 text-slate-100 relative font-sans selection:bg-indigo-500/30">
      {/* Native App Top Header (Integrated & Blur) */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between pt-safe">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/logo.png"
              alt="StaffTrack"
              className="w-8 h-8 object-contain drop-shadow-md"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                StaffTrack
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                PORTAL
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-tight">Workforce Attendance</div>
          </div>
        </div>

        <div className="flex items-center">
          {/* Refresh Action Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setTimeout(() => setIsRefreshing(false), 500);
                }
              }}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 transition active:scale-95 cursor-pointer shadow-xs"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-28">
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* TAB 1: TODAY'S ATTENDANCE DASHBOARD */}
          {activeTab === 'home' && (
            <>
              {/* Employee Welcome & Identity Card (Integrated seamlessly without scroll clipping) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-950 border border-indigo-500/20 p-4.5 shadow-xl backdrop-blur-xl">
                {/* Decorative Ambient Radial Highlights */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-600/30 ring-2 ring-white/10 shrink-0">
                      {(currentUser?.fullName || 'User').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                        {getGreeting()}
                      </span>
                      <h2 className="text-base font-bold tracking-tight text-white truncate">
                        {currentUser?.fullName || 'Employee'}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                        <span className="text-indigo-200/90 font-medium truncate">{currentUser?.designationTitle || 'Staff'}</span>
                        <span>&bull;</span>
                        <span className="truncate">{currentUser?.departmentName || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      ID: {currentUser?.employeeId || 'EMP'}
                    </span>
                    <span className="block mt-1 text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's Live Attendance Status Card (Biometric Terminal Style) */}
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-5 shadow-xl backdrop-blur-md space-y-4 relative overflow-hidden">
                {/* Header row with date and digital clock */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-tight uppercase">
                        Today's Attendance
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Digital Clock Pill */}
                  <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
                    <div className="font-mono text-xs font-bold text-indigo-300 tracking-wider">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Working Duration */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Shift Status
                    </span>
                    {getStatusBadge()}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Working Duration
                    </span>
                    <div className="text-base font-extrabold text-white tracking-tight font-mono">
                      {formatDuration(todayRecord?.workingDurationMinutes)}
                    </div>
                  </div>
                </div>

                {/* Metric Dual Cards: Check-in & Check-out Evidence */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                      <LogIn className="w-3 h-3" />
                      <span>CHECK-IN</span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      {formatTime(todayRecord?.effectiveCheckinTime || todayRecord?.checkinTime) || '--:--'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {todayRecord?.checkinTime ? (todayRecord.isLate ? 'Marked Late' : 'On-Time') : 'Not recorded'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-400">
                      <LogOut className="w-3 h-3" />
                      <span>CHECK-OUT</span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      {formatTime(todayRecord?.effectiveCheckoutTime || todayRecord?.checkoutTime) || '--:--'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {todayRecord?.checkoutTime ? 'Shift Completed' : 'Pending end of shift'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Attendance Action (CTA Button) */}
              <div className="space-y-3">
                {!hasCheckedIn ? (
                  /* Check-in CTA Button */
                  <button
                    onClick={() => setModalType('checkin')}
                    disabled={isOnLeave}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20 group-hover:scale-105 transition">
                        <LogIn className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-base tracking-tight leading-tight">
                          Check In Now
                        </div>
                        <div className="text-[11px] text-indigo-100/80 mt-0.5">
                          Live Selfie & GPS Verification
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ) : !hasCheckedOut ? (
                  /* Check-out CTA Button */
                  <button
                    onClick={() => setModalType('checkout')}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white shadow-xl shadow-emerald-600/30 border border-emerald-400/30 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20 group-hover:scale-105 transition">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-base tracking-tight leading-tight">
                          Check Out Now
                        </div>
                        <div className="text-[11px] text-emerald-100/80 mt-0.5">
                          Complete your shift attendance
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ) : (
                  /* Completed Confirmation Card */
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1.5 shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center ring-4 ring-emerald-500/10">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-bold text-emerald-300">
                      Attendance Completed for Today
                    </div>
                    <p className="text-xs text-emerald-200/70">
                      Total time worked: {formatDuration(todayRecord?.workingDurationMinutes)}. All biometric evidence has been logged securely.
                    </p>
                  </div>
                )}

                {/* Secondary Leave Action Button */}
                {!hasCheckedIn && !isOnLeave && (
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Mark Today's Leave (Full or Half Day)</span>
                  </button>
                )}
              </div>

              {/* Section 3: Daily Work Report Card */}
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-4.5 shadow-xl backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">
                      Daily Work Report <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                    Current Day Only
                  </span>
                </div>

                <form onSubmit={handleSaveReport} className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Summarize your key activities or achievements for today..."
                    className="w-full p-3.5 text-xs rounded-2xl border border-slate-800 bg-slate-950/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      {reportSaved ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Report saved successfully
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Lock className="w-3 h-3 text-slate-500" /> Locks automatically at midnight
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Report</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: MY ATTENDANCE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Attendance History
                  </h3>
                  <p className="text-xs text-slate-400">All recorded shifts and correction states</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                  {historyRecords.length} records
                </span>
              </div>

              {/* My Applied Corrections Summary */}
              {(() => {
                const myCorrections = (corrections || []).filter((c) => c && c.profileId === currentUser.id);
                if (myCorrections.length === 0) return null;
                const pendingCount = myCorrections.filter((c) => c.status === 'pending').length;
                return (
                  <div className="rounded-3xl bg-indigo-950/40 border border-indigo-500/25 p-4 space-y-2.5 shadow-lg backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                      <span className="flex items-center gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-indigo-400" />
                        Correction Requests ({myCorrections.length})
                      </span>
                      {pendingCount > 0 && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                          {pendingCount} Pending Review
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {myCorrections.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          className="bg-slate-900/90 rounded-2xl p-3 text-xs border border-indigo-500/15 flex items-center justify-between gap-2.5"
                        >
                          <div className="truncate min-w-0">
                            <span className="font-semibold text-slate-200 block truncate">
                              {c.reason}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Type: {c.correctionType.replace(/_/g, ' ')}
                              {c.reviewRemarks ? ` &bull; HR: ${c.reviewRemarks}` : ''}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              c.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : c.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {c.status === 'pending' ? 'Pending Review' : c.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* History Records List */}
              <div className="space-y-3">
                {historyRecords.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-2">
                    <History className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-medium">No previous attendance records found.</p>
                  </div>
                ) : (
                  historyRecords.map((r) => {
                    const appliedCorrection = (corrections || []).find((c) => c && c.attendanceId === r.id);
                    const isMissedCheckout = r.status === 'forgotten_checkout' || (!r.checkoutTime && r.attendanceDate < getLocalDateString());

                    return (
                      <div
                        key={r.id}
                        className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-4 shadow-md backdrop-blur-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">
                            {formatDate(r.attendanceDate)}
                          </span>
                          {isMissedCheckout ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Missed Check-out
                            </span>
                          ) : (
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                              r.status === 'present'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : r.status === 'leave' || r.status === 'half_day_leave'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                            }`}>
                              {r.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/50 p-2.5 rounded-2xl border border-slate-800/60">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Check-in</span>
                            <span className="font-bold text-slate-200 font-mono text-[11px]">
                              {formatTime(r.effectiveCheckinTime || r.checkinTime) || '--:--'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Check-out</span>
                            <span className="font-bold text-slate-200 font-mono text-[11px]">
                              {isMissedCheckout ? (
                                <span className="text-amber-400">Missed</span>
                              ) : (
                                formatTime(r.effectiveCheckoutTime || r.checkoutTime) || '--:--'
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                            <span className="font-bold text-slate-200 font-mono text-[11px]">
                              {isMissedCheckout ? '--' : formatDuration(r.workingDurationMinutes)}
                            </span>
                          </div>
                        </div>

                        {/* Footer Correction Action */}
                        <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-xs">
                          <span className="text-[10px] text-slate-400">
                            {r.isLate ? 'Marked Late Arrival' : 'On-Time Arrival'}
                          </span>

                          {appliedCorrection ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {appliedCorrection.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                                  Correction Pending
                                </span>
                              )}
                              {appliedCorrection.status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Correction Approved
                                </span>
                              )}
                              {appliedCorrection.status === 'rejected' && (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                    Rejected
                                  </span>
                                  <button
                                    onClick={() => setSelectedCorrectionRecord(r)}
                                    className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                                  >
                                    <FileEdit className="w-3 h-3" />
                                    Re-apply
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedCorrectionRecord(r)}
                              className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 transition"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Request Correction</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: USER PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 p-5 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800/80">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-600/30 ring-2 ring-white/10 shrink-0">
                    {(currentUser?.fullName || 'User').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-white tracking-tight truncate">
                      {currentUser?.fullName || 'Employee'}
                    </h3>
                    <div className="text-xs text-indigo-300 font-medium">{currentUser?.designationTitle || 'Staff'}</div>
                    <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                      ID: {currentUser?.employeeId || 'EMP'}
                    </span>
                  </div>
                </div>

                {/* 3 Quick KPI Tiles */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Present</span>
                    <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                      {onTimeCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">On-Time</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">
                      {onTimePercentage}%
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Leaves</span>
                    <span className="text-base font-extrabold text-amber-400 font-mono mt-0.5 block">
                      {leaveCount}
                    </span>
                  </div>
                </div>

                {/* Detailed Information Rows */}
                <div className="space-y-2.5 text-xs pt-1">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      Department
                    </span>
                    <span className="font-semibold text-white">{currentUser.departmentName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      Designation
                    </span>
                    <span className="font-semibold text-white">{currentUser.designationTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Official Check-in
                    </span>
                    <span className="font-semibold text-white font-mono">{settings?.officialCheckinTime || '09:30 AM'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Account Status
                    </span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-3.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] border border-rose-500/30 text-rose-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out from StaffTrack</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Dock Navigation Bar (Fixed & Native iOS/Android Style) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-950/85 backdrop-blur-2xl border-t border-slate-800/80 z-30 shadow-[0_-12px_35px_rgba(0,0,0,0.7)] pb-safe">
        <div className="grid grid-cols-3 py-1.5 px-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`py-1.5 flex flex-col items-center gap-1 transition rounded-2xl ${
              activeTab === 'home'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'home' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30' : ''}`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Today</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 flex flex-col items-center gap-1 transition rounded-2xl ${
              activeTab === 'history'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'history' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30' : ''}`}>
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 flex flex-col items-center gap-1 transition rounded-2xl ${
              activeTab === 'profile'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeTab === 'profile' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Profile</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {modalType && (
        <LiveAttendanceModal
          isOpen={true}
          type={modalType}
          onClose={() => setModalType(null)}
          onConfirm={(data) => {
            if (modalType === 'checkin') onCheckIn(data);
            if (modalType === 'checkout') onCheckOut(data);
          }}
        />
      )}

      {showLeaveModal && (
        <LeaveModal
          isOpen={true}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={onMarkLeave}
        />
      )}

      {selectedCorrectionRecord && (
        <CorrectionModal
          isOpen={true}
          record={selectedCorrectionRecord}
          onClose={() => setSelectedCorrectionRecord(null)}
          onSubmit={onSubmitCorrection}
        />
      )}
    </div>
  );
}
