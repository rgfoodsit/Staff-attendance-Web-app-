-- ==============================================================================
-- Storage RLS Policies for attendance-selfies Bucket
-- Run this in your Supabase SQL Editor to allow photo uploads and viewing
-- ==============================================================================

-- 0. Create attendance-selfies bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-selfies', 'attendance-selfies', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Allow public uploads to attendance-selfies bucket
DO $$ BEGIN
    CREATE POLICY "Allow public uploads to attendance-selfies"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'attendance-selfies');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Allow public viewing of attendance-selfies photos
DO $$ BEGIN
    CREATE POLICY "Allow public view of attendance-selfies"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'attendance-selfies');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Allow updates / overwrites in attendance-selfies
DO $$ BEGIN
    CREATE POLICY "Allow public update to attendance-selfies"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'attendance-selfies');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
