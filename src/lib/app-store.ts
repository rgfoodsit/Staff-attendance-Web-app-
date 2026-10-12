'use client';

import {
  UserProfile,
  Department,
  Designation,
  AttendanceRecord,
  AttendanceSettings,
  AttendanceCorrection,
  DailyWorkReport,
  InAppNotification,
  AuditLogEntry,
  UserRole,
} from '@/types';
import { getLocalDateString } from './utils';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'd0000000-0000-0000-0000-000000000001', name: 'General', code: 'GEN', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

const DEFAULT_DESIGNATIONS: Designation[] = [
  { id: 'e0000000-0000-0000-0000-000000000001', title: 'Staff', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

const DEFAULT_SETTINGS: AttendanceSettings = {
  id: 1,
  officialCheckinTime: '09:00:00',
  lateThresholdMinutes: 15,
  checkoutReminderTime: '19:00:00',
  checkoutReminderEnabled: true,
  notifyEmployeeOnHrAdjustment: true,
  updatedBy: undefined,
  updatedAt: '2026-10-01T09:00:00Z',
};

const STORAGE_KEYS = {
  CURRENT_USER: 'staff_app_current_user',
  PROFILES: 'staff_app_profiles',
  DEPARTMENTS: 'staff_app_departments',
  DESIGNATIONS: 'staff_app_designations',
  SETTINGS: 'staff_app_settings',
  ATTENDANCE: 'staff_app_attendance',
  CORRECTIONS: 'staff_app_corrections',
  DAILY_REPORTS: 'staff_app_daily_reports',
  NOTIFICATIONS: 'staff_app_notifications',
  AUDIT_LOGS: 'staff_app_audit_logs',
};

const CURRENT_APP_VERSION = 'v6_live_auth_sync';

const EMPTY_USER: UserProfile = {
  id: '',
  employeeId: '',
  fullName: 'Guest',
  departmentId: '',
  departmentName: '',
  designationId: '',
  designationTitle: '',
  role: 'employee',
  isActive: false,
  createdAt: '',
  updatedAt: '',
};

export class AppStore {
  private static isClient = typeof window !== 'undefined';
  private static initialized = false;

  private static checkVersion(): void {
    if (!this.isClient || this.initialized) return;
    this.initialized = true;
    try {
      const storedVersion = localStorage.getItem('staff_app_version');
      if (storedVersion !== CURRENT_APP_VERSION) {
        // Purge old mock data from previous demo sessions
        localStorage.removeItem(STORAGE_KEYS.PROFILES);
        localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
        localStorage.removeItem(STORAGE_KEYS.CORRECTIONS);
        localStorage.removeItem(STORAGE_KEYS.DAILY_REPORTS);
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
        localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
        localStorage.removeItem(STORAGE_KEYS.DESIGNATIONS);

        // Sanitize legacy mock session if stored (e.g. user-hr-1, user-admin-1, user-emp-1)
        const rawUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (rawUser) {
          try {
            const parsedUser = JSON.parse(rawUser);
            if (!parsedUser || !parsedUser.id || String(parsedUser.id).startsWith('user-')) {
              localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          }
        }

        localStorage.setItem('staff_app_version', CURRENT_APP_VERSION);
      }
    } catch {
      // ignore
    }
  }

  private static getItem<T>(key: string, fallback: T): T {
    if (!this.isClient) return fallback;
    this.checkVersion();
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    if (!this.isClient) return;
    this.checkVersion();
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  // Current User Session
  static getCurrentUser(): UserProfile {
    const user = this.getItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user || typeof user !== 'object' || !user.role || !['employee', 'hr', 'admin'].includes(user.role)) {
      return EMPTY_USER;
    }
    return user;
  }

  static getSessionUser(): UserProfile | null {
    if (!this.isClient) return null;
    const user = this.getItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user || typeof user !== 'object' || !user.role || !['employee', 'hr', 'admin'].includes(user.role)) {
      return null;
    }
    return user;
  }

  static setCurrentUser(user: UserProfile): void {
    if (!user || typeof user !== 'object') return;
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static logout(): void {
    if (!this.isClient) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  static switchRole(role: UserRole): UserProfile {
    const profiles = this.getProfiles();
    const user = profiles.find((p) => p && p.role === role);
    if (user) {
      this.setCurrentUser(user);
      return user;
    }
    const current = this.getCurrentUser();
    if (current && current.role === role) return current;
    return EMPTY_USER;
  }

  // Masters
  static getDepartments(): Department[] {
    const raw = this.getItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS);
    if (!Array.isArray(raw)) return DEFAULT_DEPARTMENTS;
    return raw.filter((d): d is Department => Boolean(d && typeof d === 'object' && d.id));
  }

  static saveDepartments(depts: Department[]): void {
    if (!Array.isArray(depts)) return;
    const clean = depts.filter((d): d is Department => Boolean(d && typeof d === 'object' && d.id));
    this.setItem(STORAGE_KEYS.DEPARTMENTS, clean);
  }

  static getDesignations(): Designation[] {
    const raw = this.getItem<Designation[]>(STORAGE_KEYS.DESIGNATIONS, DEFAULT_DESIGNATIONS);
    if (!Array.isArray(raw)) return DEFAULT_DESIGNATIONS;
    return raw.filter((d): d is Designation => Boolean(d && typeof d === 'object' && d.id));
  }

  static saveDesignations(desigs: Designation[]): void {
    if (!Array.isArray(desigs)) return;
    const clean = desigs.filter((d): d is Designation => Boolean(d && typeof d === 'object' && d.id));
    this.setItem(STORAGE_KEYS.DESIGNATIONS, clean);
  }

  static getProfiles(): UserProfile[] {
    const raw = this.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, []);
    if (!Array.isArray(raw)) return [];
    const valid = raw.filter(
      (p): p is UserProfile => Boolean(p && typeof p === 'object' && p.id && p.role && ['employee', 'hr', 'admin'].includes(p.role))
    );
    // Self-healing: if localStorage had null or corrupt entries, sanitize immediately
    if (valid.length !== raw.length) {
      this.setItem(STORAGE_KEYS.PROFILES, valid);
    }
    return valid;
  }

  static saveProfiles(profiles: UserProfile[]): void {
    if (!Array.isArray(profiles)) return;
    const clean = profiles.filter(
      (p): p is UserProfile => Boolean(p && typeof p === 'object' && p.id && p.role)
    );
    this.setItem(STORAGE_KEYS.PROFILES, clean);
  }

  // Settings
  static getSettings(): AttendanceSettings {
    return this.getItem<AttendanceSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static updateSettings(settings: Partial<AttendanceSettings>, performedBy: UserProfile): AttendanceSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings, updatedAt: new Date().toISOString(), updatedBy: performedBy.id };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);

    this.logAudit({
      entityName: 'attendance_settings',
      entityId: '1',
      action: 'update',
      performedBy: performedBy.id,
      performedByName: `${performedBy.fullName} (${performedBy.role.toUpperCase()})`,
      previousState: current as unknown as Record<string, unknown>,
      newState: updated as unknown as Record<string, unknown>,
      reason: 'HR Settings Update',
    });

    return updated;
  }

  // Attendance Records
  static getAttendanceRecords(): AttendanceRecord[] {
    const raw = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const records = Array.isArray(raw)
      ? raw.filter((r): r is AttendanceRecord => Boolean(r && typeof r === 'object' && r.id))
      : [];
    const today = getLocalDateString();
    let hasChanges = false;

    // Auto-rollover previous days: if an employee checked in on a previous day and never checked out,
    // transition status from active 'checked_in' / 'late' to 'forgotten_checkout' so past days don't interfere with today's fresh session.
    const updated = records.map((r) => {
      // 1. Sanitize the legacy mock att-1 record if it got saved with today's date
      if (r.id === 'att-1' && r.checkinTime && r.checkinTime.includes('09:08:24') && r.attendanceDate === today) {
        hasChanges = true;
        const past = new Date();
        past.setDate(past.getDate() - 1);
        const yStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
        return {
          ...r,
          attendanceDate: yStr,
          status: 'checked_out' as const,
          checkoutTime: `${yStr}T18:05:00.000Z`,
          effectiveCheckoutTime: `${yStr}T18:05:00.000Z`,
          workingDurationMinutes: 540,
        };
      }

      const checkinDateStr = r.checkinTime ? getLocalDateString(new Date(r.effectiveCheckinTime || r.checkinTime)) : r.attendanceDate;
      const isPastDay = r.attendanceDate < today || checkinDateStr < today;

      // 2. Unclosed past-day check-in: auto close as "forgotten_checkout"
      if (isPastDay && r.checkinTime && !r.checkoutTime) {
        if (r.status !== 'forgotten_checkout') {
          hasChanges = true;
          return {
            ...r,
            attendanceDate: checkinDateStr,
            status: 'forgotten_checkout' as const,
            updatedAt: r.updatedAt || new Date().toISOString(),
          };
        }
      }

      // 3. Clean up invalid checkout earlier than checkin (from next-day checkout bug)
      if (r.checkinTime && r.checkoutTime) {
        const cIn = new Date(r.effectiveCheckinTime || r.checkinTime).getTime();
        const cOut = new Date(r.effectiveCheckoutTime || r.checkoutTime).getTime();
        if (cOut < cIn) {
          hasChanges = true;
          return {
            ...r,
            attendanceDate: checkinDateStr,
            checkoutTime: undefined,
            effectiveCheckoutTime: undefined,
            status: 'forgotten_checkout' as const,
            workingDurationMinutes: 0,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return r;
    });

    if (hasChanges) {
      this.setItem(STORAGE_KEYS.ATTENDANCE, updated);
      return updated;
    }

    return records;
  }

  static saveAttendanceRecords(records: AttendanceRecord[]): void {
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);
  }

  static getTodayAttendanceForUser(profileId: string): AttendanceRecord | undefined {
    const today = getLocalDateString();
    const records = this.getAttendanceRecords();
    return records.find((r) => r.profileId === profileId && r.attendanceDate === today);
  }

  static markCheckIn(params: {
    user: UserProfile;
    selfieUrl: string;
    latitude: number;
    longitude: number;
    locationName: string;
  }): AttendanceRecord {
    const today = getLocalDateString();
    const existing = this.getTodayAttendanceForUser(params.user.id);

    if (existing && existing.checkinTime) {
      throw new Error('Check-in has already been completed for today.');
    }
    if (existing && existing.status === 'leave') {
      throw new Error('Full-day leave is recorded for today. Check-in is prevented.');
    }

    const now = new Date();
    const settings = this.getSettings();

    // Calculate Late
    const [ruleHour, ruleMin] = settings.officialCheckinTime.split(':').map(Number);
    const lateThreshold = new Date(now);
    lateThreshold.setHours(ruleHour, ruleMin + settings.lateThresholdMinutes, 0, 0);

    const isLate = now.getTime() > lateThreshold.getTime();
    const status = isLate ? 'late' : 'checked_in';

    const newRecord: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}`,
      profileId: params.user.id,
      employeeName: params.user.fullName,
      employeeId: params.user.employeeId,
      departmentName: params.user.departmentName,
      designationTitle: params.user.designationTitle,
      attendanceDate: today,
      status: status,
      isLate: isLate,
      isHrAdjusted: false,
      checkinTime: now.toISOString(),
      effectiveCheckinTime: now.toISOString(),
      checkinSelfieUrl: params.selfieUrl,
      checkinLatitude: params.latitude,
      checkinLongitude: params.longitude,
      checkinLocationName: params.locationName,
      createdAt: existing ? existing.createdAt : now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const records = this.getAttendanceRecords();
    const index = records.findIndex((r) => r.profileId === params.user.id && r.attendanceDate === today);
    if (index >= 0) {
      records[index] = newRecord;
    } else {
      records.unshift(newRecord);
    }
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);

    this.addNotification({
      recipientId: params.user.id,
      title: 'Check-in Recorded',
      message: `You successfully checked in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${isLate ? 'Late' : 'On-Time'}).`,
      notificationType: 'attendance_success',
    });

    return newRecord;
  }

  static markCheckOut(params: {
    user: UserProfile;
    selfieUrl: string;
    latitude: number;
    longitude: number;
    locationName: string;
  }): AttendanceRecord {
    const today = getLocalDateString();
    const existing = this.getTodayAttendanceForUser(params.user.id);

    if (!existing || !existing.checkinTime) {
      throw new Error('You must check in before checking out.');
    }

    // Safety: ensure this check-in belongs to today
    const checkinDateStr = getLocalDateString(new Date(existing.effectiveCheckinTime || existing.checkinTime));
    if (checkinDateStr < today || existing.attendanceDate < today) {
      throw new Error('This check-in is from a previous day and has already ended as "Forgot to check-out". Please check in for today.');
    }

    if (existing.checkoutTime) {
      throw new Error('Check-out has already been completed for today.');
    }

    const now = new Date();
    const checkinDate = new Date(existing.effectiveCheckinTime || existing.checkinTime);
    if (now.getTime() < checkinDate.getTime()) {
      throw new Error('Check-out time cannot be earlier than check-in time.');
    }
    const durationMinutes = Math.max(0, Math.round((now.getTime() - checkinDate.getTime()) / (1000 * 60)));

    const updatedRecord: AttendanceRecord = {
      ...existing,
      status: existing.isLate ? 'late' : 'checked_out',
      checkoutTime: now.toISOString(),
      effectiveCheckoutTime: now.toISOString(),
      checkoutSelfieUrl: params.selfieUrl,
      checkoutLatitude: params.latitude,
      checkoutLongitude: params.longitude,
      checkoutLocationName: params.locationName,
      workingDurationMinutes: durationMinutes,
      updatedAt: now.toISOString(),
    };

    const records = this.getAttendanceRecords();
    const index = records.findIndex((r) => r.id === existing.id);
    if (index >= 0) {
      records[index] = updatedRecord;
      this.setItem(STORAGE_KEYS.ATTENDANCE, records);
    }

    this.addNotification({
      recipientId: params.user.id,
      title: 'Check-out Recorded',
      message: `Checked out successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m.`,
      notificationType: 'attendance_success',
    });

    return updatedRecord;
  }

  static markLeave(params: {
    user: UserProfile;
    leaveType?: 'first_half' | 'second_half';
    reason: string;
    comment?: string;
  }): AttendanceRecord {
    const today = getLocalDateString();
    const existing = this.getTodayAttendanceForUser(params.user.id);

    if (existing && existing.status === 'leave') {
      throw new Error('Full-day leave is already marked for today.');
    }

    const now = new Date();
    const isHalfDay = !!params.leaveType;
    const status = isHalfDay ? 'half_day_leave' : 'leave';

    const newRecord: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}`,
      profileId: params.user.id,
      employeeName: params.user.fullName,
      employeeId: params.user.employeeId,
      departmentName: params.user.departmentName,
      designationTitle: params.user.designationTitle,
      attendanceDate: today,
      status: status,
      isLate: false,
      isHrAdjusted: false,
      leaveType: params.leaveType,
      leaveReason: params.reason,
      leaveComment: params.comment,
      createdAt: existing ? existing.createdAt : now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const records = this.getAttendanceRecords();
    const index = records.findIndex((r) => r.profileId === params.user.id && r.attendanceDate === today);
    if (index >= 0) {
      records[index] = newRecord;
    } else {
      records.unshift(newRecord);
    }
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);

    this.addNotification({
      recipientId: params.user.id,
      title: isHalfDay ? `Half-Day Leave Marked (${params.leaveType === 'first_half' ? '1st Half' : '2nd Half'})` : 'Full-Day Leave Marked',
      message: `Your leave has been recorded for today: ${params.reason}.`,
      notificationType: 'attendance_success',
    });

    return newRecord;
  }

  // HR Direct Adjustment
  static hrAdjustAttendance(params: {
    attendanceId: string;
    newStatus: AttendanceRecord['status'];
    effectiveCheckinTime?: string;
    effectiveCheckoutTime?: string;
    reason: string;
    hrUser: UserProfile;
  }): AttendanceRecord {
    const records = this.getAttendanceRecords();
    const index = records.findIndex((r) => r.id === params.attendanceId);
    if (index === -1) throw new Error('Attendance record not found.');

    const current = records[index];
    let workingMinutes = current.workingDurationMinutes;

    const checkin = params.effectiveCheckinTime || current.effectiveCheckinTime || current.checkinTime;
    const checkout = params.effectiveCheckoutTime || current.effectiveCheckoutTime || current.checkoutTime;
    if (checkin && checkout) {
      workingMinutes = Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60)));
    }

    const updated: AttendanceRecord = {
      ...current,
      status: params.newStatus,
      effectiveCheckinTime: params.effectiveCheckinTime || current.effectiveCheckinTime,
      effectiveCheckoutTime: params.effectiveCheckoutTime || current.effectiveCheckoutTime,
      workingDurationMinutes: workingMinutes,
      isHrAdjusted: true,
      hrAdjustmentReason: params.reason,
      adjustedBy: params.hrUser.id,
      adjustedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    records[index] = updated;
    this.setItem(STORAGE_KEYS.ATTENDANCE, records);

    this.logAudit({
      entityName: 'attendance_record',
      entityId: current.id,
      action: 'hr_manual_adjustment',
      performedBy: params.hrUser.id,
      performedByName: `${params.hrUser.fullName} (HR)`,
      previousState: { status: current.status, checkinTime: current.effectiveCheckinTime, checkoutTime: current.effectiveCheckoutTime },
      newState: { status: updated.status, checkinTime: updated.effectiveCheckinTime, checkoutTime: updated.effectiveCheckoutTime },
      reason: params.reason,
    });

    const settings = this.getSettings();
    if (settings.notifyEmployeeOnHrAdjustment) {
      this.addNotification({
        recipientId: current.profileId,
        title: 'Attendance Adjusted by HR',
        message: `HR (${params.hrUser.fullName}) updated your attendance for ${current.attendanceDate} to ${params.newStatus}. Reason: ${params.reason}`,
        notificationType: 'hr_adjustment',
      });
    }

    return updated;
  }

  // Daily Work Reports
  static getDailyReports(): DailyWorkReport[] {
    const raw = this.getItem<DailyWorkReport[]>(STORAGE_KEYS.DAILY_REPORTS, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter((r): r is DailyWorkReport => Boolean(r && typeof r === 'object' && r.id));
  }

  static getTodayWorkReport(profileId: string): DailyWorkReport | undefined {
    const today = getLocalDateString();
    const reports = this.getDailyReports();
    return reports.find((r) => r.profileId === profileId && r.reportDate === today);
  }

  static saveTodayWorkReport(user: UserProfile, reportText: string): DailyWorkReport {
    const today = getLocalDateString();
    const reports = this.getDailyReports();
    const index = reports.findIndex((r) => r.profileId === user.id && r.reportDate === today);

    let report: DailyWorkReport;
    if (index >= 0) {
      report = {
        ...reports[index],
        reportText,
        updatedAt: new Date().toISOString(),
      };
      reports[index] = report;
    } else {
      report = {
        id: `dwr-${Date.now()}`,
        profileId: user.id,
        employeeName: user.fullName,
        employeeId: user.employeeId,
        reportDate: today,
        reportText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isReadOnly: false,
      };
      reports.unshift(report);
    }

    this.setItem(STORAGE_KEYS.DAILY_REPORTS, reports);
    return report;
  }

  // Corrections
  static getCorrections(): AttendanceCorrection[] {
    const raw = this.getItem<AttendanceCorrection[]>(STORAGE_KEYS.CORRECTIONS, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter((c): c is AttendanceCorrection => Boolean(c && typeof c === 'object' && c.id));
  }

  static saveCorrections(corrections: AttendanceCorrection[]): void {
    if (!Array.isArray(corrections)) return;
    const clean = corrections.filter((c): c is AttendanceCorrection => Boolean(c && typeof c === 'object' && c.id));
    this.setItem(STORAGE_KEYS.CORRECTIONS, clean);
  }

  static submitCorrection(correction: Omit<AttendanceCorrection, 'id' | 'status' | 'createdAt'>): AttendanceCorrection {
    const corrections = this.getCorrections();
    const newCorr: AttendanceCorrection = {
      ...correction,
      id: `corr-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    corrections.unshift(newCorr);
    this.setItem(STORAGE_KEYS.CORRECTIONS, corrections);
    return newCorr;
  }

  static reviewCorrection(params: {
    correctionId: string;
    reviewer: UserProfile;
    status: 'approved' | 'rejected';
    remarks?: string;
  }): AttendanceCorrection {
    const corrections = this.getCorrections();
    const index = corrections.findIndex((c) => c.id === params.correctionId);
    if (index === -1) throw new Error('Correction not found.');

    const current = corrections[index];
    const updated: AttendanceCorrection = {
      ...current,
      status: params.status,
      reviewedBy: params.reviewer.id,
      reviewedByName: `${params.reviewer.fullName} (${params.reviewer.role.toUpperCase()})`,
      reviewedAt: new Date().toISOString(),
      reviewRemarks: params.remarks,
    };
    corrections[index] = updated;
    this.setItem(STORAGE_KEYS.CORRECTIONS, corrections);

    if (params.status === 'approved') {
      const records = this.getAttendanceRecords();
      const recIndex = records.findIndex((r) => r.id === current.attendanceId);
      if (recIndex >= 0) {
        const rec = records[recIndex];
        const newCheckin = current.requestedCheckinTime || rec.effectiveCheckinTime || rec.checkinTime;
        const newCheckout = current.requestedCheckoutTime || rec.effectiveCheckoutTime || rec.checkoutTime;
        let duration = rec.workingDurationMinutes;
        if (newCheckin && newCheckout) {
          duration = Math.max(0, Math.round((new Date(newCheckout).getTime() - new Date(newCheckin).getTime()) / (1000 * 60)));
        }

        records[recIndex] = {
          ...rec,
          effectiveCheckinTime: current.requestedCheckinTime || rec.effectiveCheckinTime,
          effectiveCheckoutTime: current.requestedCheckoutTime || rec.effectiveCheckoutTime,
          status: current.requestedStatus || (newCheckout ? 'checked_out' : rec.status),
          workingDurationMinutes: duration,
          updatedAt: new Date().toISOString(),
        };
        this.setItem(STORAGE_KEYS.ATTENDANCE, records);
      }
    }

    this.addNotification({
      recipientId: current.profileId,
      title: `Correction Request ${params.status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your correction request was ${params.status} by ${params.reviewer.fullName}. ${params.remarks ? `Remarks: ${params.remarks}` : ''}`,
      notificationType: 'correction_status',
    });

    return updated;
  }

  // Notifications
  static getNotifications(profileId?: string): InAppNotification[] {
    const raw = this.getItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const list = Array.isArray(raw)
      ? raw.filter((n): n is InAppNotification => Boolean(n && typeof n === 'object' && n.id))
      : [];
    if (!profileId) return list;
    return list.filter((n) => n.recipientId === profileId);
  }

  static addNotification(notif: Omit<InAppNotification, 'id' | 'isRead' | 'createdAt'>): void {
    const list = this.getNotifications();
    const item: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  static markNotificationsRead(profileId: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.recipientId === profileId ? { ...n, isRead: true } : n));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  // Audit Logs
  static getAuditLogs(): AuditLogEntry[] {
    const raw = this.getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter((l): l is AuditLogEntry => Boolean(l && typeof l === 'object' && l.id));
  }

  static logAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): void {
    const logs = this.getAuditLogs();
    const log: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }
}
