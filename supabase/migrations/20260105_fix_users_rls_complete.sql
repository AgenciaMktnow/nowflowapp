-- Complete fix for users table RLS policies
-- This resolves the 406 error preventing users from reading their own profile

-- First, disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for users table

-- 1. Allow authenticated users to read ALL user profiles
-- (Required for: assignee dropdowns, team views, user lists, etc.)
CREATE POLICY "authenticated_users_select_all"
ON users
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow users to update their own profile
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Allow service role to do everything (for admin operations)
CREATE POLICY "service_role_all"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
