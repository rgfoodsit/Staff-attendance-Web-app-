-- ==============================================================================
-- Initial Seed Data for Staff Attendance App
-- Run this in the Supabase SQL Editor to populate initial master data and settings
-- ==============================================================================

-- 1. Singleton Attendance Timing Settings (HR Defaults: 09:00 AM, 15m grace, 7:00 PM reminder)
INSERT INTO attendance_settings (
    id,
    official_checkin_time,
    late_threshold_minutes,
    checkout_reminder_time,
    checkout_reminder_enabled,
    notify_employee_on_hr_adjustment
)
VALUES (
    1,
    '09:00:00',
    15,
    '19:00:00',
    true,
    true
)
ON CONFLICT (id) DO UPDATE SET
    official_checkin_time = EXCLUDED.official_checkin_time,
    late_threshold_minutes = EXCLUDED.late_threshold_minutes,
    checkout_reminder_time = EXCLUDED.checkout_reminder_time,
    checkout_reminder_enabled = EXCLUDED.checkout_reminder_enabled,
    notify_employee_on_hr_adjustment = EXCLUDED.notify_employee_on_hr_adjustment;

-- 2. Master Departments
INSERT INTO departments (id, name, code, is_active)
VALUES
    ('d1111111-1111-1111-1111-111111111111', 'Engineering', 'ENG', true),
    ('d2222222-2222-2222-2222-222222222222', 'Human Resources', 'HR', true),
    ('d3333333-3333-3333-3333-333333333333', 'Operations', 'OPS', true),
    ('d4444444-4444-4444-4444-444444444444', 'Sales & Marketing', 'SALES', true)
ON CONFLICT (name) DO NOTHING;

-- 3. Master Designations
INSERT INTO designations (id, title, is_active)
VALUES
    ('e1111111-1111-1111-1111-111111111111', 'Senior Software Engineer', true),
    ('e2222222-2222-2222-2222-222222222222', 'HR Manager', true),
    ('e3333333-3333-3333-3333-333333333333', 'Operations Lead', true),
    ('e4444444-4444-4444-4444-444444444444', 'Technical Architect', true),
    ('e5555555-5555-5555-5555-555555555555', 'System Administrator', true)
ON CONFLICT (title) DO NOTHING;

-- 4. Allow public read access to departments, designations, and attendance_settings
-- (So unauthenticated visitors and login screen can read master lists)
DO $$ BEGIN
    CREATE POLICY "Allow public read access to departments" ON departments FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to designations" ON designations FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to attendance_settings" ON attendance_settings FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
