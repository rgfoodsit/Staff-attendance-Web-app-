import { 
  UserProfile, 
  Department, 
  Designation, 
  AttendanceRecord, 
  AttendanceSettings,
  AttendanceCorrection,
  DailyWorkReport,
  InAppNotification,
  AuditLogEntry
} from '@/types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd0000000-0000-0000-0000-000000000001', name: 'General', code: 'GEN', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

export const INITIAL_DESIGNATIONS: Designation[] = [
  { id: 'e0000000-0000-0000-0000-000000000001', title: 'Staff', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

export const INITIAL_PROFILES: UserProfile[] = [];

export const INITIAL_SETTINGS: AttendanceSettings = {
  id: 1,
  officialCheckinTime: '09:00:00',
  lateThresholdMinutes: 15,
  checkoutReminderTime: '19:00:00',
  checkoutReminderEnabled: true,
  notifyEmployeeOnHrAdjustment: true,
  updatedBy: undefined,
  updatedAt: '2026-10-01T09:00:00Z',
};

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_CORRECTIONS: AttendanceCorrection[] = [];

export const INITIAL_DAILY_REPORTS: DailyWorkReport[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
