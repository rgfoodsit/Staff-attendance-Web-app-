import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const id = body.id || body.profileId;
    const targetIsActive =
      typeof body.isActive === 'boolean'
        ? body.isActive
        : typeof body.is_active === 'boolean'
        ? body.is_active
        : undefined;

    if (!id || targetIsActive === undefined) {
      return NextResponse.json(
        { error: 'Profile ID and active status (boolean) are required.' },
        { status: 400 }
      );
    }

    // 1. Update profiles table
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        is_active: targetIsActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .single();

    if (profileError) {
      console.error('Error updating profiles is_active:', profileError);
      return NextResponse.json(
        { error: profileError.message || 'Failed to update employee status in database.' },
        { status: 500 }
      );
    }

    // 2. Synchronize auth user metadata and ban state
    const { data: userData } = await supabase.auth.admin.getUserById(id);
    const existingMeta = userData?.user?.user_metadata || {};
    const updateAuthPayload: Record<string, any> = {
      user_metadata: {
        ...existingMeta,
        is_active: targetIsActive,
      },
    };

    if (targetIsActive === false) {
      updateAuthPayload.ban_duration = '876600h';
    } else {
      updateAuthPayload.ban_duration = 'none';
    }

    const { error: primaryAuthError } = await supabase.auth.admin.updateUserById(id, updateAuthPayload);
    if (primaryAuthError) {
      delete updateAuthPayload.ban_duration;
      await supabase.auth.admin.updateUserById(id, updateAuthPayload);
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
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    };

    return NextResponse.json({
      success: true,
      profile: formattedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error updating status' }, { status: 500 });
  }
}
