'use client';

import React, { useState } from 'react';
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
  FileEdit
} from 'lucide-react';
import { UserProfile, AttendanceRecord, AttendanceSettings, DailyWorkReport } from '@/types';
import { formatTime, formatDate, formatDuration } from '@/lib/utils';
import { LiveAttendanceModal } from './LiveAttendanceModal';
import { LeaveModal } from './LeaveModal';
import { CorrectionModal } from './CorrectionModal';

interface EmployeeViewProps {
  currentUser: UserProfile;
  todayRecord?: AttendanceRecord;
  historyRecords: AttendanceRecord[];
  todayReport?: DailyWorkReport;
  settings: AttendanceSettings;
  onCheckIn: (data: { selfieUrl: string; latitude: number; longitude: number; locationName: string }) => void;
  onCheckOut: (data: { selfieUrl: string; latitude: number; longitude: number; locationName: string }) => void;
  onMarkLeave: (data: { isHalfDay: boolean; halfType?: 'first_half' | 'second_half'; reason: string; comment?: string }) => void;
  onSaveWorkReport: (text: string) => void;
  onSubmitCorrection: (data: any) => void;
}

export function EmployeeView({
  currentUser,
  todayRecord,
  historyRecords,
  todayReport,
  settings,
  onCheckIn,
  onCheckOut,
  onMarkLeave,
  onSaveWorkReport,
  onSubmitCorrection,
}: EmployeeViewProps) {
  const [modalType, setModalType] = useState<'checkin' | 'checkout' | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedCorrectionRecord, setSelectedCorrectionRecord] = useState<AttendanceRecord | null>(null);
  const [reportText, setReportText] = useState(todayReport?.reportText || '');
  const [reportSaved, setReportSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');

  const hasCheckedIn = !!todayRecord?.checkinTime;
  const hasCheckedOut = !!todayRecord?.checkoutTime;
  const isOnLeave = todayRecord?.status === 'leave';
  const isHalfDayLeave = todayRecord?.status === 'half_day_leave';

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWorkReport(reportText);
    setReportSaved(true);
    setTimeout(() => setReportSaved(false), 3000);
  };

  const getStatusBadge = () => {
    if (!todayRecord) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Not Checked In
        </span>
      );
    }
    if (todayRecord.status === 'leave') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          Full-Day Leave
        </span>
      );
    }
    if (todayRecord.status === 'half_day_leave') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Half-Day Leave ({todayRecord.leaveType === 'first_half' ? '1st Half' : '2nd Half'})
        </span>
      );
    }
    if (hasCheckedOut) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" /> Checked Out (Completed)
        </span>
      );
    }
    if (hasCheckedIn) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          todayRecord.isLate
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
        }`}>
          <Clock className="w-3.5 h-3.5" /> Checked In ({todayRecord.isLate ? 'Late' : 'On-Time'})
        </span>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Mobile Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-5 pt-7 rounded-b-3xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider block">
                Employee Portal
              </span>
              <h2 className="text-xl font-bold tracking-tight">{currentUser.fullName}</h2>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                {currentUser.designationTitle} &bull; {currentUser.departmentName}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-lg shadow-inner">
              {currentUser.fullName.charAt(0)}
            </div>
          </div>

          {/* Decorative Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Main Tab Views */}
        <div className="p-4 space-y-4 pb-6">
        {activeTab === 'home' && (
          <>
            {/* Section 1: Today's Status (PRD Section 48) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Today's Status
                </span>
                <span className="text-xs text-slate-400">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>{getStatusBadge()}</div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Working Duration</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatDuration(todayRecord?.workingDurationMinutes)}
                  </span>
                </div>
              </div>

              {/* Time Evidence Preview */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Check-in</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatTime(todayRecord?.effectiveCheckinTime || todayRecord?.checkinTime)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Check-out</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatTime(todayRecord?.effectiveCheckoutTime || todayRecord?.checkoutTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Primary Attendance Action (PRD Section 49) */}
            <div className="space-y-3">
              {!hasCheckedIn ? (
                /* Check-in Button */
                <button
                  onClick={() => setModalType('checkin')}
                  disabled={isOnLeave}
                  className="w-full py-4 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 font-semibold text-base transition active:scale-[0.99]"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Check In Now (Live Selfie + GPS)</span>
                </button>
              ) : !hasCheckedOut ? (
                /* Check-out Button */
                <button
                  onClick={() => setModalType('checkout')}
                  className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 font-semibold text-base transition active:scale-[0.99]"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Check Out Now (Live Selfie + GPS)</span>
                </button>
              ) : (
                /* Both Completed Notice */
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Attendance completed for today. No further action needed.</span>
                </div>
              )}

              {/* Leave Button */}
              {!hasCheckedIn && !isOnLeave && (
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Mark Today's Leave (Full or Half Day)</span>
                </button>
              )}
            </div>

            {/* Section 3: Daily Work Report (PRD Section 44 & 45) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Daily Work Report (Optional)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Current Day Only</span>
              </div>

              <form onSubmit={handleSaveReport} className="space-y-2">
                <textarea
                  rows={3}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Summarize your key activities or achievements for today..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between pt-1">
                  {reportSaved ? (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Report saved successfully
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Becomes read-only after calendar day ends.
                    </span>
                  )}
                  <button
                    type="submit"
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Report</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Tab 2: Attendance History (PRD Section 43) */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                My Attendance History
              </h3>
              <span className="text-xs text-slate-500">{historyRecords.length} records</span>
            </div>

            <div className="space-y-2.5">
              {historyRecords.map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {formatDate(r.attendanceDate)}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-in</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatTime(r.effectiveCheckinTime || r.checkinTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-out</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatTime(r.effectiveCheckoutTime || r.checkoutTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDuration(r.workingDurationMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Correction Action */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {r.isLate ? 'Marked Late' : 'On-Time'}
                    </span>
                    <button
                      onClick={() => setSelectedCorrectionRecord(r)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Request Correction</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Basic Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{currentUser.fullName}</h3>
                <span className="text-xs text-slate-500 font-mono">{currentUser.employeeId}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.departmentName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Designation</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.designationTitle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">{currentUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Account Status</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex-shrink-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30">
        <div className="grid grid-cols-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'home'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">Today</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'history'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px]">History</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'profile'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>

        {/* Home Indicator Bar */}
        <div className="flex justify-center pb-2 pt-0.5">
          <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
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
