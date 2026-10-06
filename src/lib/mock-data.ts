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

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-emp-1',
    employeeId: 'EMP-1001',
    fullName: 'Alex Morgan',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    designationId: 'desig-1',
    designationTitle: 'Senior Software Engineer',
    role: 'employee',
    isActive: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'user-emp-2',
    employeeId: 'EMP-1002',
    fullName: 'Sarah Chen',
    departmentId: 'dept-3',
    departmentName: 'Operations',
    designationId: 'desig-3',
    designationTitle: 'Operations Lead',
    role: 'employee',
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15',
  },
  {
    id: 'user-hr-1',
    employeeId: 'HR-3001',
    fullName: 'Elena Rostova',
    departmentId: 'dept-2',
    departmentName: 'Human Resources',
    designationId: 'desig-2',
    designationTitle: 'HR Manager',
    role: 'hr',
    isActive: true,
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
  },
  {
    id: 'user-admin-1',
    employeeId: 'ADM-0001',
    fullName: 'Admin Superuser',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    designationId: 'desig-5',
    designationTitle: 'System Administrator',
    role: 'admin',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

export const INITIAL_SETTINGS: AttendanceSettings = {
  id: 1,
  officialCheckinTime: '09:00:00',
  lateThresholdMinutes: 15,
  checkoutReminderTime: '19:00:00',
  checkoutReminderEnabled: true,
  notifyEmployeeOnHrAdjustment: true,
  updatedBy: 'user-hr-1',
  updatedAt: '2026-10-01T09:00:00Z',
};

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const YESTERDAY = getPastDateStr(1);
const TWO_DAYS_AGO = getPastDateStr(2);

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    profileId: 'user-emp-1',
    employeeName: 'Alex Morgan',
    employeeId: 'EMP-1001',
    departmentName: 'Engineering',
    designationTitle: 'Senior Software Engineer',
    attendanceDate: YESTERDAY,
    status: 'checked_out',
    isLate: false,
    isHrAdjusted: false,
    checkinTime: `${YESTERDAY}T09:05:00.000Z`,
    effectiveCheckinTime: `${YESTERDAY}T09:05:00.000Z`,
    checkoutTime: `${YESTERDAY}T18:05:00.000Z`,
    effectiveCheckoutTime: `${YESTERDAY}T18:05:00.000Z`,
    workingDurationMinutes: 540,
    checkinSelfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    checkoutSelfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    checkinLatitude: 37.7749,
    checkinLongitude: -122.4194,
    checkinLocationName: '500 Howard St, Financial District, San Francisco, CA',
    checkoutLatitude: 37.7749,
    checkoutLongitude: -122.4194,
    checkoutLocationName: '500 Howard St, Financial District, San Francisco, CA',
    createdAt: `${YESTERDAY}T09:05:00.000Z`,
    updatedAt: `${YESTERDAY}T18:05:00.000Z`,
  },
  {
    id: 'att-2',
    profileId: 'user-emp-2',
    employeeName: 'Sarah Chen',
    employeeId: 'EMP-1002',
    departmentName: 'Operations',
    designationTitle: 'Operations Lead',
    attendanceDate: TWO_DAYS_AGO,
    status: 'forgotten_checkout',
    isLate: true,
    isHrAdjusted: false,
    checkinTime: `${TWO_DAYS_AGO}T09:32:15.000Z`,
    effectiveCheckinTime: `${TWO_DAYS_AGO}T09:32:15.000Z`,
    checkinSelfieUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
    checkinLatitude: 37.7833,
    checkinLongitude: -122.4167,
    checkinLocationName: '1355 Market St, SoMa, San Francisco, CA',
    createdAt: `${TWO_DAYS_AGO}T09:32:15.000Z`,
    updatedAt: `${TWO_DAYS_AGO}T09:32:15.000Z`,
  },
];

export const INITIAL_CORRECTIONS: AttendanceCorrection[] = [
  {
    id: 'corr-1',
    attendanceId: 'att-2',
    profileId: 'user-emp-2',
    employeeName: 'Sarah Chen',
    employeeId: 'EMP-1002',
    correctionType: 'checkin_time',
    originalCheckinTime: `${TWO_DAYS_AGO}T09:32:15.000Z`,
    requestedCheckinTime: `${TWO_DAYS_AGO}T09:12:00.000Z`,
    reason: 'Camera permission prompt stalled during building entrance elevator ride.',
    status: 'pending',
    createdAt: `${TWO_DAYS_AGO}T10:00:00.000Z`,
  },
];

export const INITIAL_DAILY_REPORTS: DailyWorkReport[] = [
  {
    id: 'dwr-1',
    profileId: 'user-emp-1',
    employeeName: 'Alex Morgan',
    employeeId: 'EMP-1001',
    reportDate: YESTERDAY,
    reportText: 'Completed client code review on the authentication module. Investigated GPS coordinate edge case in tunnel areas. Documented Next.js server actions spec.',
    createdAt: `${YESTERDAY}T11:30:00.000Z`,
    updatedAt: `${YESTERDAY}T11:30:00.000Z`,
    isReadOnly: false,
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-1',
    entityName: 'attendance_settings',
    entityId: '1',
    action: 'update',
    performedBy: 'user-hr-1',
    performedByName: 'Elena Rostova (HR)',
    newState: { officialCheckinTime: '09:00:00', lateThresholdMinutes: 15 },
    reason: 'Standard Q4 corporate schedule alignment',
    createdAt: '2026-10-01T09:00:00Z',
  }
];
