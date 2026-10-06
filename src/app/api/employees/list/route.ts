import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, departments:department_id(name), designations:designation_id(title)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      employeeId: p.employee_id,
      fullName: p.full_name,
      departmentId: p.department_id,
      departmentName: p.departments?.name || 'Department',
      designationId: p.designation_id,
      designationTitle: p.designations?.title || 'Staff',
      role: p.role,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ profiles: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error loading profiles' }, { status: 500 });
  }
}
