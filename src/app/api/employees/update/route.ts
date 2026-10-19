import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, fullName, employeeId, departmentId, designationId, role, password, isActive, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee account ID is required for update.' },
        { status: 400 }
      );
    }

    // Resolve target active status if explicitly passed
    const targetIsActive =
      typeof isActive === 'boolean'
        ? isActive
        : typeof is_active === 'boolean'
        ? is_active
        : undefined;

    const cleanEmpId = typeof employeeId === 'string' && employeeId.trim() ? employeeId.trim() : undefined;

    // 1. If employee ID is being changed, check if it is used by another profile
    if (cleanEmpId) {
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
    }

    // 2. Fetch existing user metadata from Supabase auth to merge
    const { data: userData } = await supabase.auth.admin.getUserById(id);
    const existingMeta = userData?.user?.user_metadata || {};

    const newMeta: Record<string, any> = {
      ...existingMeta,
    };
    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      newMeta.full_name = fullName.trim();
    }
    if (cleanEmpId) {
      newMeta.employee_id = cleanEmpId;
    }
    if (role) {
      newMeta.role = role;
    }
    if (targetIsActive !== undefined) {
      newMeta.is_active = targetIsActive;
    }

    const updateAuthPayload: Record<string, any> = {
      user_metadata: newMeta,
    };

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      updateAuthPayload.password = password.trim();
      newMeta.assigned_password = password.trim();
    }

    // Synchronize auth ban state: ban deactivated accounts to prevent token renewal
    if (targetIsActive === false) {
      updateAuthPayload.ban_duration = '876600h';
    } else if (targetIsActive === true) {
      updateAuthPayload.ban_duration = 'none';
    }

    const { error: primaryAuthError } = await supabase.auth.admin.updateUserById(id, updateAuthPayload);
    if (primaryAuthError) {
      // If ban_duration fails due to Supabase auth version nuances, retry updating metadata & password
      delete updateAuthPayload.ban_duration;
      const { error: fallbackAuthError } = await supabase.auth.admin.updateUserById(id, updateAuthPayload);
      if (fallbackAuthError) {
        console.warn('Notice: Failed updating Supabase Auth metadata for employee:', fallbackAuthError.message);
      }
    }

    // 3. Update profiles table in Supabase
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      updatePayload.full_name = fullName.trim();
    }
    if (cleanEmpId) {
      updatePayload.employee_id = cleanEmpId;
    }
    if (departmentId) {
      updatePayload.department_id = departmentId;
    }
    if (designationId) {
      updatePayload.designation_id = designationId;
    }
    if (role) {
      updatePayload.role = role;
    }
    if (targetIsActive !== undefined) {
      updatePayload.is_active = targetIsActive;
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .single();

    if (profileError) {
      console.error('Error updating profiles row in database:', profileError);
      return NextResponse.json({ error: profileError.message || 'Failed to update employee profile in database.' }, { status: 500 });
    }

    const formattedProfile = {
      id: updatedProfile.id,
      employeeId: updatedProfile.employee_id,
      fullName: updatedProfile.full_name,
      departmentId: updatedProfile.department_id,
      departmentName: updatedProfile.departments?.name || 'Department',
      designationId: updatedProfile.designation_id,
      designationTitle: updatedProfile.designations?.title || 'Staff',
      role: updatedProfile.role,
      isActive: updatedProfile.is_active !== false,
      assignedPassword: newMeta.assigned_password || newMeta.initial_password || '',
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    };

    return NextResponse.json({
      success: true,
      profile: formattedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error updating employee' }, { status: 500 });
  }
}
