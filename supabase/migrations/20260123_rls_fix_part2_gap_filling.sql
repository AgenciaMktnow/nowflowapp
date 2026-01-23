-- =========================================================================================
-- URGENT RLS REPAIR - PART 2: GAP FILLING (Workflows, Teams, Comments)
-- =========================================================================================
-- Objective: Secure remaining tables identified in Audit.
-- Tables: teams, workflows, task_comments, board_columns.
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- 1. TEAMS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teams Isolation" ON public.teams;
DROP POLICY IF EXISTS "org_isolation_teams" ON public.teams;

CREATE POLICY "Teams Isolation" ON public.teams
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 2. WORKFLOWS (Strict Isolation)
-- -----------------------------------------------------------------------------------------
-- First: Ensure organization_id exists (Idempotent ADD COLUMN)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflows' AND column_name = 'organization_id') THEN
        ALTER TABLE public.workflows ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workflows Isolation" ON public.workflows;
DROP POLICY IF EXISTS "org_isolation_workflows" ON public.workflows;

CREATE POLICY "Workflows Isolation" ON public.workflows
FOR ALL
USING (organization_id = public.get_my_org_id())
WITH CHECK (organization_id = public.get_my_org_id());


-- -----------------------------------------------------------------------------------------
-- 3. TASK COMMENTS (Task Dependent - Recursion Safe)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments Isolation" ON public.task_comments;
DROP POLICY IF EXISTS "org_isolation_comments" ON public.task_comments;
DROP POLICY IF EXISTS "Authenticated users can read comments" ON public.task_comments;

CREATE POLICY "Comments Isolation" ON public.task_comments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_comments.task_id
        AND tasks.organization_id = public.get_my_org_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_comments.task_id
        AND tasks.organization_id = public.get_my_org_id()
    )
);


-- -----------------------------------------------------------------------------------------
-- 4. BOARD COLUMNS (Board Dependent)
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board Columns Isolation" ON public.board_columns;
DROP POLICY IF EXISTS "org_isolation_board_columns" ON public.board_columns;

CREATE POLICY "Board Columns Isolation" ON public.board_columns
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = board_columns.board_id
        AND boards.organization_id = public.get_my_org_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boards
        WHERE boards.id = board_columns.board_id
        AND boards.organization_id = public.get_my_org_id()
    )
);

COMMIT;
