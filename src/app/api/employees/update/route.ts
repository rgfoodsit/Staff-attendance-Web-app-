import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, fullName, employeeId, departmentId, designationId, role, password } = body;

    if (!id || !fullName || !employeeId || !departmentId || !designationId) {
      return NextResponse.json(
        { error: 'Required fields missing for employee update.' },
        { status: 400 }
      );
    }

    const cleanEmpId = employeeId.trim();

    // 1. Check if employee ID is used by another profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, employee_id')
      .ilike('employee_id', cleanEmpId)
      .neq('id', id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: `Employee ID "${cleanEmpId}" is already taken by another account.` },
        { status: 400 }
      );
    }

    // 2. If new password provided, update in Supabase Auth
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        password: password.trim(),
        user_metadata: {
          full_name: fullName.trim(),
          employee_id: cleanEmpId,
          role: role || 'employee',
        },
      });

      if (authError) {
        console.error('Failed to update employee password in Supabase auth:', authError);
      }
    }

    // 3. Update profiles table
    const updatePayload: Record<string, any> = {
      full_name: fullName.trim(),
      employee_id: cleanEmpId,
      department_id: departmentId,
      designation_id: designationId,
      updated_at: new Date().toISOString(),
    };
    if (role) {
      updatePayload.role = role;
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .single();

    if (profileError) {
      console.error('Error updating profiles row:', profileError);
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
