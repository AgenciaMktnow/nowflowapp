-- Create RPC function to ensure user profile exists
-- Uses SECURITY DEFINER to bypass RLS restrictions

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.ensure_user_profile(uuid, text, text, text);

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
    user_id uuid,
    user_email text,
    user_full_name text DEFAULT NULL,
    user_role text DEFAULT 'MEMBER'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This is critical - runs with owner privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
    result_user json;
BEGIN
    -- Insert or update user profile
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        user_id,
        user_email,
        COALESCE(user_full_name, user_email),
        COALESCE(user_role, 'MEMBER')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        role = COALESCE(EXCLUDED.role, users.role);
    
    -- Return the user record
    SELECT row_to_json(u.*) INTO result_user
    FROM public.users u
    WHERE u.id = user_id;
    
    RETURN result_user;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid, text, text, text) TO authenticated;

-- Add INSERT policy with WITH CHECK for users table
DROP POLICY IF EXISTS "authenticated_users_insert" ON users;

CREATE POLICY "authenticated_users_insert"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Add UPDATE policy
DROP POLICY IF EXISTS "authenticated_users_update" ON users;

CREATE POLICY "authenticated_users_update"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policies
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
