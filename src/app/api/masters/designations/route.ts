import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('designations')
      .select('*')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ designations: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch designations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Designation title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('designations')
      .insert({
        title: title.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      designation: {
        id: data.id,
        title: data.title,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create designation' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Designation ID is required' }, { status: 400 });
    }

    // Try hard delete; if referenced, soft delete (is_active = false)
    const { error: delErr } = await supabase.from('designations').delete().eq('id', id);

    if (delErr) {
      // If foreign key constraint prevents deletion, deactivate it instead
      const { error: updateErr } = await supabase
        .from('designations')
        .update({ is_active: false })
        .eq('id', id);

      if (updateErr) throw updateErr;
    }

    return NextResponse.json({ success: true, message: 'Designation removed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete designation' }, { status: 500 });
  }
}
