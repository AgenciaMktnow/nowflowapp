-- EMERGENCY: DISABLE RLS ON USERS TABLE
-- This restores access to all user profiles immediately.

-- 1. Disable RLS (Unlocks the table for read/write by authenticated users)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Cleanup (Optional but recommended): Remove the policy that caused recursion
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.users;
DROP POLICY IF EXISTS "Admins and Managers see everyone" ON public.users;

-- Note: Other tables (tasks, projects) still have RLS, protecting data between organizations.
-- This change specifically unblocks accessing Names and Avatars.
