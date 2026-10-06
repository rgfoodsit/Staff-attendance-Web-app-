import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmlsbqtydwtgyabrvhxu.supabase.co';
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MxDhZBBE-yhKtiQyossNYw_HFmXvJJR';

export async function POST(req: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Please enter your Employee ID or Email and password.' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    let emailToAuth = trimmed;

    // 1. If identifier is NOT an email (does not contain '@'), resolve email via profiles table
    if (!trimmed.includes('@')) {
      const { data: profile, error: profileErr } = await adminSupabase
        .from('profiles')
        .select('id, employee_id, is_active')
        .or(`employee_id.ilike.${trimmed},full_name.ilike.${trimmed}`)
        .single();

      if (profileErr || !profile) {
        return NextResponse.json(
          { error: `No employee account found matching "${trimmed}". Please check your Employee ID.` },
          { status: 404 }
        );
      }

      if (!profile.is_active) {
        return NextResponse.json(
          { error: 'This employee account has been deactivated. Please contact HR or Admin.' },
          { status: 403 }
        );
      }

      // Fetch user's registered email from auth.users
      const { data: authUser, error: authUserErr } = await adminSupabase.auth.admin.getUserById(profile.id);
      if (authUserErr || !authUser?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication credentials could not be resolved for this account.' },
          { status: 500 }
        );
      }

      emailToAuth = authUser.user.email;
    }

    // 2. Authenticate credentials via dedicated auth client (isolated from service role client)
    const authSupabase = createClient(SUPABASE_URL, ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: signInData, error: signInErr } = await authSupabase.auth.signInWithPassword({
      email: emailToAuth,
      password: password,
    });

    if (signInErr || !signInData.user) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // 3. Retrieve full profile with department and designation using admin client (bypasses RLS)
    const { data: profileData, error: profileFetchErr } = await adminSupabase
      .from('profiles')
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .eq('id', signInData.user.id)
      .single();

    if (profileFetchErr || !profileData) {
      return NextResponse.json(
        { error: 'Employee profile record missing in database.' },
        { status: 404 }
      );
    }

    const formattedUser = {
      id: profileData.id,
      employeeId: profileData.employee_id,
      fullName: profileData.full_name,
      departmentId: profileData.department_id,
      departmentName: profileData.departments?.name || 'General',
      designationId: profileData.designation_id,
      designationTitle: profileData.designations?.title || 'Staff',
      role: profileData.role,
      isActive: profileData.is_active,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
      profile: formattedUser,
      session: signInData.session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
