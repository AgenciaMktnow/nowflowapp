-- Fix RLS policies for users table to allow self-read
-- This fixes the 406 error preventing users from reading their own profile

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read all profiles" ON users;

-- Allow users to read their own profile (essential for auth and task creation)
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to read other users' profiles (needed for assignee dropdowns, team views, etc.)
CREATE POLICY "Users can read all profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
