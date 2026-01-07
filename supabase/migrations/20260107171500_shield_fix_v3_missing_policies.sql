-- =========================================================================================
-- SHIELD FIX V3: MISSING POLICIES (TIME_LOGS & TEAMS)
-- =========================================================================================
-- Problem: 'time_logs' and 'teams' have RLS enabled but NO policies, resulting in "Deny All".
-- Symptom: Frontend receives 406 Not Acceptable (empty result on .single()) for timers.
-- Solution: Add the standard Organization Isolation policies to these tables.

BEGIN;

-- 1. TIME_LOGS POLICIES
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_select_time_logs" ON public.time_logs;
CREATE POLICY "org_isolation_select_time_logs" ON public.time_logs FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_insert_time_logs" ON public.time_logs;
CREATE POLICY "org_isolation_insert_time_logs" ON public.time_logs FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_update_time_logs" ON public.time_logs;
CREATE POLICY "org_isolation_update_time_logs" ON public.time_logs FOR UPDATE USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_delete_time_logs" ON public.time_logs;
CREATE POLICY "org_isolation_delete_time_logs" ON public.time_logs FOR DELETE USING (organization_id = get_auth_org_id());


-- 2. TEAMS POLICIES
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_isolation_select_teams" ON public.teams;
CREATE POLICY "org_isolation_select_teams" ON public.teams FOR SELECT USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_insert_teams" ON public.teams;
CREATE POLICY "org_isolation_insert_teams" ON public.teams FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_update_teams" ON public.teams;
CREATE POLICY "org_isolation_update_teams" ON public.teams FOR UPDATE USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "org_isolation_delete_teams" ON public.teams;
CREATE POLICY "org_isolation_delete_teams" ON public.teams FOR DELETE USING (organization_id = get_auth_org_id());

COMMIT;
