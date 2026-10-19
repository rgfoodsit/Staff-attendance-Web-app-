import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const [profilesRes, usersRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, departments:department_id(name), designations:designation_id(title)')
        .order('created_at', { ascending: false }),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const userMetadataMap = new Map<string, any>();
    if (usersRes.data?.users) {
      usersRes.data.users.forEach((u) => {
        userMetadataMap.set(u.id, u.user_metadata || {});
      });
    }

    const formatted = (profilesRes.data || []).map((p: any) => {
      const meta = userMetadataMap.get(p.id) || {};
      return {
        id: p.id,
        employeeId: p.employee_id,
        fullName: p.full_name,
        departmentId: p.department_id,
        departmentName: p.departments?.name || 'Department',
        designationId: p.designation_id,
        designationTitle: p.designations?.title || 'Staff',
        role: p.role,
        isActive: p.is_active !== false,
        assignedPassword: meta.assigned_password || meta.initial_password || '',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    return NextResponse.json({ profiles: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error loading profiles' }, { status: 500 });
  }
}
