import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = createAdminClient();
    let query = supabase
      .from('attendance_records')
      .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
      .order('attendance_date', { ascending: false });

    if (date) {
      query = query.eq('attendance_date', date);
    } else if (startDate && endDate) {
      query = query.gte('attendance_date', startDate).lte('attendance_date', endDate);
    } else if (startDate) {
      query = query.gte('attendance_date', startDate);
    } else if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    const { data, error } = await query;

    const formatted = (data || []).map((r: any) => ({
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
      checkinLatitude: r.checkin_latitude ? Number(r.checkin_latitude) : undefined,
      checkinLongitude: r.checkin_longitude ? Number(r.checkin_longitude) : undefined,
      checkinLocationName: r.checkin_location_name,
      checkoutTime: r.checkout_time,
      effectiveCheckoutTime: r.effective_checkout_time,
      checkoutSelfieUrl: r.checkout_selfie_url,
      checkoutLatitude: r.checkout_latitude ? Number(r.checkout_latitude) : undefined,
      checkoutLongitude: r.checkout_longitude ? Number(r.checkout_longitude) : undefined,
      checkoutLocationName: r.checkout_location_name,
      leaveType: r.leave_type,
      leaveReason: r.leave_reason,
      leaveComment: r.leave_comment,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ records: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error loading records' }, { status: 500 });
  }
}
