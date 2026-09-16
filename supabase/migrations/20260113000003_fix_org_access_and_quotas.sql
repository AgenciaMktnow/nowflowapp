-- =========================================================================================
-- FIX: RECENT ACCESS ISSUES (RLS & QUOTAS)
-- 1. Fixes Organizations RLS so members can see their own plan.
-- 2. Grants legacy quotas to existing organizations to prevent lockouts.
-- =========================================================================================

BEGIN;

-- 1. Organizations RLS Policy
-- Allow members to read their own organization details (critical for UI plan detection)
DROP POLICY IF EXISTS "org_isolation_select_orgs" ON public.organizations;
CREATE POLICY "org_isolation_select_orgs" ON public.organizations 
FOR SELECT 
USING (id = get_auth_org_id());

-- 2. Legacy Quota Amnesty
-- Update all existing organizations that were caught by the 5-user/3-board default limits
UPDATE public.organizations
SET 
    max_users = 100,
    max_boards = 50,
    subscription_status = 'active'
WHERE plan_type = 'PRO' AND max_users < 100;

COMMIT;
