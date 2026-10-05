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
import {
  INITIAL_PROFILES,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_SETTINGS,
  INITIAL_ATTENDANCE,
  INITIAL_CORRECTIONS,
  INITIAL_DAILY_REPORTS,
  INITIAL_AUDIT_LOGS,
} from './mock-data';

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

export class AppStore {
  private static isClient = typeof window !== 'undefined';

  private static getItem<T>(key: string, fallback: T): T {
    if (!this.isClient) return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  // Current User Session
  static getCurrentUser(): UserProfile {
    const user = this.getItem<UserProfile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
    if (!user || !['employee', 'hr', 'admin'].includes(user.role)) {
      return INITIAL_PROFILES[0];
    }
    return user;
  }

  static setCurrentUser(user: UserProfile): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static switchRole(role: UserRole): UserProfile {
    const profiles = this.getProfiles();
    const user = profiles.find((p) => p.role === role) || profiles[0];
    this.setCurrentUser(user);
    return user;
  }

  // Masters
  static getDepartments(): Department[] {
    return this.getItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  static saveDepartments(depts: Department[]): void {
    this.setItem(STORAGE_KEYS.DEPARTMENTS, depts);
  }

  static getDesignations(): Designation[] {
    return this.getItem<Designation[]>(STORAGE_KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS);
  }

  static saveDesignations(desigs: Designation[]): void {
    this.setItem(STORAGE_KEYS.DESIGNATIONS, desigs);
  }

  static getProfiles(): UserProfile[] {
    const profiles = this.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    return profiles.filter((p) => ['employee', 'hr', 'admin'].includes(p.role));
  }

  static saveProfiles(profiles: UserProfile[]): void {
    this.setItem(STORAGE_KEYS.PROFILES, profiles);
  }

  // Settings
  static getSettings(): AttendanceSettings {
    return this.getItem<AttendanceSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
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
    return this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  static getTodayAttendanceForUser(profileId: string): AttendanceRecord | undefined {
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
    const existing = this.getTodayAttendanceForUser(params.user.id);

    if (!existing || !existing.checkinTime) {
      throw new Error('You must check in before checking out.');
    }
    if (existing.checkoutTime) {
      throw new Error('Check-out has already been completed for today.');
    }

    const now = new Date();
    const checkinDate = new Date(existing.effectiveCheckinTime || existing.checkinTime);
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
    const today = new Date().toISOString().split('T')[0];
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
    return this.getItem<DailyWorkReport[]>(STORAGE_KEYS.DAILY_REPORTS, INITIAL_DAILY_REPORTS);
  }

  static getTodayWorkReport(profileId: string): DailyWorkReport | undefined {
    const today = new Date().toISOString().split('T')[0];
    const reports = this.getDailyReports();
    return reports.find((r) => r.profileId === profileId && r.reportDate === today);
  }

  static saveTodayWorkReport(user: UserProfile, reportText: string): DailyWorkReport {
    const today = new Date().toISOString().split('T')[0];
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
    return this.getItem<AttendanceCorrection[]>(STORAGE_KEYS.CORRECTIONS, INITIAL_CORRECTIONS);
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
    const list = this.getItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: 'notif-1',
        recipientId: 'user-emp-1',
        title: 'Check-in Recorded',
        message: 'You checked in on time at 09:08 AM.',
        notificationType: 'attendance_success',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
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
    return this.getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
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
