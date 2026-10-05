import { createClient } from './supabase/client';
import { 
  UserProfile, 
  AttendanceRecord, 
  AttendanceSettings, 
  Department, 
  Designation, 
  AttendanceCorrection,
  DailyWorkReport,
  AuditLogEntry
} from '@/types';

export class SupabaseService {
  private static client = createClient();

  static async isAvailable(): Promise<boolean> {
    try {
      const { data, error } = await this.client.from('attendance_settings').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Attendance Settings
  static async getSettings(): Promise<AttendanceSettings | null> {
    const { data, error } = await this.client.from('attendance_settings').select('*').single();
    if (error || !data) return null;
    return {
      id: data.id,
      officialCheckinTime: data.official_checkin_time,
      lateThresholdMinutes: data.late_threshold_minutes,
      checkoutReminderTime: data.checkout_reminder_time,
      checkoutReminderEnabled: data.checkout_reminder_enabled,
      notifyEmployeeOnHrAdjustment: data.notify_employee_on_hr_adjustment,
      updatedBy: data.updated_by,
      updatedAt: data.updated_at,
    };
  }

  // Attendance Records
  static async getAttendanceRecords(): Promise<AttendanceRecord[] | null> {
    const { data, error } = await this.client
      .from('attendance_records')
      .select(`
        *,
        profiles:profile_id (
          full_name,
          employee_id,
          departments:department_id (name),
          designations:designation_id (title)
        )
      `)
      .order('attendance_date', { ascending: false });

    if (error || !data) return null;

    return data.map((r: any) => ({
      id: r.id,
      profileId: r.profile_id,
      employeeName: r.profiles?.full_name,
      employeeId: r.profiles?.employee_id,
      departmentName: r.profiles?.departments?.name,
      designationTitle: r.profiles?.designations?.title,
      attendanceDate: r.attendance_date,
      status: r.status,
      isLate: r.is_late,
      isHrAdjusted: r.is_hr_adjusted,
      hrAdjustmentReason: r.hr_adjustment_reason,
      adjustedBy: r.adjusted_by,
      adjustedAt: r.adjusted_at,
      workingDurationMinutes: r.working_duration_minutes,
      checkinTime: r.checkin_time,
      effectiveCheckinTime: r.effective_checkin_time,
      checkinSelfieUrl: r.checkin_selfie_url,
      checkinLatitude: r.checkin_latitude,
      checkinLongitude: r.checkin_longitude,
      checkinLocationName: r.checkin_location_name,
      checkoutTime: r.checkout_time,
      effectiveCheckoutTime: r.effective_checkout_time,
      checkoutSelfieUrl: r.checkout_selfie_url,
      checkoutLatitude: r.checkout_latitude,
      checkoutLongitude: r.checkout_longitude,
      checkoutLocationName: r.checkout_location_name,
      leaveType: r.leave_type,
      leaveReason: r.leave_reason,
      leaveComment: r.leave_comment,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  // Upload Selfie to Supabase Storage
  static async uploadSelfie(dataUrl: string, profileId: string, type: 'checkin' | 'checkout'): Promise<string | null> {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${profileId}/${date}_${type}_${Date.now()}.jpg`;

      const { data, error } = await this.client.storage
        .from('attendance-selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.warn('Storage upload warning:', error.message);
        return dataUrl; // fallback to dataUrl if bucket not created yet
      }

      const { data: publicData } = this.client.storage
        .from('attendance-selfies')
        .getPublicUrl(fileName);

      return publicData.publicUrl || dataUrl;
    } catch {
      return dataUrl;
    }
  }
}
