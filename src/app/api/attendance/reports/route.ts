import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLocalDateString } from '@/lib/utils';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('daily_work_reports')
      .select('*, profiles:profile_id(full_name, employee_id)')
      .order('report_date', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      profileId: r.profile_id,
      employeeName: r.profiles?.full_name || 'Staff',
      employeeId: r.profiles?.employee_id || '',
      reportDate: r.report_date,
      reportText: r.report_text,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isReadOnly: false,
    }));

    return NextResponse.json({ reports: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error loading work reports' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { profileId, reportText, reportDate } = body;

    if (!profileId || !reportText) {
      return NextResponse.json({ error: 'Profile ID and report text are required.' }, { status: 400 });
    }

    const dateToUse = reportDate || getLocalDateString();

    // Check if report already exists for this profile on this date
    const { data: existing } = await supabase
      .from('daily_work_reports')
      .select('id')
      .eq('profile_id', profileId)
      .eq('report_date', dateToUse)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('daily_work_reports')
        .update({
          report_text: reportText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*, profiles:profile_id(full_name, employee_id)')
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('daily_work_reports')
        .insert({
          profile_id: profileId,
          report_date: dateToUse,
          report_text: reportText,
        })
        .select('*, profiles:profile_id(full_name, employee_id)')
        .single();

      if (error) throw error;
      result = data;
    }

    const formatted = {
      id: result.id,
      profileId: result.profile_id,
      employeeName: result.profiles?.full_name || 'Staff',
      employeeId: result.profiles?.employee_id || '',
      reportDate: result.report_date,
      reportText: result.report_text,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      isReadOnly: false,
    };

    return NextResponse.json({
      success: true,
      report: formatted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error saving work report' }, { status: 500 });
  }
}
