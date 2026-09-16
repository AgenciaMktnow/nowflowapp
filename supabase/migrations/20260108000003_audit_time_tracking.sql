-- =========================================================================================
-- FIX: AUDIT TIME TRACKING (Data Preservation & Security)
-- 1. Preserve Logs: ON DELETE SET NULL for task_id (Orphans allowed).
-- 2. Security: Strict RLS for time_logs (Admin/Manager vs Member).
-- =========================================================================================

-- 1. MODIFY CONSTRAINT (PRESERVE HISTORY)
DO $$
BEGIN
    -- Drop existing foreign key (name might vary, trying standard first)
    ALTER TABLE public.time_logs DROP CONSTRAINT IF EXISTS time_logs_task_id_fkey;

    -- Add new constraint with SET NULL
    ALTER TABLE public.time_logs
    ADD CONSTRAINT time_logs_task_id_fkey
    FOREIGN KEY (task_id)
    REFERENCES public.tasks(id)
    ON DELETE SET NULL;
END $$;


-- 2. UPDATE RLS POLICIES
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Drop loose policies to ensure clean slate
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.time_logs;
DROP POLICY IF EXISTS "Admins see all logs" ON public.time_logs;
DROP POLICY IF EXISTS "View own logs" ON public.time_logs;
DROP POLICY IF EXISTS "Manage own logs" ON public.time_logs;

-- Policy A: ADMIN/MANAGER can VIEW ALL
CREATE POLICY "Admins/Managers view all time logs"
ON public.time_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER')
    )
);

-- Policy B: MEMBERS can VIEW OWN logs
CREATE POLICY "Members view own time logs"
ON public.time_logs
FOR SELECT
USING (
    user_id = auth.uid()
);

-- Policy C: MEMBERS can INSERT/UPDATE OWN logs
CREATE POLICY "Users manage own time logs"
ON public.time_logs
FOR ALL
USING (
    user_id = auth.uid()
);

-- Note: Admins might need to edit others' logs? 
-- If so, we'd add an update policy for Admins. 
-- For now, "Audit" usually implies immutable or self-managed.
-- Let's allow Admins to manage all just in case of corrections.
CREATE POLICY "Admins/Managers manage all time logs"
ON public.time_logs
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER')
    )
);

CREATE POLICY "Admins/Managers delete all time logs"
ON public.time_logs
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER')
    )
);
