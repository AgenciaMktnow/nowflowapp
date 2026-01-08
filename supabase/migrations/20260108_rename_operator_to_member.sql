-- =========================================================================================
-- MIGRATION: RENAME 'OPERADOR' TO 'MEMBER' & STANDARDIZE ROLES
-- =========================================================================================

BEGIN;

-- 1. Unify Data: Convert any 'OPERADOR' related variations to 'MEMBER'
-- We use ILIKE for case-insensitive matching just in case
UPDATE public.users 
SET role = 'MEMBER' 
WHERE role ILIKE 'operador' OR role ILIKE 'operator';

-- 2. Update Constraints: Ensure the Table ONLY accepts standard roles
-- First drop the old one if it exists (Supabase/Postgres usually names it users_role_check)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new strict constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'CLIENT'));

-- 3. Set Default Value
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'MEMBER';

COMMIT;
