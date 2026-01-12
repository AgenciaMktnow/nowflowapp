-- =========================================================================================
-- BROADCAST SYSTEM
-- Table and Realtime setup for global system announcements
-- =========================================================================================

BEGIN;

-- 1. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    target_audience TEXT DEFAULT 'all', -- future proofing: 'admins', 'all', 'org_id'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '1 hour') -- Default expire
);

-- 2. Enable RLS
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Everyone can read active announcements
CREATE POLICY "Everyone can read active announcements" ON public.system_announcements
    FOR SELECT
    USING (is_active = true);

-- Only Super Admins can insert/update/delete
CREATE POLICY "Super Admins can manage announcements" ON public.system_announcements
    FOR ALL
    USING (public.is_super_admin());

-- 4. Enable Realtime
-- This ensures that 'supabase_realtime' publication includes this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_announcements;

COMMIT;
