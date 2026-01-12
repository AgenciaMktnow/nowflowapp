-- =========================================================================================
-- SAAS: QUOTA ENFORCEMENT ("THE LOCK")
-- Enforces max_users and max_boards limits defined in organizations table.
-- =========================================================================================

BEGIN;

-- 1. Function: Check User Quota
CREATE OR REPLACE FUNCTION public.check_org_user_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_max_users INT;
    v_current_count INT;
    v_org_id UUID;
    v_plan_type TEXT;
BEGIN
    v_org_id := NEW.organization_id;

    -- Skip if no org (shouldn't happen for normal users)
    IF v_org_id IS NULL THEN 
        RETURN NEW; 
    END IF;

    -- Get Limits
    SELECT max_users, plan_type INTO v_max_users, v_plan_type
    FROM public.organizations 
    WHERE id = v_org_id;

    -- Unlimited for Enterprise/Internal (Safety Net)
    IF v_plan_type = 'ENTERPRISE' OR v_max_users IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count existing users
    SELECT count(*) INTO v_current_count 
    FROM public.users 
    WHERE organization_id = v_org_id;

    -- Check Limit
    IF v_current_count >= v_max_users THEN
        RAISE EXCEPTION 'PLAN_LIMIT_REACHED: Max users (%) exceeded for this plan.', v_max_users;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: On User Creation
DROP TRIGGER IF EXISTS on_check_user_quota ON public.users;
CREATE TRIGGER on_check_user_quota
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_org_user_quota();


-- 3. Function: Check Board Quota
CREATE OR REPLACE FUNCTION public.check_org_board_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_max_boards INT;
    v_current_count INT;
    v_org_id UUID;
    v_plan_type TEXT;
    v_status TEXT;
BEGIN
    v_org_id := NEW.organization_id;

    -- Skip if no org
    IF v_org_id IS NULL THEN 
        RETURN NEW; 
    END IF;

    -- Get Limits & Status
    SELECT max_boards, plan_type, subscription_status 
    INTO v_max_boards, v_plan_type, v_status
    FROM public.organizations 
    WHERE id = v_org_id;

    -- Block Suspended Orgs completely
    IF v_status = 'suspended' THEN
        RAISE EXCEPTION 'ACCOUNT_SUSPENDED: Contact support.';
    END IF;

    -- Unlimited for Enterprise
    IF v_plan_type = 'ENTERPRISE' OR v_max_boards IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count existing boards
    SELECT count(*) INTO v_current_count 
    FROM public.boards 
    WHERE organization_id = v_org_id;

    -- Check Limit
    IF v_current_count >= v_max_boards THEN
        RAISE EXCEPTION 'PLAN_LIMIT_REACHED: Max boards (%) exceeded for this plan.', v_max_boards;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger: On Board Creation
DROP TRIGGER IF EXISTS on_check_board_quota ON public.boards;
CREATE TRIGGER on_check_board_quota
    BEFORE INSERT ON public.boards
    FOR EACH ROW
    EXECUTE FUNCTION public.check_org_board_quota();

COMMIT;
