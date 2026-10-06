import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const [profilesRes, deptsRes, desigsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('departments').select('*').eq('is_active', true),
      supabase.from('designations').select('*').eq('is_active', true),
    ]);

    const count = profilesRes.count || 0;

    return NextResponse.json({
      initialized: count > 0,
      profilesCount: count,
      departments: deptsRes.data || [],
      designations: desigsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error checking status' }, { status: 500 });
  }
}
