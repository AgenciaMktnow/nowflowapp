-- FIX RLS: Allow Admins/Managers to View All Profiles
-- This ensures the frontend doesn't get 'null' users in joins due to hidden rows.

-- 1. Drop existing overly restrictive policy if it exists (safely)
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;

-- 2. Create correct policy: users can view other users in the SAME organization
CREATE POLICY "Users can view members of their organization"
ON public.users
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE organization_id = public.users.organization_id
  )
);
 
-- 3. Explicit Admin/Manager Override (Redundant but safe)
CREATE POLICY "Admins and Managers see everyone"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND (u.role = 'ADMIN' OR u.role = 'MANAGER')
  )
);
