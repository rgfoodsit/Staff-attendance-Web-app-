export type UserRole = 'employee' | 'hr' | 'admin';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'half_day_attendance'
  | 'half_day_leave'
  | 'leave'
  | 'absent'
  | 'checked_in'
  | 'checked_out'
  | 'checkout_pending'
  | 'forgotten_checkout';

export type LeaveHalfType = 'first_half' | 'second_half';

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export type CorrectionType =
  | 'checkin_time'
  | 'checkout_time'
  | 'status'
  | 'forgotten_checkout';

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Designation {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  employeeId: string;
  fullName: string;
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationTitle?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSettings {
  id: number;
  officialCheckinTime: string; // e.g. "09:00:00"
  lateThresholdMinutes: number; // e.g. 15
  checkoutReminderTime: string; // e.g. "19:00:00"
  checkoutReminderEnabled: boolean;
  notifyEmployeeOnHrAdjustment: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AttendanceEvidence {
  time?: string;
  selfieUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface AttendanceRecord {
  id: string;
  profileId: string;
  employeeName?: string;
  employeeId?: string;
  departmentName?: string;
  designationTitle?: string;
  attendanceDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  isLate: boolean;
  isHrAdjusted: boolean;
  hrAdjustmentReason?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  workingDurationMinutes?: number;

  // Check-in Evidence
  checkinTime?: string;
  effectiveCheckinTime?: string;
  checkinSelfieUrl?: string;
  checkinLatitude?: number;
  checkinLongitude?: number;
  checkinLocationName?: string;

  // Check-out Evidence
  checkoutTime?: string;
  effectiveCheckoutTime?: string;
  checkoutSelfieUrl?: string;
  checkoutLatitude?: number;
  checkoutLongitude?: number;
  checkoutLocationName?: string;

  // Leave info
  leaveType?: LeaveHalfType;
  leaveReason?: string;
  leaveComment?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  profileId: string;
  employeeName?: string;
  employeeId?: string;
  correctionType: CorrectionType;
  originalCheckinTime?: string;
  originalCheckoutTime?: string;
  originalStatus?: AttendanceStatus;
  requestedCheckinTime?: string;
  requestedCheckoutTime?: string;
  requestedStatus?: AttendanceStatus;
  reason: string;
  status: CorrectionStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  createdAt: string;
}

export interface DailyWorkReport {
  id: string;
  profileId: string;
  employeeName?: string;
  employeeId?: string;
  reportDate: string; // YYYY-MM-DD
  reportText: string;
  createdAt: string;
  updatedAt: string;
  isReadOnly?: boolean;
}

export interface InAppNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  notificationType: 'attendance_success' | 'checkout_reminder' | 'hr_adjustment' | 'correction_status';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  reason?: string;
  createdAt: string;
}
