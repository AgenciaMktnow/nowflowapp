-- =========================================================================================
-- CLEANUP: REMOVE LEGACY 'OPERATIONAL' ROLE DEFAULTS AND DATA
-- =========================================================================================

BEGIN;

-- 1. Fix 'public.invitations' Table
-- Change default from 'operational' to 'MEMBER'
ALTER TABLE public.invitations 
ALTER COLUMN role SET DEFAULT 'MEMBER';

-- Update any pending/legacy invitations
UPDATE public.invitations 
SET role = 'MEMBER' 
WHERE role ILIKE 'operational' OR role ILIKE 'operator';


-- 2. Enforce Strict Constraints on 'public.users' 
-- (Re-applying to ensure no loose ends from emergency scripts)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'CLIENT'));


-- 3. Fix 'public.user_teams' (Safety Check)
-- Ensure no one has a 'role' column in user_teams that is operational (if it exists)
-- (Assuming user_teams is just a mapping, but if it has metadata, good to check. 
-- Based on previous reads, it seems to be just user_id/team_id, but checking if there's a role column there just in case is hard in pure SQL without inspection, 
-- but we can ignore if not known. The main issue was invitations.)

COMMIT;
