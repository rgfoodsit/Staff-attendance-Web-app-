-- ==============================================================================
-- Staff Attendance Web Application - Supabase PostgreSQL Schema (V1)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('employee', 'hr', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM (
        'present',
        'late',
        'half_day_attendance',
        'half_day_leave',
        'leave',
        'absent',
        'checked_in',
        'checked_out',
        'checkout_pending'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_half_type AS ENUM ('first_half', 'second_half');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE correction_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE correction_type AS ENUM ('checkin_time', 'checkout_time', 'status', 'forgotten_checkout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Departments Master (Admin-only managed)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Designations Master (Admin-only managed)
CREATE TABLE IF NOT EXISTS designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Employee Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id),
    designation_id UUID NOT NULL REFERENCES designations(id),
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. HR Attendance Settings (Singleton record id=1)
CREATE TABLE IF NOT EXISTS attendance_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    official_checkin_time TIME NOT NULL DEFAULT '09:00:00',
    late_threshold_minutes INTEGER NOT NULL DEFAULT 15,
    checkout_reminder_time TIME NOT NULL DEFAULT '19:00:00',
    checkout_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    notify_employee_on_hr_adjustment BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Daily Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    
    -- Status & Flags
    status attendance_status NOT NULL DEFAULT 'checked_in',
    is_late BOOLEAN NOT NULL DEFAULT false,
    is_hr_adjusted BOOLEAN NOT NULL DEFAULT false,
    hr_adjustment_reason TEXT,
    adjusted_by UUID REFERENCES profiles(id),
    adjusted_at TIMESTAMPTZ,

    -- Working Duration in minutes
    working_duration_minutes INTEGER,

    -- Check-in Evidence (Immutable evidence captured via camera & GPS)
    checkin_time TIMESTAMPTZ,
    effective_checkin_time TIMESTAMPTZ,
    checkin_selfie_url TEXT,
    checkin_latitude NUMERIC(10, 7),
    checkin_longitude NUMERIC(10, 7),
    checkin_location_name TEXT,

    -- Check-out Evidence (Immutable evidence captured via camera & GPS)
    checkout_time TIMESTAMPTZ,
    effective_checkout_time TIMESTAMPTZ,
    checkout_selfie_url TEXT,
    checkout_latitude NUMERIC(10, 7),
    checkout_longitude NUMERIC(10, 7),
    checkout_location_name TEXT,

    -- Leave attributes if marked directly
    leave_type leave_half_type,
    leave_reason TEXT,
    leave_comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_employee_date UNIQUE(profile_id, attendance_date)
);

-- 7. Attendance Correction Requests
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    correction_type correction_type NOT NULL,
    
    -- Original Values Snapshot
    original_checkin_time TIMESTAMPTZ,
    original_checkout_time TIMESTAMPTZ,
    original_status attendance_status,

    -- Requested Values
    requested_checkin_time TIMESTAMPTZ,
    requested_checkout_time TIMESTAMPTZ,
    requested_status attendance_status,
    reason TEXT NOT NULL,

    -- Decision Workflow
    status correction_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_remarks TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Daily Work Reports (Optional, current calendar day editable)
CREATE TABLE IF NOT EXISTS daily_work_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_employee_work_report UNIQUE(profile_id, report_date)
);

-- 9. In-App Notifications
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Comprehensive System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES profiles(id),
    previous_state JSONB,
    new_state JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read active profiles; HR and Admin can update
CREATE POLICY "Profiles viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles editable by HR and Admin" 
ON profiles FOR ALL TO authenticated 
USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'admin'))
);

-- Attendance: Employee sees own; HR/Admin sees all
CREATE POLICY "Attendance viewable by owner and HR/Admin" 
ON attendance_records FOR SELECT TO authenticated 
USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'admin'))
);

CREATE POLICY "Attendance insertable by owner" 
ON attendance_records FOR INSERT TO authenticated 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Attendance updatable by HR or owner" 
ON attendance_records FOR UPDATE TO authenticated 
USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'hr')
);

-- Daily Work Reports: Owner can insert/update during day; HR/Admin can read all
CREATE POLICY "Work reports viewable by HR/Admin or owner"
ON daily_work_reports FOR SELECT TO authenticated
USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'admin'))
);

CREATE POLICY "Work reports editable by owner only"
ON daily_work_reports FOR ALL TO authenticated
USING (profile_id = auth.uid());

-- Seed Singleton Settings
INSERT INTO attendance_settings (id, official_checkin_time, late_threshold_minutes, checkout_reminder_time, checkout_reminder_enabled, notify_employee_on_hr_adjustment)
VALUES (1, '09:00:00', 15, '19:00:00', true, true)
ON CONFLICT (id) DO NOTHING;
