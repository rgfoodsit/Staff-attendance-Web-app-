import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { fullName, employeeId, email, password, departmentId, designationId, role = 'employee' } = body;

    if (!fullName || !employeeId || !email || !password || !departmentId || !designationId) {
      return NextResponse.json(
        { error: 'All fields (Full Name, Employee ID, Email, Password, Department, Designation) are required.' },
        { status: 400 }
      );
    }

    // 1. Check if employee ID or email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('employee_id')
      .ilike('employee_id', employeeId.trim())
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: `Employee ID "${employeeId}" is already registered.` },
        { status: 400 }
      );
    }

    // 2. Create user in Supabase auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        employee_id: employeeId.trim(),
        role: role,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user in authentication system.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 3. Insert into profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        employee_id: employeeId.trim(),
        full_name: fullName.trim(),
        department_id: departmentId,
        designation_id: designationId,
        role: role,
        is_active: true,
      })
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: profileError.message || 'Failed to create employee profile record.' },
        { status: 500 }
      );
    }

    const formattedUser = {
      id: profile.id,
      employeeId: profile.employee_id,
      fullName: profile.full_name,
      departmentId: profile.department_id,
      departmentName: profile.departments?.name || 'Department',
      designationId: profile.designation_id,
      designationTitle: profile.designations?.title || 'Staff',
      role: profile.role,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
