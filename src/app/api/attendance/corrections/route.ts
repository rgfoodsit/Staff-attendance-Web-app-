import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLocalDateString } from '@/lib/utils';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('attendance_corrections')
      .select('*, profiles:profile_id(full_name, employee_id), reviewer:reviewed_by(full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      attendanceId: c.attendance_id,
      profileId: c.profile_id,
      employeeName: c.profiles?.full_name || 'Staff Member',
      employeeId: c.profiles?.employee_id || 'EMP',
      correctionType: c.correction_type,
      originalCheckinTime: c.original_checkin_time,
      originalCheckoutTime: c.original_checkout_time,
      originalStatus: c.original_status,
      requestedCheckinTime: c.requested_checkin_time,
      requestedCheckoutTime: c.requested_checkout_time,
      requestedStatus: c.requested_status,
      reason: c.reason,
      status: c.status,
      reviewedBy: c.reviewed_by,
      reviewedByName: c.reviewer?.full_name,
      reviewedAt: c.reviewed_at,
      reviewRemarks: c.review_remarks,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ corrections: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error loading corrections' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const {
      attendanceId,
      profileId,
      correctionType,
      originalCheckinTime,
      originalCheckoutTime,
      originalStatus,
      requestedCheckinTime,
      requestedCheckoutTime,
      requestedStatus,
      reason,
    } = body;

    if (!profileId || !reason || !correctionType) {
      return NextResponse.json(
        { error: 'Profile ID, correction type, and reason are required' },
        { status: 400 }
      );
    }

    // Ensure attendance record exists in Supabase so foreign key is satisfied
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attendanceId);
    let validAttendanceId = attendanceId;

    if (!isUuid) {
      const { data: existingRec } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('profile_id', profileId)
        .order('attendance_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRec) {
        validAttendanceId = existingRec.id;
      } else {
        const { data: newRec } = await supabase
          .from('attendance_records')
          .insert({
            profile_id: profileId,
            attendance_date: getLocalDateString(),
            status: originalStatus || 'checked_in',
            checkin_time: originalCheckinTime || new Date().toISOString(),
          })
          .select('id')
          .single();
        if (newRec) validAttendanceId = newRec.id;
      }
    } else {
      const { data: exists } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('id', validAttendanceId)
        .maybeSingle();

      if (!exists) {
        const { data: created } = await supabase
          .from('attendance_records')
          .insert({
            id: validAttendanceId,
            profile_id: profileId,
            attendance_date: getLocalDateString(),
            status: originalStatus || 'checked_in',
            checkin_time: originalCheckinTime || new Date().toISOString(),
          })
          .select('id')
          .single();
        if (created) validAttendanceId = created.id;
      }
    }

    const { data: insertResult, error: insertErr } = await supabase
      .from('attendance_corrections')
      .insert({
        attendance_id: validAttendanceId,
        profile_id: profileId,
        correction_type: correctionType,
        original_checkin_time: originalCheckinTime || null,
        original_checkout_time: originalCheckoutTime || null,
        original_status: originalStatus || null,
        requested_checkin_time: requestedCheckinTime || null,
        requested_checkout_time: requestedCheckoutTime || null,
        requested_status: requestedStatus || null,
        reason: reason.trim(),
        status: 'pending',
      })
      .select('*, profiles:profile_id(full_name, employee_id)')
      .single();

    if (insertErr) throw insertErr;

    const formatted = {
      id: insertResult.id,
      attendanceId: insertResult.attendance_id,
      profileId: insertResult.profile_id,
      employeeName: insertResult.profiles?.full_name || 'Staff Member',
      employeeId: insertResult.profiles?.employee_id || 'EMP',
      correctionType: insertResult.correction_type,
      originalCheckinTime: insertResult.original_checkin_time,
      originalCheckoutTime: insertResult.original_checkout_time,
      originalStatus: insertResult.original_status,
      requestedCheckinTime: insertResult.requested_checkin_time,
      requestedCheckoutTime: insertResult.requested_checkout_time,
      requestedStatus: insertResult.requested_status,
      reason: insertResult.reason,
      status: insertResult.status,
      reviewedBy: insertResult.reviewed_by,
      reviewedAt: insertResult.reviewed_at,
      reviewRemarks: insertResult.review_remarks,
      createdAt: insertResult.created_at,
    };

    return NextResponse.json({ success: true, correction: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error submitting correction' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { correctionId, status, reviewRemarks, reviewerId } = body;

    if (!correctionId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid correction ID and status (approved/rejected) are required' },
        { status: 400 }
      );
    }

    const { data: correction, error: fetchErr } = await supabase
      .from('attendance_corrections')
      .select('*')
      .eq('id', correctionId)
      .single();

    if (fetchErr || !correction) {
      return NextResponse.json({ error: 'Correction record not found' }, { status: 404 });
    }

    const reviewedAt = new Date().toISOString();
    const { data: updatedCorr, error: updateErr } = await supabase
      .from('attendance_corrections')
      .update({
        status,
        reviewed_by: reviewerId || null,
        reviewed_at: reviewedAt,
        review_remarks: reviewRemarks || null,
      })
      .eq('id', correctionId)
      .select('*, profiles:profile_id(full_name, employee_id), reviewer:reviewed_by(full_name)')
      .single();

    if (updateErr) throw updateErr;

    let updatedAttendanceRecord = null;
    if (status === 'approved') {
      const { data: currentAtt } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', correction.attendance_id)
        .maybeSingle();

      if (currentAtt) {
        const newCheckin =
          correction.requested_checkin_time ||
          currentAtt.effective_checkin_time ||
          currentAtt.checkin_time;
        const newCheckout =
          correction.requested_checkout_time ||
          currentAtt.effective_checkout_time ||
          currentAtt.checkout_time;

        let duration = currentAtt.working_duration_minutes;
        if (newCheckin && newCheckout) {
          duration = Math.max(
            0,
            Math.round(
              (new Date(newCheckout).getTime() - new Date(newCheckin).getTime()) / (1000 * 60)
            )
          );
        }

        const updateData: any = {
          effective_checkin_time: newCheckin,
          effective_checkout_time: newCheckout,
          status: correction.requested_status || (newCheckout ? 'checked_out' : currentAtt.status),
          working_duration_minutes: duration,
          is_hr_adjusted: true,
          hr_adjustment_reason: `Correction Approved: ${correction.reason}`,
          adjusted_by: reviewerId || null,
          adjusted_at: reviewedAt,
          updated_at: reviewedAt,
        };

        const { data: updAtt } = await supabase
          .from('attendance_records')
          .update(updateData)
          .eq('id', correction.attendance_id)
          .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
          .single();

        if (updAtt) {
          updatedAttendanceRecord = {
            id: updAtt.id,
            profileId: updAtt.profile_id,
            employeeName: updAtt.profiles?.full_name,
            employeeId: updAtt.profiles?.employee_id,
            departmentName: updAtt.profiles?.departments?.name,
            designationTitle: updAtt.profiles?.designations?.title,
            attendanceDate: updAtt.attendance_date,
            status: updAtt.status,
            isLate: updAtt.is_late,
            isHrAdjusted: updAtt.is_hr_adjusted,
            hrAdjustmentReason: updAtt.hr_adjustment_reason,
            adjustedBy: updAtt.adjusted_by,
            adjustedAt: updAtt.adjusted_at,
            workingDurationMinutes: updAtt.working_duration_minutes,
            checkinTime: updAtt.checkin_time,
            effectiveCheckinTime: updAtt.effective_checkin_time,
            checkinSelfieUrl: updAtt.checkin_selfie_url,
            checkoutTime: updAtt.checkout_time,
            effectiveCheckoutTime: updAtt.effective_checkout_time,
            checkoutSelfieUrl: updAtt.checkout_selfie_url,
            createdAt: updAtt.created_at,
            updatedAt: updAtt.updated_at,
          };
        }
      }
    }

    const formattedCorr = {
      id: updatedCorr.id,
      attendanceId: updatedCorr.attendance_id,
      profileId: updatedCorr.profile_id,
      employeeName: updatedCorr.profiles?.full_name,
      employeeId: updatedCorr.profiles?.employee_id,
      correctionType: updatedCorr.correction_type,
      originalCheckinTime: updatedCorr.original_checkin_time,
      originalCheckoutTime: updatedCorr.original_checkout_time,
      originalStatus: updatedCorr.original_status,
      requestedCheckinTime: updatedCorr.requested_checkin_time,
      requestedCheckoutTime: updatedCorr.requested_checkout_time,
      requestedStatus: updatedCorr.requested_status,
      reason: updatedCorr.reason,
      status: updatedCorr.status,
      reviewedBy: updatedCorr.reviewed_by,
      reviewedByName: updatedCorr.reviewer?.full_name,
      reviewedAt: updatedCorr.reviewed_at,
      reviewRemarks: updatedCorr.review_remarks,
      createdAt: updatedCorr.created_at,
    };

    return NextResponse.json({
      success: true,
      correction: formattedCorr,
      updatedAttendanceRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error reviewing correction' }, { status: 500 });
  }
}
