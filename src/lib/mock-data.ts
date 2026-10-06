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
  { id: 'dept-1', name: 'Engineering', code: 'ENG', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'dept-3', name: 'Operations', code: 'OPS', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'dept-4', name: 'Sales & Marketing', code: 'SALES', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

export const INITIAL_DESIGNATIONS: Designation[] = [
  { id: 'desig-1', title: 'Senior Software Engineer', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'desig-2', title: 'HR Manager', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'desig-3', title: 'Operations Lead', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'desig-4', title: 'Technical Architect', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'desig-5', title: 'System Administrator', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
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
