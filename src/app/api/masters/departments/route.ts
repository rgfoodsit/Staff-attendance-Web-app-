import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ departments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { name, code } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: name.trim(),
        code: (code || name.slice(0, 3)).trim().toUpperCase(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      department: {
        id: data.id,
        name: data.name,
        code: data.code,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create department' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    // Try hard delete; if referenced, soft delete (is_active = false)
    const { error: delErr } = await supabase.from('departments').delete().eq('id', id);

    if (delErr) {
      // If foreign key constraint prevents deletion, deactivate it instead
      const { error: updateErr } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', id);

      if (updateErr) throw updateErr;
    }

    return NextResponse.json({ success: true, message: 'Department removed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete department' }, { status: 500 });
  }
}
