-- =========================================================================================
-- FEATURE: SYNC LAST SEEN (Auth -> Public)
-- =========================================================================================

BEGIN;

-- 1. Add Column to Public Profile
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- 2. Create Sync Function
CREATE OR REPLACE FUNCTION public.sync_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the timestamp actually changed
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
        UPDATE public.users
        SET last_sign_in_at = NEW.last_sign_in_at
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger on Auth.Users
DROP TRIGGER IF EXISTS tr_sync_last_seen ON auth.users;
CREATE TRIGGER tr_sync_last_seen
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_last_seen();

-- 4. Backfill Data (One-time sync for existing users)
UPDATE public.users u
SET last_sign_in_at = au.last_sign_in_at
FROM auth.users au
WHERE u.id = au.id;

COMMIT;
