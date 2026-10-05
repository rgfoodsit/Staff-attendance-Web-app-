'use client';

import React, { useState, useEffect } from 'react';
import { AppStore } from '@/lib/app-store';
import { 
  UserProfile, 
  UserRole, 
  AttendanceRecord, 
  AttendanceSettings, 
  AttendanceCorrection,
  Department,
  Designation,
  DailyWorkReport,
  InAppNotification,
  AuditLogEntry
} from '@/types';
import { LeftSidebar } from '@/components/navigation/LeftSidebar';
import { EmployeeView } from '@/components/employee/EmployeeView';
import { DesktopManagementView } from '@/components/desktop/DesktopManagementView';
import { LoginPage } from '@/components/auth/LoginPage';
import { Smartphone, Laptop, AlertCircle } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(AppStore.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyWorkReport[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings>(AppStore.getSettings());
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<'dashboard' | 'employees' | 'corrections' | 'reports' | 'masters' | 'audit' | 'settings' | 'profile'>('dashboard');
  const [mounted, setMounted] = useState(false);

  // Load all initial state
  const refreshState = () => {
    const user = AppStore.getCurrentUser();
    setCurrentUser(user);
    setProfiles(AppStore.getProfiles());
    setDepartments(AppStore.getDepartments());
    setDesignations(AppStore.getDesignations());
    setAttendanceRecords(AppStore.getAttendanceRecords());
    setCorrections(AppStore.getCorrections());
    setDailyReports(AppStore.getDailyReports());
    setNotifications(AppStore.getNotifications(user.id));
    setAuditLogs(AppStore.getAuditLogs());
    setSettings(AppStore.getSettings());
  };

  useEffect(() => {
    const sessionUser = AppStore.getSessionUser();
    if (sessionUser) {
      setCurrentUser(sessionUser);
      setIsAuthenticated(true);
      setIsMobilePreview(sessionUser.role === 'employee');
    } else {
      setIsAuthenticated(false);
    }
    refreshState();
    setMounted(true);

    // Sync live master data from Supabase
    async function syncSupabase() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const [settingsRes, deptsRes, desigsRes] = await Promise.all([
          supabase.from('attendance_settings').select('*').single(),
          supabase.from('departments').select('*').eq('is_active', true),
          supabase.from('designations').select('*').eq('is_active', true),
        ]);

        if (settingsRes.data) {
          const s = settingsRes.data;
          const liveSettings: AttendanceSettings = {
            id: s.id,
            officialCheckinTime: s.official_checkin_time,
            lateThresholdMinutes: s.late_threshold_minutes,
            checkoutReminderTime: s.checkout_reminder_time,
            checkoutReminderEnabled: s.checkout_reminder_enabled,
            notifyEmployeeOnHrAdjustment: s.notify_employee_on_hr_adjustment,
            updatedBy: s.updated_by,
            updatedAt: s.updated_at,
          };
          setSettings(liveSettings);
        }

        if (deptsRes.data && deptsRes.data.length > 0) {
          const liveDepts: Department[] = deptsRes.data.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            isActive: d.is_active,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          setDepartments(liveDepts);
          AppStore.saveDepartments(liveDepts);
        }

        if (desigsRes.data && desigsRes.data.length > 0) {
          const liveDesigs: Designation[] = desigsRes.data.map((d: any) => ({
            id: d.id,
            title: d.title,
            isActive: d.is_active,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          setDesignations(liveDesigs);
          AppStore.saveDesignations(liveDesigs);
        }
      } catch (err) {
        console.warn('Supabase live sync notice:', err);
      }
    }

    syncSupabase();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    const switchedUser = AppStore.switchRole(role);
    setCurrentUser(switchedUser);
    setNotifications(AppStore.getNotifications(switchedUser.id));
    setIsMobilePreview(role === 'employee');
    setDesktopActiveTab('dashboard');
  };

  const handleCheckIn = async (data: { selfieUrl: string; latitude: number; longitude: number; locationName: string }) => {
    try {
      let finalSelfieUrl = data.selfieUrl;
      try {
        const { SupabaseService } = await import('@/lib/supabase-service');
        const uploadedUrl = await SupabaseService.uploadSelfie(data.selfieUrl, currentUser.id, 'checkin');
        if (uploadedUrl) finalSelfieUrl = uploadedUrl;
      } catch (err) {
        console.warn('Storage upload fallback:', err);
      }

      AppStore.markCheckIn({
        user: currentUser,
        ...data,
        selfieUrl: finalSelfieUrl,
      });
      refreshState();
    } catch (err: any) {
      alert(err.message || 'Error marking check-in');
    }
  };

  const handleCheckOut = async (data: { selfieUrl: string; latitude: number; longitude: number; locationName: string }) => {
    try {
      let finalSelfieUrl = data.selfieUrl;
      try {
        const { SupabaseService } = await import('@/lib/supabase-service');
        const uploadedUrl = await SupabaseService.uploadSelfie(data.selfieUrl, currentUser.id, 'checkout');
        if (uploadedUrl) finalSelfieUrl = uploadedUrl;
      } catch (err) {
        console.warn('Storage upload fallback:', err);
      }

      AppStore.markCheckOut({
        user: currentUser,
        ...data,
        selfieUrl: finalSelfieUrl,
      });
      refreshState();
    } catch (err: any) {
      alert(err.message || 'Error marking check-out');
    }
  };

  const handleMarkLeave = (data: { isHalfDay: boolean; halfType?: 'first_half' | 'second_half'; reason: string; comment?: string }) => {
    try {
      AppStore.markLeave({
        user: currentUser,
        leaveType: data.halfType,
        reason: data.reason,
        comment: data.comment || '',
      });
      refreshState();
    } catch (err: any) {
      alert(err.message || 'Error marking leave');
    }
  };

  const handleSaveWorkReport = (text: string) => {
    AppStore.saveTodayWorkReport(currentUser, text);
    refreshState();
  };

  const handleSubmitCorrection = (data: any) => {
    const record = attendanceRecords.find((r) => r.id === data.attendanceId);
    AppStore.submitCorrection({
      attendanceId: data.attendanceId,
      profileId: currentUser.id,
      employeeName: currentUser.fullName,
      employeeId: currentUser.employeeId,
      correctionType: data.correctionType,
      originalCheckinTime: record?.effectiveCheckinTime || record?.checkinTime,
      originalCheckoutTime: record?.effectiveCheckoutTime || record?.checkoutTime,
      originalStatus: record?.status,
      requestedCheckinTime: data.requestedCheckinTime,
      requestedCheckoutTime: data.requestedCheckoutTime,
      requestedStatus: data.requestedStatus,
      reason: data.reason,
    });
    refreshState();
    alert('Correction request submitted for management review.');
  };

  const handleReviewCorrection = (correctionId: string, status: 'approved' | 'rejected', remarks?: string) => {
    AppStore.reviewCorrection({
      correctionId,
      reviewer: currentUser,
      status,
      remarks,
    });
    refreshState();
  };

  const handleHrAdjust = (data: any) => {
    AppStore.hrAdjustAttendance({
      attendanceId: data.attendanceId,
      newStatus: data.newStatus,
      effectiveCheckinTime: data.effectiveCheckinTime,
      effectiveCheckoutTime: data.effectiveCheckoutTime,
      reason: data.reason,
      hrUser: currentUser,
    });
    refreshState();
  };

  const handleUpdateSettings = (newSettings: Partial<AttendanceSettings>) => {
    AppStore.updateSettings(newSettings, currentUser);
    refreshState();
  };

  const handleNotificationsRead = () => {
    AppStore.markNotificationsRead(currentUser.id);
    refreshState();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setIsMobilePreview(user.role === 'employee');
          setDesktopActiveTab('dashboard');
          refreshState();
        }}
      />
    );
  }

  const todayRecord = attendanceRecords.find(
    (r) => r.profileId === currentUser.id && r.attendanceDate === new Date().toISOString().split('T')[0]
  );
  const employeeHistory = attendanceRecords.filter((r) => r.profileId === currentUser.id);
  const todayReport = dailyReports.find(
    (r) => r.profileId === currentUser.id && r.reportDate === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Left Collapsible Hover Sidebar with Top-Left Logo and Bottom Profile Switch */}
      <LeftSidebar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        notifications={notifications}
        onNotificationsRead={handleNotificationsRead}
        onLogout={() => {
          AppStore.logout();
          setIsAuthenticated(false);
        }}
        activeTab={desktopActiveTab}
        onTabChange={setDesktopActiveTab}
        pendingCorrectionsCount={corrections.filter((c) => c.status === 'pending').length}
      />

      {/* Main View Area */}
      <main className="flex-1 ml-16 min-w-0">
        {currentUser.role === 'employee' ? (
          /* Mobile Web Employee Experience */
          <div className="py-6 px-4 flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-sm sm:max-w-[400px]">
              {/* Device Notice Banner */}
              <div className="mb-3 px-3 py-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <strong>PRD Rule #4.1:</strong> Mobile Web Viewport for Employees
                </span>
                <span className="text-[10px] bg-indigo-200/50 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full font-semibold">
                  Camera + GPS
                </span>
              </div>

              {/* Mobile Phone Mockup Frame */}
              <div className="relative w-full h-[780px] max-h-[82vh] rounded-[2.5rem] border-[10px] border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col ring-1 ring-slate-900/20">
                {/* Dynamic Island / Speaker Notch Pill */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 dark:bg-slate-800 rounded-full z-40 flex items-center justify-center gap-2 pointer-events-none shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700/60" />
                  <div className="w-8 h-1 bg-slate-700/80 rounded-full" />
                </div>

                <EmployeeView
                  currentUser={currentUser}
                  todayRecord={todayRecord}
                  historyRecords={employeeHistory}
                  todayReport={todayReport}
                  settings={settings}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onMarkLeave={handleMarkLeave}
                  onSaveWorkReport={handleSaveWorkReport}
                  onSubmitCorrection={handleSubmitCorrection}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Web Management Experience (HR, Admin) */
          <div>
            <DesktopManagementView
              currentUser={currentUser}
              attendanceRecords={attendanceRecords}
              profiles={profiles}
              departments={departments}
              designations={designations}
              corrections={corrections}
              settings={settings}
              dailyReports={dailyReports}
              auditLogs={auditLogs}
              activeTab={desktopActiveTab}
              onTabChange={setDesktopActiveTab}
              onReviewCorrection={handleReviewCorrection}
              onHrAdjust={handleHrAdjust}
              onUpdateSettings={handleUpdateSettings}
              onSaveDepartment={(d) => {
                AppStore.saveDepartments(d);
                refreshState();
              }}
              onSaveDesignation={(d) => {
                AppStore.saveDesignations(d);
                refreshState();
              }}
              onSaveProfiles={(p) => {
                AppStore.saveProfiles(p);
                refreshState();
              }}
              onUpdateCurrentUser={(updatedUser) => {
                setCurrentUser(updatedUser);
                AppStore.setCurrentUser(updatedUser);
                refreshState();
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
