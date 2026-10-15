import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();

    // Verify if already initialized
    const { count } = await supabase.from('profiles').select('id', { count: 'exact' });
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'An administrator account already exists. Please log in directly.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { fullName, employeeId, email, password, departmentId, designationId } = body;

    if (!fullName || !employeeId || !password || !departmentId || !designationId) {
      return NextResponse.json(
        { error: 'All required fields (Full Name, Employee ID, Password, Department, Designation) are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmpId = employeeId.trim();
    const emailToUse = (email && typeof email === 'string' && email.trim())
      ? email.trim().toLowerCase()
      : `${cleanEmpId.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.local`;

    // 1. Create or retrieve auth user in Supabase auth.users
    let userId: string | null = null;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailToUse,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        employee_id: cleanEmpId,
        role: 'admin',
      },
    });

    if (authData?.user?.id) {
      userId = authData.user.id;
    } else {
      // If user with this email or employee ID already exists in auth.users, recover and reuse
      const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = userList?.users?.find(
        (u) =>
          u.email?.toLowerCase() === emailToUse.toLowerCase() ||
          u.user_metadata?.employee_id?.toLowerCase() === cleanEmpId.toLowerCase()
      );
      if (existingUser) {
        userId = existingUser.id;
        await supabase.auth.admin.updateUserById(userId, {
          password: password,
          user_metadata: {
            full_name: fullName.trim(),
            employee_id: cleanEmpId,
            role: 'admin',
          },
        });
      } else {
        return NextResponse.json(
          { error: authError?.message || 'Failed to setup admin user in authentication.' },
          { status: 500 }
        );
      }
    }

    // 2. Upsert into profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          employee_id: cleanEmpId,
          full_name: fullName.trim(),
          department_id: departmentId,
          designation_id: designationId,
          role: 'admin',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .single();

    if (profileError) {
      // rollback auth user if profile insertion failed
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: profileError.message || 'Failed to create profile record.' },
        { status: 500 }
      );
    }

    const formattedUser = {
      id: profile.id,
      employeeId: profile.employee_id,
      fullName: profile.full_name,
      departmentId: profile.department_id,
      departmentName: profile.departments?.name || 'Management',
      designationId: profile.designation_id,
      designationTitle: profile.designations?.title || 'System Administrator',
      role: profile.role,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return NextResponse.json({
      success: true,
      message: 'Initial administrator successfully created!',
      user: formattedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
