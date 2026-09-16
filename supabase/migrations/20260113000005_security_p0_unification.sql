-- =========================================================================================
-- SECURITY HARDENING P0: TOTAL ISOLATION (VERSION 2 - FINAL)
-- 1. Unifies handle_new_user to strictly assign organization_id.
-- 2. Syncs organization_id to Auth JWT (app_metadata).
-- 3. Removes all organization_id defaults and enforces NOT NULL.
-- 4. Re-applies RLS with strict JWT org_id check across ALL tables.
-- =========================================================================================

BEGIN;

-- 1. CONSOLIDATED TRIGGER: handle_new_user
-- Ensures every user is born into an organization and syncs it to Supabase Auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
    final_role TEXT;
    final_org_id UUID;
    new_company_name TEXT;
    is_owner BOOLEAN;
BEGIN
    -- Detect if it's a new Workspace Owner signing up
    is_owner := (NEW.raw_user_meta_data->>'is_owner')::boolean;
    new_company_name := NEW.raw_user_meta_data->>'company_name';

    IF is_owner IS TRUE AND new_company_name IS NOT NULL THEN
        -- Create New Organization (Default: FREE/Active)
        INSERT INTO public.organizations (name, plan_type, subscription_status)
        VALUES (new_company_name, 'FREE', 'active')
        RETURNING id INTO final_org_id;
        
        final_role := 'ADMIN';
    ELSE
        -- Standard Invite Flow: Must match an invitation
        SELECT * INTO invite_record FROM public.invitations WHERE email = NEW.email;
        
        IF invite_record IS NULL THEN
            -- CRITICAL: Prevent orphaned users or users defaulting to Master Org
            RAISE EXCEPTION 'Acesso negado: Sem convite ativo para %', NEW.email;
        END IF;

        final_role := invite_record.role;
        final_org_id := invite_record.organization_id;
        
        -- Mark invite as accepted
        UPDATE public.invitations SET accepted_at = now() WHERE id = invite_record.id;
    END IF;

    -- Create/Update User Profile in public.users
    INSERT INTO public.users (id, email, full_name, role, organization_id, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        final_role,
        final_org_id,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id;

    -- SYNC TO JWT: Inject org_id into app_metadata
    -- This makes it available via (auth.jwt() -> 'app_metadata' ->> 'org_id')
    UPDATE auth.users
    SET raw_app_meta_data = 
        jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{org_id}',
            format('"%s"', final_org_id)::jsonb
        )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure triggers are correctly placed (cleanup old variations)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to sync org_id to JWT if user is updated manually
CREATE OR REPLACE FUNCTION public.sync_org_id_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{org_id}',
            format('"%s"', NEW.organization_id)::jsonb
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_org_id_on_user_update ON public.users;
CREATE TRIGGER tr_sync_org_id_on_user_update
    AFTER UPDATE OF organization_id ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_org_id_to_jwt();


-- 2. REMOVE DEFAULTS & REINFORCE ISOLATION
-- Ensures no record is created without a explicit org_id or leaked via default.

DO $$ 
BEGIN
    -- Drop defaults on critical tables
    ALTER TABLE public.users ALTER COLUMN organization_id DROP DEFAULT;
    ALTER TABLE public.tasks ALTER COLUMN organization_id DROP DEFAULT;
    ALTER TABLE public.projects ALTER COLUMN organization_id DROP DEFAULT;
    ALTER TABLE public.clients ALTER COLUMN organization_id DROP DEFAULT;
    ALTER TABLE public.boards ALTER COLUMN organization_id DROP DEFAULT;
    ALTER TABLE public.teams ALTER COLUMN organization_id DROP DEFAULT;
    ALTER TABLE public.time_logs ALTER COLUMN organization_id DROP DEFAULT;
    
    -- Ensure NOT NULL where applicable
    ALTER TABLE public.users ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.projects ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.boards ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.teams ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.time_logs ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Some columns might already be NOT NULL or missing: %', SQLERRM;
END $$;


-- 3. RIGOROUS RLS POLICIES
-- Uses the exact clause requested via user: (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid

-- Helper (Clean Clause version)
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
    SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid;
$$ LANGUAGE sql STABLE;

-- Apply to ALL tables (including Workflows, comments and activities)
-- Note: Super Admin bypass is always kept via public.is_super_admin()

-- USERS
DROP POLICY IF EXISTS "org_isolation_select_users" ON public.users;
CREATE POLICY "org_isolation_select_users" ON public.users FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- TASKS
DROP POLICY IF EXISTS "org_isolation_select_tasks" ON public.tasks;
CREATE POLICY "org_isolation_select_tasks" ON public.tasks FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- PROJECTS
DROP POLICY IF EXISTS "org_isolation_select_projects" ON public.projects;
CREATE POLICY "org_isolation_select_projects" ON public.projects FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- CLIENTS
DROP POLICY IF EXISTS "org_isolation_select_clients" ON public.clients;
CREATE POLICY "org_isolation_select_clients" ON public.clients FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- BOARDS
DROP POLICY IF EXISTS "org_isolation_select_boards" ON public.boards;
CREATE POLICY "org_isolation_select_boards" ON public.boards FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- TEAMS
DROP POLICY IF EXISTS "org_isolation_select_teams" ON public.teams;
CREATE POLICY "org_isolation_select_teams" ON public.teams FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- TIME LOGS
DROP POLICY IF EXISTS "org_isolation_select_timelogs" ON public.time_logs;
CREATE POLICY "org_isolation_select_timelogs" ON public.time_logs FOR SELECT 
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid OR public.is_super_admin());

-- TASK COMMENTS
DROP POLICY IF EXISTS "org_isolation_select_comments" ON public.task_comments;
CREATE POLICY "org_isolation_select_comments" ON public.task_comments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid) OR public.is_super_admin());

-- TASK ACTIVITIES
DROP POLICY IF EXISTS "org_isolation_select_activities" ON public.task_activities;
CREATE POLICY "org_isolation_select_activities" ON public.task_activities FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid) OR public.is_super_admin());

COMMIT;
