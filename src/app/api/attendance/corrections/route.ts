import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Retrieve all correction requests with employee & attendance info
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('attendance_corrections')
      .select(`
        *,
        profiles:profile_id(full_name, employee_id),
        reviewers:reviewed_by(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      attendanceId: c.attendance_id,
      profileId: c.profile_id,
      employeeName: c.profiles?.full_name || '',
      employeeId: c.profiles?.employee_id || '',
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
      reviewedByName: c.reviewers?.full_name,
      reviewedAt: c.reviewed_at,
      reviewRemarks: c.review_remarks,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ corrections: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching corrections' }, { status: 500 });
  }
}

// POST: Submit a new attendance correction request
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

    if (!attendanceId || !profileId || !correctionType || !reason) {
      return NextResponse.json(
        { error: 'Missing required correction fields (attendanceId, profileId, correctionType, reason).' },
        { status: 400 }
      );
    }

    // Verify or find real attendance record UUID in Supabase
    let validAttendanceId = attendanceId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attendanceId);

    if (!isUuid) {
      // Find the user's latest attendance record for reference
      const { data: latestRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('profile_id', profileId)
        .order('attendance_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestRecord) {
        validAttendanceId = latestRecord.id;
      } else {
        return NextResponse.json(
          { error: 'Attendance record not found in database to link correction request.' },
          { status: 404 }
        );
      }
    }

    const { data: created, error } = await supabase
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

    if (error) throw error;

    const formatted = {
      id: created.id,
      attendanceId: created.attendance_id,
      profileId: created.profile_id,
      employeeName: created.profiles?.full_name,
      employeeId: created.profiles?.employee_id,
      correctionType: created.correction_type,
      originalCheckinTime: created.original_checkin_time,
      originalCheckoutTime: created.original_checkout_time,
      originalStatus: created.original_status,
      requestedCheckinTime: created.requested_checkin_time,
      requestedCheckoutTime: created.requested_checkout_time,
      requestedStatus: created.requested_status,
      reason: created.reason,
      status: created.status,
      createdAt: created.created_at,
    };

    return NextResponse.json({ success: true, correction: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error submitting correction' }, { status: 500 });
  }
}

// PATCH: Review a correction (Approve / Reject)
export async function PATCH(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { correctionId, status, reviewRemarks, reviewerId } = body;

    if (!correctionId || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid correctionId and status (approved or rejected) are required.' }, { status: 400 });
    }

    // 1. Fetch current correction
    const { data: current, error: fetchErr } = await supabase
      .from('attendance_corrections')
      .select('*')
      .eq('id', correctionId)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Correction request not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 2. Update correction status
    const { data: updated, error: updateErr } = await supabase
      .from('attendance_corrections')
      .update({
        status: status,
        reviewed_by: reviewerId || null,
        reviewed_at: now,
        review_remarks: reviewRemarks || null,
      })
      .eq('id', correctionId)
      .select('*, profiles:profile_id(full_name, employee_id), reviewers:reviewed_by(full_name)')
      .single();

    if (updateErr) throw updateErr;

    // 3. If approved, apply the requested changes to the linked attendance_records row
    let updatedAttendanceRecord = null;
    if (status === 'approved') {
      const { data: attRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', current.attendance_id)
        .single();

      if (attRecord) {
        const newCheckin = current.requested_checkin_time || attRecord.effective_checkin_time || attRecord.checkin_time;
        const newCheckout = current.requested_checkout_time || attRecord.effective_checkout_time || attRecord.checkout_time;
        let duration = attRecord.working_duration_minutes;

        if (newCheckin && newCheckout) {
          duration = Math.max(0, Math.round((new Date(newCheckout).getTime() - new Date(newCheckin).getTime()) / (1000 * 60)));
        }

        const newStatus = current.requested_status || (newCheckout ? 'checked_out' : attRecord.status);

        const { data: appliedRecord, error: applyErr } = await supabase
          .from('attendance_records')
          .update({
            effective_checkin_time: current.requested_checkin_time || attRecord.effective_checkin_time,
            effective_checkout_time: current.requested_checkout_time || attRecord.effective_checkout_time,
            status: newStatus,
            working_duration_minutes: duration,
            is_hr_adjusted: true,
            hr_adjustment_reason: `Correction Approved: ${current.reason}`,
            adjusted_by: reviewerId || null,
            adjusted_at: now,
            updated_at: now,
          })
          .eq('id', current.attendance_id)
          .select('*, profiles:profile_id(full_name, employee_id, departments:department_id(name), designations:designation_id(title))')
          .single();

        if (!applyErr && appliedRecord) {
          updatedAttendanceRecord = {
            id: appliedRecord.id,
            profileId: appliedRecord.profile_id,
            employeeName: appliedRecord.profiles?.full_name,
            employeeId: appliedRecord.profiles?.employee_id,
            departmentName: appliedRecord.profiles?.departments?.name,
            designationTitle: appliedRecord.profiles?.designations?.title,
            attendanceDate: appliedRecord.attendance_date,
            status: appliedRecord.status,
            isLate: appliedRecord.is_late,
            isHrAdjusted: appliedRecord.is_hr_adjusted,
            hrAdjustmentReason: appliedRecord.hr_adjustment_reason,
            adjustedBy: appliedRecord.adjusted_by,
            adjustedAt: appliedRecord.adjusted_at,
            workingDurationMinutes: appliedRecord.working_duration_minutes,
            checkinTime: appliedRecord.checkin_time,
            effectiveCheckinTime: appliedRecord.effective_checkin_time,
            checkoutTime: appliedRecord.checkout_time,
            effectiveCheckoutTime: appliedRecord.effective_checkout_time,
            createdAt: appliedRecord.created_at,
            updatedAt: appliedRecord.updated_at,
          };
        }
      }
    }

    const formatted = {
      id: updated.id,
      attendanceId: updated.attendance_id,
      profileId: updated.profile_id,
      employeeName: updated.profiles?.full_name,
      employeeId: updated.profiles?.employee_id,
      correctionType: updated.correction_type,
      originalCheckinTime: updated.original_checkin_time,
      originalCheckoutTime: updated.original_checkout_time,
      originalStatus: updated.original_status,
      requestedCheckinTime: updated.requested_checkin_time,
      requestedCheckoutTime: updated.requested_checkout_time,
      requestedStatus: updated.requested_status,
      reason: updated.reason,
      status: updated.status,
      reviewedBy: updated.reviewed_by,
      reviewedByName: updated.reviewers?.full_name,
      reviewedAt: updated.reviewed_at,
      reviewRemarks: updated.review_remarks,
      createdAt: updated.created_at,
    };

    return NextResponse.json({
      success: true,
      correction: formatted,
      updatedAttendanceRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error reviewing correction' }, { status: 500 });
  }
}
