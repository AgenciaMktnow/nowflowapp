-- =========================================================================================
-- FORMALIZE SUPER-ADMIN PROFILE
-- Adds a dedicated flag for Super Admins to the users table.
-- =========================================================================================

BEGIN;

-- 1. Add column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Grant initial access to main admin
UPDATE public.users 
SET is_super_admin = TRUE 
WHERE email = 'neto@mktnow.com.br';

-- 3. Update the recursive/helper function to check the flag
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND (
            is_super_admin = TRUE 
            OR email IN ('neto@mktnow.com.br', 'duqueneto@gmail.com', 'duqueneto@gmail.com.br')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
