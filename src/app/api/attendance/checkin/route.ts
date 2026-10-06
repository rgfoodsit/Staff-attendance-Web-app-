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

    // 1. Check existing record for today
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('profile_id', profileId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (existing && existing.checkin_time) {
      return NextResponse.json({ error: 'Check-in has already been completed for today.' }, { status: 400 });
    }
    if (existing && existing.status === 'leave') {
      return NextResponse.json({ error: 'Full-day leave is recorded for today. Check-in is prevented.' }, { status: 400 });
    }

    // 2. Load attendance settings for late threshold
    const { data: settings } = await supabase.from('attendance_settings').select('*').single();
    const officialCheckin = settings?.official_checkin_time || '09:00:00';
    const lateThresholdMinutes = settings?.late_threshold_minutes ?? 15;

    const now = new Date();
    const [ruleHour, ruleMin] = officialCheckin.split(':').map(Number);
    const lateThreshold = new Date(now);
    lateThreshold.setHours(ruleHour, ruleMin + lateThresholdMinutes, 0, 0);

    const isLate = now.getTime() > lateThreshold.getTime();
    const status = isLate ? 'late' : 'checked_in';

    const insertData = {
      profile_id: profileId,
      attendance_date: today,
      status: status,
      is_late: isLate,
      is_hr_adjusted: false,
      checkin_time: now.toISOString(),
      effective_checkin_time: now.toISOString(),
      checkin_selfie_url: selfieUrl,
      checkin_latitude: latitude,
      checkin_longitude: longitude,
      checkin_location_name: locationName,
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('attendance_records')
        .update(insertData)
        .eq('id', existing.id)
        .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('attendance_records')
        .insert(insertData)
        .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
        .single();
      if (error) throw error;
      result = data;
    }

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
        checkinTime: result.checkin_time,
        effectiveCheckinTime: result.effective_checkin_time,
        checkinSelfieUrl: result.checkin_selfie_url,
        checkinLatitude: result.checkin_latitude,
        checkinLongitude: result.checkin_longitude,
        checkinLocationName: result.checkin_location_name,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Check-in error' }, { status: 500 });
  }
}
