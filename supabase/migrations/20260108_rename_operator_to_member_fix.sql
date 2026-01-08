-- =========================================================================================
-- FIX: FORCE VALID ROLES & APPLY CONSTRAINT
-- =========================================================================================

BEGIN;

-- 1. SANITIZE DATA: Force ANY invalid role to 'MEMBER'
-- This covers 'operador', 'operator', null, empty string, or any typo.
-- We explicity exclude the valid roles from the update.
UPDATE public.users 
SET role = 'MEMBER' 
WHERE role NOT IN ('ADMIN', 'MANAGER', 'MEMBER', 'CLIENT')
   OR role IS NULL;

-- 2. Clean up Constraint (Just in case)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Apply Strict Constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'CLIENT'));

-- 4. Ensure Default is set
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'MEMBER';

COMMIT;
