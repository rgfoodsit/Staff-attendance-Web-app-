import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLocalDateString } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { profileId, selfieUrl, latitude, longitude, locationName } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const today = getLocalDateString();

    // 1. Fetch today's checkin
    const { data: existing, error: fetchErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('profile_id', profileId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (fetchErr || !existing || !existing.checkin_time) {
      return NextResponse.json({ error: 'You must check in before checking out.' }, { status: 400 });
    }

    if (existing.checkout_time) {
      return NextResponse.json({ error: 'Check-out has already been completed for today.' }, { status: 400 });
    }

    const now = new Date();
    const checkinDate = new Date(existing.effective_checkin_time || existing.checkin_time);
    if (now.getTime() < checkinDate.getTime()) {
      return NextResponse.json({ error: 'Check-out time cannot be earlier than check-in time.' }, { status: 400 });
    }

    const durationMinutes = Math.max(0, Math.round((now.getTime() - checkinDate.getTime()) / (1000 * 60)));

    const updateData = {
      status: existing.is_late ? 'late' : 'checked_out',
      checkout_time: now.toISOString(),
      effective_checkout_time: now.toISOString(),
      checkout_selfie_url: selfieUrl,
      checkout_latitude: latitude,
      checkout_longitude: longitude,
      checkout_location_name: locationName,
      working_duration_minutes: durationMinutes,
      updated_at: now.toISOString(),
    };

    const { data: result, error: updateErr } = await supabase
      .from('attendance_records')
      .update(updateData)
      .eq('id', existing.id)
      .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
      .single();

    if (updateErr) throw updateErr;

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
        isHrAdjusted: result.is_hr_adjusted,
        workingDurationMinutes: result.working_duration_minutes,
        checkinTime: result.checkin_time,
        effectiveCheckinTime: result.effective_checkin_time,
        checkinSelfieUrl: result.checkin_selfie_url,
        checkinLatitude: result.checkin_latitude,
        checkinLongitude: result.checkin_longitude,
        checkinLocationName: result.checkin_location_name,
        checkoutTime: result.checkout_time,
        effectiveCheckoutTime: result.effective_checkout_time,
        checkoutSelfieUrl: result.checkout_selfie_url,
        checkoutLatitude: result.checkout_latitude,
        checkoutLongitude: result.checkout_longitude,
        checkoutLocationName: result.checkout_location_name,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Check-out error' }, { status: 500 });
  }
}
