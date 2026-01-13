-- =========================================================================================
-- ENHANCEMENT: ADVANCED ADMIN PLAN MANAGEMENT
-- Allows Super-Admins to change plan, status AND custom quotas.
-- =========================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_org_plan(
    target_org_id UUID, 
    new_plan TEXT, 
    new_status TEXT,
    custom_max_users INT DEFAULT NULL,
    custom_max_boards INT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    final_users INT;
    final_boards INT;
BEGIN
    -- Security Check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Super Admin Only';
    END IF;

    -- Standard Quota Logic (if not provided)
    final_users := custom_max_users;
    final_boards := custom_max_boards;

    IF final_users IS NULL THEN
        final_users := CASE 
            WHEN new_plan = 'ENTERPRISE' THEN 999999 
            WHEN new_plan = 'PRO' THEN 100 -- Updated to 100 for legacy comfort
            WHEN new_plan = 'STARTER' THEN 10
            ELSE 5 -- FREE
        END;
    END IF;

    IF final_boards IS NULL THEN
        final_boards := CASE 
            WHEN new_plan = 'ENTERPRISE' THEN 999999 
            WHEN new_plan = 'PRO' THEN 50 -- Updated to 50 for legacy comfort
            WHEN new_plan = 'STARTER' THEN 10
            ELSE 3 -- FREE
        END;
    END IF;

    UPDATE public.organizations
    SET 
        plan_type = new_plan,
        subscription_status = new_status,
        max_users = final_users,
        max_boards = final_boards,
        updated_at = now()
    WHERE id = target_org_id;

    -- Audit Log (Optional but recommended)
    -- INSERT INTO public.audit_logs ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
