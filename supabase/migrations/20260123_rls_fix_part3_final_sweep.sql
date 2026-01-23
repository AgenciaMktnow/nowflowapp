-- =========================================================================================
-- URGENT RLS REPAIR - PART 3: FINAL SWEEP (Missing Tables)
-- =========================================================================================
-- Objective: Secure tables identified in "Forgot to Re-enable" audit.
-- Tables: time_logs, invitations, task_boards.
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- 1. TIME LOGS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
-- time_logs usually has organization_id. If not, we add it or join via tasks/users.
-- Checking schema: usually linked to organization_id directly in NowFlow.
-- We will enforce organization_id check.

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Time Logs Isolation" ON public.time_logs;
DROP POLICY IF EXISTS "org_isolation_time_logs" ON public.time_logs;

CREATE POLICY "Time Logs Isolation" ON public.time_logs
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 2. INVITATIONS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invitations Isolation" ON public.invitations;
DROP POLICY IF EXISTS "org_isolation_invitations" ON public.invitations;

CREATE POLICY "Invitations Isolation" ON public.invitations
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 3. TASK BOARDS (Join Table Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.task_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Task Boards Isolation" ON public.task_boards;
DROP POLICY IF EXISTS "org_isolation_task_boards" ON public.task_boards;

-- Check via Board (Organization Parent)
CREATE POLICY "Task Boards Isolation" ON public.task_boards
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = task_boards.board_id
        AND boards.organization_id = public.get_my_org_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = task_boards.board_id
        AND boards.organization_id = public.get_my_org_id()
    )
);

-- -----------------------------------------------------------------------------------------
-- 4. ORGANIZATION (Self View Only)
-- -----------------------------------------------------------------------------------------
-- Just in case. Users should only see their own org.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization Isolation" ON public.organizations;

CREATE POLICY "Organization Isolation" ON public.organizations
FOR SELECT
USING (id = public.get_my_org_id());


COMMIT;
