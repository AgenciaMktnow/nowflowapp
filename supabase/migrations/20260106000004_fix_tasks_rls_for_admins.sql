-- Add RLS Policy for Admins to View and Manage All Tasks
DO $$
BEGIN
    -- 1. Admins can view ALL tasks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'policy_admins_view_all_tasks'
    ) THEN
        CREATE POLICY "policy_admins_view_all_tasks"
        ON public.tasks
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role = 'ADMIN'
            )
        );
    END IF;

    -- 2. Admins can update ALL tasks (useful for general management)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'policy_admins_update_all_tasks'
    ) THEN
        CREATE POLICY "policy_admins_update_all_tasks"
        ON public.tasks
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role = 'ADMIN'
            )
        );
    END IF;

     -- 3. Admins can delete ALL tasks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'policy_admins_delete_all_tasks'
    ) THEN
        CREATE POLICY "policy_admins_delete_all_tasks"
        ON public.tasks
        FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role = 'ADMIN'
            )
        );
    END IF;

END
$$;
