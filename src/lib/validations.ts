import { z } from 'zod';

export const LoginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID / Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const CheckInSchema = z.object({
  selfieDataUrl: z.string().min(1, 'Live selfie is required'),
  latitude: z.number({ required_error: 'GPS latitude is required' }),
  longitude: z.number({ required_error: 'GPS longitude is required' }),
  locationName: z.string().min(1, 'Readable location name is required'),
  timestamp: z.string().datetime().optional(),
});

export const CheckOutSchema = z.object({
  selfieDataUrl: z.string().min(1, 'Live selfie is required'),
  latitude: z.number({ required_error: 'GPS latitude is required' }),
  longitude: z.number({ required_error: 'GPS longitude is required' }),
  locationName: z.string().min(1, 'Readable location name is required'),
  timestamp: z.string().datetime().optional(),
});

export const FullDayLeaveSchema = z.object({
  reason: z.string().min(3, 'Leave reason must be at least 3 characters'),
  comment: z.string().min(3, 'Leave comment must be at least 3 characters'),
});

export const HalfDayLeaveSchema = z.object({
  halfType: z.enum(['first_half', 'second_half'], {
    required_error: 'Please specify First Half or Second Half',
  }),
  reason: z.string().min(3, 'Leave reason must be at least 3 characters'),
  comment: z.string().min(3, 'Leave comment must be at least 3 characters'),
});

export const DailyWorkReportSchema = z.object({
  reportText: z.string().min(1, 'Work report content cannot be empty'),
});

export const StandardCorrectionSchema = z.object({
  attendanceId: z.string().uuid('Invalid attendance ID'),
  correctionType: z.enum(['checkin_time', 'checkout_time', 'status']),
  requestedCheckinTime: z.string().optional(),
  requestedCheckoutTime: z.string().optional(),
  requestedStatus: z.enum(['present', 'late', 'half_day_attendance', 'leave', 'absent']).optional(),
  reason: z.string().min(5, 'Mandatory correction reason must be at least 5 characters'),
});

export const ForgottenCheckoutCorrectionSchema = z.object({
  attendanceId: z.string().uuid('Invalid attendance ID'),
  requestedCheckoutTime: z.string().min(1, 'Requested checkout time is required'),
  reason: z.string().min(5, 'Mandatory correction reason must be at least 5 characters'),
});

export const HrAttendanceAdjustmentSchema = z.object({
  attendanceId: z.string().uuid(),
  status: z.enum(['present', 'full_day', 'half_day_attendance', 'absent', 'leave']),
  effectiveCheckinTime: z.string().optional(),
  effectiveCheckoutTime: z.string().optional(),
  reason: z.string().min(5, 'Mandatory reason for HR adjustment is required'),
});

export const HrMarkAbsentSchema = z.object({
  profileId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  reason: z.string().min(5, 'Mandatory reason for marking absent is required'),
});

export const AttendanceSettingsSchema = z.object({
  officialCheckinTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:MM:SS)'),
  lateThresholdMinutes: z.number().int().min(0).max(180),
  checkoutReminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Invalid time format (HH:MM:SS)'),
  checkoutReminderEnabled: z.boolean(),
  notifyEmployeeOnHrAdjustment: z.boolean(),
});

export const EmployeeAccountSchema = z.object({
  employeeId: z.string().min(2, 'Employee ID is required and must be unique'),
  fullName: z.string().min(2, 'Employee Full Name is required'),
  departmentId: z.string().uuid('Department is required'),
  designationId: z.string().uuid('Designation is required'),
  role: z.enum(['employee', 'hr', 'admin']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const MasterItemSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(1, 'Code is required').optional(),
});
