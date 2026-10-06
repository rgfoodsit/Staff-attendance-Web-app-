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
import { getLocalDateString } from '@/lib/utils';

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
  const [currentDateStr, setCurrentDateStr] = useState<string>(getLocalDateString());

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

    // Sync live master data, profiles, and attendance from Supabase
    syncSupabase();
  }, []);

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
        if (empData.profiles) {
          setProfiles(empData.profiles);
          AppStore.saveProfiles(empData.profiles);
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
          syncSupabase();
        }}
      />
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
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onMarkLeave={handleMarkLeave}
              onSaveWorkReport={handleSaveWorkReport}
              onSubmitCorrection={handleSubmitCorrection}
              onRefresh={() => {
                setCurrentDateStr(getLocalDateString());
                refreshState();
              }}
              onLogout={() => {
                AppStore.logout();
                setIsAuthenticated(false);
              }}
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
              onLogout={() => {
                AppStore.logout();
                setIsAuthenticated(false);
              }}
              activeTab={desktopActiveTab}
              onTabChange={setDesktopActiveTab}
              pendingCorrectionsCount={corrections.filter((c) => c.status === 'pending').length}
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
          </main>
        </div>
      )}
    </div>
  );
}
