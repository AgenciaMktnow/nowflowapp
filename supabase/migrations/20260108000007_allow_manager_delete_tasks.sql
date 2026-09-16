-- =========================================================================================
-- UPDATE: ALLOW MANAGER TO DELETE *ONLY OWN* TASKS (FIXED)
-- Replaced 'get_my_claim' with standard role lookup
-- =========================================================================================

BEGIN;

-- 1. UPDATE RLS FOR 'tasks' TABLE
DROP POLICY IF EXISTS "Allow delete for Admins and Managers" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for Admins or Owners" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for Admins or Manager Owners" ON public.tasks;

-- Policy: Admin can delete ANY. Manager/Member can delete ONLY OWN tasks.
CREATE POLICY "Allow delete for Admins or Manager Owners"
ON public.tasks
FOR DELETE
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'ADMIN'
    )) OR
    (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('MANAGER','MEMBER')
        )
    )
);


-- 2. UPDATE RLS FOR 'task_attachments' TABLE
DROP POLICY IF EXISTS "Allow delete attachments for Admins, Managers and Owner" ON public.task_attachments;
DROP POLICY IF EXISTS "Allow delete attachments for Admins or Owners" ON public.task_attachments;

CREATE POLICY "Allow delete attachments for Admins or Owners"
ON public.task_attachments
FOR DELETE
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'ADMIN'
    )) OR
    (user_id = auth.uid()) -- Owner can delete (Manager/Member)
);


-- 3. STORAGE POLICY
DROP POLICY IF EXISTS "Allow Admins/Managers to delete any attachment" ON storage.objects;
DROP POLICY IF EXISTS "Allow Admins or Owners to delete files" ON storage.objects;

CREATE POLICY "Allow Admins or Owners to delete files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'task-attachments' AND
    (
        (auth.jwt() ->> 'role' = 'service_role') OR
        (EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )) OR
        (owner = auth.uid())
    )
);

COMMIT;
