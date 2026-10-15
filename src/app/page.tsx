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
import { AppLaunchSplash } from '@/components/common/AppLaunchSplash';
import { Smartphone, Laptop, AlertCircle } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(AppStore.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<UserProfile[]>(() => AppStore.getProfiles());
  const [departments, setDepartments] = useState<Department[]>(() => AppStore.getDepartments());
  const [designations, setDesignations] = useState<Designation[]>(() => AppStore.getDesignations());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => AppStore.getAttendanceRecords());
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>(() => AppStore.getCorrections());
  const [dailyReports, setDailyReports] = useState<DailyWorkReport[]>(() => AppStore.getDailyReports());
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => AppStore.getAuditLogs());
  const [settings, setSettings] = useState<AttendanceSettings>(() => AppStore.getSettings());
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<'dashboard' | 'employees' | 'corrections' | 'reports' | 'masters' | 'audit' | 'settings' | 'profile'>(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab && (['dashboard', 'employees', 'corrections', 'reports', 'masters', 'audit', 'settings', 'profile'] as string[]).includes(urlTab)) {
        return urlTab as any;
      }
      const saved = sessionStorage.getItem('staff_app_desktop_tab') || localStorage.getItem('staff_app_desktop_tab');
      if (saved && (['dashboard', 'employees', 'corrections', 'reports', 'masters', 'audit', 'settings', 'profile'] as string[]).includes(saved)) {
        return saved as any;
      }
    }
    return 'dashboard';
  });
  const [employeeActiveTab, setEmployeeActiveTab] = useState<'home' | 'history' | 'profile'>(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab && ['home', 'history', 'profile'].includes(urlTab)) {
        return urlTab as 'home' | 'history' | 'profile';
      }
      const saved = sessionStorage.getItem('staff_app_employee_tab') || localStorage.getItem('staff_app_employee_tab');
      if (saved && ['home', 'history', 'profile'].includes(saved)) {
        return saved as 'home' | 'history' | 'profile';
      }
    }
    return 'home';
  });
  const [mounted, setMounted] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState<string>(getLocalDateString());

  const DESKTOP_TABS = ['dashboard', 'employees', 'corrections', 'reports', 'masters', 'audit', 'settings', 'profile'] as const;
  const EMPLOYEE_TABS = ['home', 'history', 'profile'] as const;

  const updateUrlTab = (tab: string) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== tab) {
        url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', url.toString());
      }
    } catch {
      // ignore
    }
  };

  const handleDesktopTabChange = (tab: 'dashboard' | 'employees' | 'corrections' | 'reports' | 'masters' | 'audit' | 'settings' | 'profile') => {
    setDesktopActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('staff_app_desktop_tab', tab);
        localStorage.setItem('staff_app_desktop_tab', tab);
      } catch {}
      updateUrlTab(tab);
    }
  };

  const handleEmployeeTabChange = (tab: 'home' | 'history' | 'profile') => {
    setEmployeeActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('staff_app_employee_tab', tab);
        localStorage.setItem('staff_app_employee_tab', tab);
      } catch {}
      updateUrlTab(tab);
    }
  };

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
    let sessionUser = AppStore.getSessionUser();

    // Check if a specific role is pinned via URL query parameter (e.g. ?role=admin or ?role=hr)
    if (typeof window !== 'undefined') {
      const urlRole = new URLSearchParams(window.location.search).get('role') as UserRole | null;
      if (urlRole && ['admin', 'hr', 'employee'].includes(urlRole)) {
        if (!sessionUser || sessionUser.role !== urlRole) {
          const switched = AppStore.switchRole(urlRole);
          if (switched && switched.id) {
            sessionUser = switched;
          }
        }
      }
    }

    if (sessionUser) {
      setCurrentUser(sessionUser);
      setIsAuthenticated(true);
      setIsMobilePreview(sessionUser.role === 'employee');

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');

        if (sessionUser.role === 'employee') {
          const savedEmpTab = (sessionStorage.getItem('staff_app_employee_tab') || localStorage.getItem('staff_app_employee_tab')) as any;
          let initialTab: 'home' | 'history' | 'profile' = 'home';
          if (urlTab && (EMPLOYEE_TABS as readonly string[]).includes(urlTab)) {
            initialTab = urlTab as 'home' | 'history' | 'profile';
          } else if (savedEmpTab && (EMPLOYEE_TABS as readonly string[]).includes(savedEmpTab)) {
            initialTab = savedEmpTab;
          }
          setEmployeeActiveTab(initialTab);
          updateUrlTab(initialTab);
          try {
            sessionStorage.setItem('staff_app_employee_tab', initialTab);
            localStorage.setItem('staff_app_employee_tab', initialTab);
          } catch {}
        } else {
          const savedDeskTab = (sessionStorage.getItem('staff_app_desktop_tab') || localStorage.getItem('staff_app_desktop_tab')) as any;
          let candidate: any = 'dashboard';
          if (urlTab && (DESKTOP_TABS as readonly string[]).includes(urlTab)) {
            candidate = urlTab;
          } else if (savedDeskTab && (DESKTOP_TABS as readonly string[]).includes(savedDeskTab)) {
            candidate = savedDeskTab;
          }

          if (candidate === 'masters' && sessionUser.role !== 'admin') {
            candidate = 'dashboard';
          } else if (candidate === 'settings' && sessionUser.role !== 'hr' && sessionUser.role !== 'admin') {
            candidate = 'dashboard';
          }

          setDesktopActiveTab(candidate);
          updateUrlTab(candidate);
          try {
            sessionStorage.setItem('staff_app_desktop_tab', candidate);
            localStorage.setItem('staff_app_desktop_tab', candidate);
          } catch {}
        }
      }
    } else {
      setIsAuthenticated(false);
    }
    refreshState();
    setMounted(true);

    // Sync live master data, profiles, and attendance from Supabase
    syncSupabase();
  }, []);

  // Browser back/forward navigation sync
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (!urlTab) return;
      if (currentUser.role === 'employee') {
        if ((EMPLOYEE_TABS as readonly string[]).includes(urlTab)) {
          setEmployeeActiveTab(urlTab as any);
          try {
            sessionStorage.setItem('staff_app_employee_tab', urlTab);
            localStorage.setItem('staff_app_employee_tab', urlTab);
          } catch {}
        }
      } else {
        if ((DESKTOP_TABS as readonly string[]).includes(urlTab)) {
          if (urlTab === 'masters' && currentUser.role !== 'admin') return;
          if (urlTab === 'settings' && currentUser.role !== 'hr' && currentUser.role !== 'admin') return;
          setDesktopActiveTab(urlTab as any);
          try {
            sessionStorage.setItem('staff_app_desktop_tab', urlTab);
            localStorage.setItem('staff_app_desktop_tab', urlTab);
          } catch {}
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser.role]);

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

      // Sync Real Employees
      const empRes = await fetch('/api/employees/list');
      if (empRes.ok) {
        const empData = await empRes.json();
        if (empData.profiles && Array.isArray(empData.profiles)) {
          const valid = empData.profiles.filter((p: any) => Boolean(p && p.id && p.role));
          if (valid.length > 0) {
            setProfiles(valid);
            AppStore.saveProfiles(valid);

            // Reconcile and keep currentUser in exact sync with live database truth
            const stored = AppStore.getSessionUser();
            if (stored) {
              const liveUser = valid.find(
                (p: any) => p.id === stored.id || (p.employeeId && p.employeeId.toUpperCase() === stored.employeeId?.toUpperCase())
              );
              if (liveUser) {
                setCurrentUser(liveUser);
                AppStore.setCurrentUser(liveUser);
              } else if (String(stored.id).startsWith('user-')) {
                // If stored user was an old deleted mock user, cleanly log out
                AppStore.logout();
                setIsAuthenticated(false);
              }
            }
          }
        }
      }

      // Sync Real Attendance Records
      const attRes = await fetch('/api/attendance/records');
      if (attRes.ok) {
        const attData = await attRes.json();
        if (attData.records) {
          setAttendanceRecords(attData.records);
          AppStore.saveAttendanceRecords(attData.records);
        }
      }

      // Sync Real Attendance Corrections
      const corrRes = await fetch('/api/attendance/corrections');
      if (corrRes.ok) {
        const corrData = await corrRes.json();
        if (corrData.corrections && Array.isArray(corrData.corrections)) {
          setCorrections(corrData.corrections);
          AppStore.saveCorrections(corrData.corrections);
        }
      }
    } catch (err) {
      console.warn('Supabase live sync notice:', err);
    }
  }

  // Automatic day rollover watcher (refreshes check-in/check-out options when day changes)
  useEffect(() => {
    const checkDayRollover = () => {
      const today = getLocalDateString();
      if (today !== currentDateStr) {
        console.log(`[DayRollover] New day detected: ${currentDateStr} -> ${today}. Refreshing attendance.`);
        setCurrentDateStr(today);
        refreshState();
        syncSupabase();
      }
    };

    // Heartbeat check every 15 seconds
    const intervalId = setInterval(checkDayRollover, 15000);

    // Immediate check when returning to tab or unlocking device screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDayRollover();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDayRollover);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDayRollover);
    };
  }, [currentDateStr]);

  const handleRoleChange = (role: UserRole) => {
    const switchedUser = AppStore.switchRole(role);
    setCurrentUser(switchedUser);
    setNotifications(AppStore.getNotifications(switchedUser.id));
    setIsMobilePreview(role === 'employee');
    if (role === 'employee') {
      handleEmployeeTabChange('home');
    } else {
      handleDesktopTabChange('dashboard');
    }
  };

  const handleLogout = () => {
    AppStore.logout();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('staff_app_desktop_tab');
        sessionStorage.removeItem('staff_app_employee_tab');
        localStorage.removeItem('staff_app_desktop_tab');
        localStorage.removeItem('staff_app_employee_tab');
        const url = new URL(window.location.href);
        url.searchParams.delete('tab');
        url.searchParams.delete('role');
        window.history.replaceState(null, '', url.pathname);
      } catch {}
    }
    setIsAuthenticated(false);
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

      // 1. Persist to real Supabase attendance_records table
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: currentUser.id,
          selfieUrl: finalSelfieUrl,
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.locationName,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Check-in failed');
      }

      // 2. Update local AppStore for reactive immediate feedback
      AppStore.markCheckIn({
        user: currentUser,
        ...data,
        selfieUrl: finalSelfieUrl,
      });

      // 3. Refresh live database records
      const attRes = await fetch('/api/attendance/records');
      if (attRes.ok) {
        const attData = await attRes.json();
        if (attData.records) {
          setAttendanceRecords(attData.records);
          AppStore.saveAttendanceRecords(attData.records);
        }
      }

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

      // 1. Persist to real Supabase attendance_records table
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: currentUser.id,
          selfieUrl: finalSelfieUrl,
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.locationName,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Check-out failed');
      }

      // 2. Update local AppStore
      AppStore.markCheckOut({
        user: currentUser,
        ...data,
        selfieUrl: finalSelfieUrl,
      });

      // 3. Refresh live database records
      const attRes = await fetch('/api/attendance/records');
      if (attRes.ok) {
        const attData = await attRes.json();
        if (attData.records) {
          setAttendanceRecords(attData.records);
          AppStore.saveAttendanceRecords(attData.records);
        }
      }

      refreshState();
    } catch (err: any) {
      alert(err.message || 'Error marking check-out');
    }
  };

  const handleMarkLeave = async (data: { isHalfDay: boolean; halfType?: 'first_half' | 'second_half'; reason: string; comment?: string }) => {
    try {
      // 1. Persist to Supabase
      const res = await fetch('/api/attendance/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: currentUser.id,
          leaveType: data.halfType,
          reason: data.reason,
          comment: data.comment,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to mark leave');
      }

      // 2. Update local AppStore
      AppStore.markLeave({
        user: currentUser,
        leaveType: data.halfType,
        reason: data.reason,
        comment: data.comment || '',
      });

      // 3. Refresh records
      const attRes = await fetch('/api/attendance/records');
      if (attRes.ok) {
        const attData = await attRes.json();
        if (attData.records) {
          setAttendanceRecords(attData.records);
          AppStore.saveAttendanceRecords(attData.records);
        }
      }

      refreshState();
    } catch (err: any) {
      alert(err.message || 'Error marking leave');
    }
  };

  const handleSaveWorkReport = (text: string) => {
    AppStore.saveTodayWorkReport(currentUser, text);
    refreshState();
  };

  const handleSubmitCorrection = async (data: any) => {
    const record = attendanceRecords.find((r) => r.id === data.attendanceId);
    const localCorr = AppStore.submitCorrection({
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

    try {
      const res = await fetch('/api/attendance/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: data.attendanceId,
          profileId: currentUser.id,
          correctionType: data.correctionType,
          originalCheckinTime: record?.effectiveCheckinTime || record?.checkinTime,
          originalCheckoutTime: record?.effectiveCheckoutTime || record?.checkoutTime,
          originalStatus: record?.status,
          requestedCheckinTime: data.requestedCheckinTime,
          requestedCheckoutTime: data.requestedCheckoutTime,
          requestedStatus: data.requestedStatus,
          reason: data.reason,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.correction) {
        const allCorrs = AppStore.getCorrections();
        const updated = allCorrs.map((c) => (c.id === localCorr.id ? resData.correction : c));
        AppStore.saveCorrections(updated);
        setCorrections(updated);
      }
    } catch (err) {
      console.warn('Backend correction submit sync:', err);
    }

    refreshState();
    alert('Correction request submitted successfully for management review.');
  };

  const handleReviewCorrection = async (correctionId: string, status: 'approved' | 'rejected', remarks?: string) => {
    AppStore.reviewCorrection({
      correctionId,
      reviewer: currentUser,
      status,
      remarks,
    });
    refreshState();

    try {
      const res = await fetch('/api/attendance/corrections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correctionId,
          status,
          reviewRemarks: remarks,
          reviewerId: currentUser.id,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        if (resData.updatedAttendanceRecord) {
          const recs = AppStore.getAttendanceRecords();
          const idx = recs.findIndex((r) => r.id === resData.updatedAttendanceRecord.id);
          if (idx >= 0) {
            recs[idx] = resData.updatedAttendanceRecord;
            AppStore.saveAttendanceRecords(recs);
            setAttendanceRecords(recs);
          }
        }
        const corrRes = await fetch('/api/attendance/corrections');
        if (corrRes.ok) {
          const corrData = await corrRes.json();
          if (corrData.corrections) {
            setCorrections(corrData.corrections);
            AppStore.saveCorrections(corrData.corrections);
          }
        }
        refreshState();
      }
    } catch (err) {
      console.warn('Backend correction review sync:', err);
    }
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
      <div className="fixed inset-0 z-50 bg-[#673AB7]" />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {showSplash && <AppLaunchSplash onComplete={() => setShowSplash(false)} />}
        <LoginPage
          onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            setCurrentUser(user);
            setIsMobilePreview(user.role === 'employee');
            if (user.role === 'employee') {
              handleEmployeeTabChange('home');
            } else {
              handleDesktopTabChange('dashboard');
            }
            refreshState();
            syncSupabase();
          }}
        />
      </>
    );
  }

  const todayRecord = attendanceRecords.find(
    (r) => r.profileId === currentUser.id && r.attendanceDate === currentDateStr
  );
  const employeeHistory = attendanceRecords.filter((r) => r.profileId === currentUser.id);
  const todayReport = dailyReports.find(
    (r) => r.profileId === currentUser.id && r.reportDate === currentDateStr
  );

  const isEmployee = currentUser.role === 'employee';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {showSplash && <AppLaunchSplash onComplete={() => setShowSplash(false)} />}
      {isEmployee ? (
        /* Native Full-Screen Mobile App View for Employees */
        <div className="w-full min-h-screen flex flex-col items-center">
          <div className="w-full max-w-lg min-h-screen bg-slate-950 flex flex-col">
            <EmployeeView
              currentUser={currentUser}
              todayRecord={todayRecord}
              historyRecords={employeeHistory}
              todayReport={todayReport}
              settings={settings}
              corrections={corrections}
              activeTab={employeeActiveTab}
              onTabChange={handleEmployeeTabChange}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onMarkLeave={handleMarkLeave}
              onSaveWorkReport={handleSaveWorkReport}
              onSubmitCorrection={handleSubmitCorrection}
              onRefresh={async () => {
                setCurrentDateStr(getLocalDateString());
                await syncSupabase();
                refreshState();
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      ) : (
        /* Desktop Web Management Experience (HR, Admin) */
        <div className="min-h-screen flex">
          {/* Left Collapsible Hover Sidebar for Desktop Roles */}
          <div className="hidden md:block">
            <LeftSidebar
              currentUser={currentUser}
              onRoleChange={handleRoleChange}
              notifications={notifications}
              onNotificationsRead={handleNotificationsRead}
              onLogout={handleLogout}
              activeTab={desktopActiveTab}
              onTabChange={handleDesktopTabChange}
              pendingCorrectionsCount={(corrections || []).filter((c) => c && c.status?.toLowerCase() === 'pending').length}
            />
          </div>

          <main className="flex-1 md:ml-16 min-w-0">
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
              onTabChange={handleDesktopTabChange}
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
          </main>
        </div>
      )}
    </div>
  );
}
