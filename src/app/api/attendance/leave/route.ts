import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLocalDateString } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { profileId, leaveType, reason, comment } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const today = getLocalDateString();
    const status = leaveType ? 'half_day_leave' : 'leave';

    const insertData = {
      profile_id: profileId,
      attendance_date: today,
      status: status,
      is_late: false,
      is_hr_adjusted: false,
      leave_type: leaveType,
      leave_reason: reason,
      leave_comment: comment,
    };

    const { data: result, error } = await supabase
      .from('attendance_records')
      .upsert(insertData, { onConflict: 'profile_id,attendance_date' })
      .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      record: {
        id: result.id,
        profileId: result.profile_id,
        employeeName: result.profiles?.full_name,
        employeeId: result.profiles?.employee_id,
        departmentName: result.profiles?.departments?.name,
        designationTitle: result.profiles?.designations?.title,
        attendanceDate: result.attendance_date,
        status: result.status,
        isLate: result.is_late,
        leaveType: result.leave_type,
        leaveReason: result.leave_reason,
        leaveComment: result.leave_comment,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Leave error' }, { status: 500 });
  }
}
