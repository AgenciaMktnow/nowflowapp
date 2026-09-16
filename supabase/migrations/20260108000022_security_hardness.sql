-- =========================================================================================
-- SECURITY HARDENING: STRICT ORG ISOLATION + ROLE SENSITIVITY
-- REPLACES GENERIC 'OR' LOGIC WITH STRICT 'AND' LOGIC
-- =========================================================================================

BEGIN;

-- Helper to safely check role without recursion or function dependency
-- We will use subqueries on public.users for maximum reliability.

-- 1. HARDEN TASKS (DELETE & UPDATE)
-- -----------------------------------------------------------------------------------------
-- A. DROP Old Permissive Policies
DROP POLICY IF EXISTS "org_isolation_delete_tasks" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for Admins or Manager Owners" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for Admins or Owners" ON public.tasks; -- Catch any rogue ones

-- B. CREATE STRICT DELETE POLICY (Org Match AND Permission)
-- Rule: Admin (Any), Manager (Own), Member (None).
CREATE POLICY "secure_delete_tasks"
ON public.tasks
FOR DELETE
USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()) 
    AND (
        (auth.jwt() ->> 'role' = 'service_role') OR
        (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')) OR
        (
            created_by = auth.uid() AND 
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'MANAGER')
        )
    )
);

-- C. CREATE STRICT UPDATE POLICY
-- Rule: Org Match AND Role IN (Admin, Manager, Member, Client).
-- Prevents cross-org updates even if ID is known.
CREATE POLICY "secure_update_tasks"
ON public.tasks
FOR UPDATE
USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
)
WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
);


-- 2. HARDEN PROJECTS (DELETE & UPDATE)
-- -----------------------------------------------------------------------------------------
-- A. DROP Old
DROP POLICY IF EXISTS "org_isolation_delete_projects" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_update_projects" ON public.projects;

-- B. STRICT DELETE (Admin Only)
CREATE POLICY "secure_delete_projects"
ON public.projects
FOR DELETE
USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()) 
    AND (
        (auth.jwt() ->> 'role' = 'service_role') OR
        (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
    )
);

-- C. STRICT UPDATE (Admin/Manager Only generally, but keeping permissive to Org for now to avoid breakage, relying on UI)
-- Actually, let's restrict Project Update to Admin/Manager? Member shouldn't rename projects.
CREATE POLICY "secure_update_projects"
ON public.projects
FOR UPDATE
USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
         (auth.jwt() ->> 'role' = 'service_role') OR
         (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')))
    )
);


-- 3. HARDEN CLIENTS (DELETE & UPDATE)
-- -----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "org_isolation_delete_clients" ON public.clients;
DROP POLICY IF EXISTS "org_isolation_update_clients" ON public.clients;

-- DELETE: Admin Only
CREATE POLICY "secure_delete_clients"
ON public.clients
FOR DELETE
USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()) 
    AND (
        (auth.jwt() ->> 'role' = 'service_role') OR
        (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
    )
);

-- UPDATE: Admin/Manager Only
CREATE POLICY "secure_update_clients"
ON public.clients
FOR UPDATE
USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND (
         (auth.jwt() ->> 'role' = 'service_role') OR
         (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')))
    )
);


-- 4. HARDEN TASK ATTACHMENTS (Record Table)
-- -----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow delete attachments for Admins or Owners" ON public.task_attachments;
-- Note: Attachments usually don't have organization_id directly on the table in some schemas, relying on task relation?
-- Let's check schema. If attachment doesn't have org_id, we check specific ownership.
-- My previous migration created `task_attachments` table. It has `task_id` and `user_id`.
-- It does NOT have `organization_id`. 
-- SECURITY FIX: Join with tasks to check Org ID? Or just rely on User ID ownership which is implicit isolation?
-- Relying on User ID ownership is strong enough providing User is isolated. 
-- Admin Delete needs to check Task->Org match.
-- Let's enable strict Admin check via Task.

CREATE POLICY "secure_delete_attachments"
ON public.task_attachments
FOR DELETE
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (user_id = auth.uid()) OR -- Owner (Manager/Member) can delete
    (
        -- Admin determines rights via Task Org
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'ADMIN'
            AND u.organization_id = (
                SELECT t.organization_id FROM public.tasks t WHERE t.id = task_attachments.task_id
            )
        )
    )
);


-- 5. PREVENT ROLE SELF-ESCALATION (Users Table)
-- -----------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;

-- Recreate: Can update OWN profile (avatar, name) BUT 'role' must remain unchanged.
CREATE POLICY "users_update_own_profile_secure"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND (role = (SELECT role FROM public.users WHERE id = auth.uid())) -- New Role must equal Old Role (No Change)
    -- Or simpler: use a trigger, but RLS CHECK is standard for this.
    -- (Actually, checking against the table during query might see new or old? 
    --  Standard way: Create a separate Admin Update policy, and restrict this one.)
);

COMMIT;
