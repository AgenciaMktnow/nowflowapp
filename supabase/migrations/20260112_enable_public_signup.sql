-- =========================================================================================
-- ENABLE PUBLIC SIGNUP & AUTO-ORG CREATION
-- Modifies triggers to allow 'is_owner' users to bypass whitelist and create organizations.
-- =========================================================================================

BEGIN;

-- 1. Modify Whitelist Trigger (Allow 'is_owner' bypass)
CREATE OR REPLACE FUNCTION public.check_whitelist_before_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow if user identifies as an Owner (New Signup)
    IF (NEW.raw_user_meta_data->>'is_owner')::boolean IS TRUE THEN
        RETURN NEW;
    END IF;

    -- Otherwise, enforce Invitation check
    IF NOT EXISTS (SELECT 1 FROM public.invitations WHERE email = NEW.email) THEN
        RAISE EXCEPTION 'Cadastro restrito a convidados.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Modify Handle New User (Create Org logic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
    final_role TEXT;
    final_org_id UUID;
    new_company_name TEXT;
    is_owner BOOLEAN;
BEGIN
    -- Check if it is a New Owner Signup
    is_owner := (NEW.raw_user_meta_data->>'is_owner')::boolean;
    new_company_name := NEW.raw_user_meta_data->>'company_name';

    IF is_owner IS TRUE AND new_company_name IS NOT NULL THEN
        -- A. Create New Organization
        INSERT INTO public.organizations (
            name, 
            plan_type, 
            subscription_status,
            max_users, 
            max_boards
        )
        VALUES (
            new_company_name, 
            'PRO', 
            'trialing',
            5, -- Default Trial Limit
            3  -- Default Trial Limit
        )
        RETURNING id INTO final_org_id;

        -- B. Set Role as Admin
        final_role := 'ADMIN';

        -- C. Log logic (Optional)
        RAISE NOTICE 'New Organization Created: % (ID: %)', new_company_name, final_org_id;

    ELSE
        -- D. Standard Invite Flow
        SELECT * INTO invite_record FROM public.invitations WHERE email = NEW.email;

        IF invite_record IS NULL THEN
             RAISE EXCEPTION 'User has no invitation and is not an owner.';
        END IF;

        final_role := invite_record.role;
        final_org_id := invite_record.organization_id;

        -- Mark invite as accepted
        UPDATE public.invitations SET accepted_at = now() WHERE id = invite_record.id;
    END IF;

    -- E. Create User Profile
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        avatar_url, 
        role, 
        organization_id
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        final_role,
        final_org_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = excluded.email,
        role = excluded.role,
        organization_id = excluded.organization_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
