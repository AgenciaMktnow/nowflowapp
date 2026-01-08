-- =========================================================================================
-- SECURITY: PREVENT ROLE ESCALATION & ADMIN LOCKOUT
-- =========================================================================================

BEGIN;

-- 1. Function: Prevent Unauthorized Role Changes
CREATE OR REPLACE FUNCTION public.check_role_change_permission()
RETURNS TRIGGER AS $$
DECLARE
    auth_user_role TEXT;
    admin_count INTEGER;
BEGIN
    -- Skip check if role is not changing
    IF NEW.role = OLD.role THEN
        RETURN NEW;
    END IF;

    -- Get the role of the user performing the action (the "executor")
    -- Note: auth.uid() returns the ID of the logged-in user making the request
    -- We need to check THEIR role in the users table.
    SELECT role INTO auth_user_role FROM public.users WHERE id = auth.uid();

    -- Rule A: Only ADMINs can change roles.
    IF auth_user_role IS NULL OR auth_user_role != 'ADMIN' THEN
         RAISE EXCEPTION 'Access Denied: Only Administrators can change user roles.';
    END IF;

    -- Rule B: Anti-Lockout (Prevent removing the last ADMIN)
    -- If the user being modified (OLD) was an ADMIN, and they are becoming something else (NEW != ADMIN)
    IF OLD.role = 'ADMIN' AND NEW.role != 'ADMIN' THEN
        SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'ADMIN';
        -- If count is 1 (this user) or less (shouldn't happen), block it.
        -- Note: The count includes the current user because the transaction hasn't committed yet? 
        -- Actually, in a BEFORE trigger, the row is still there. So count will be X.
        -- We need to ensure X > 1.
        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Operation Failed: Cannot demote the last Administrator of the system.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Attach to Users Table (BEFORE UPDATE)
DROP TRIGGER IF EXISTS tr_protect_user_roles ON public.users;
CREATE TRIGGER tr_protect_user_roles
    BEFORE UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_role_change_permission();


-- 3. Function: Prevent Deleting the Last Admin
CREATE OR REPLACE FUNCTION public.check_last_admin_delete()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    IF OLD.role = 'ADMIN' THEN
        SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'ADMIN';
        IF admin_count <= 1 THEN
             RAISE EXCEPTION 'Operation Failed: Cannot delete the last Administrator of the system.';
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: Attach to Users Table (BEFORE DELETE)
DROP TRIGGER IF EXISTS tr_protect_last_admin_delete ON public.users;
CREATE TRIGGER tr_protect_last_admin_delete
    BEFORE DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_last_admin_delete();

COMMIT;
