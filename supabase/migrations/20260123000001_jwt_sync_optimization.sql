-- =========================================================================================
-- OPTIMIZATION: JWT SYNC & FAST RLS LOOKUP
-- =========================================================================================
-- Objective: 
-- 1. Sync public.users.organization_id -> auth.users.raw_app_meta_data.
-- 2. Update get_my_org_id() to read from JWT (Fast Path), avoiding DB lookups.
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- 1. TRIGGER FUNCTION: Sync Org ID to JWT
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_org_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if organization_id changed or is new
     IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.organization_id IS DISTINCT FROM NEW.organization_id) THEN
        
        -- Update auth.users metadata
        -- We use raw_app_meta_data for security traits (not user_metadata which user can edit)
        UPDATE auth.users
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object('organization_id', NEW.organization_id)
        WHERE id = NEW.id;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------------------
-- 2. APPLY TRIGGER
-- -----------------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_user_org_change ON public.users;

CREATE TRIGGER on_user_org_change
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_org_to_jwt();


-- -----------------------------------------------------------------------------------------
-- 3. OPTIMIZE get_my_org_id()
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
    jwt_claim jsonb;
BEGIN
    -- Fast Path: Check JWT 'app_metadata' -> 'organization_id'
    -- Note: auth.jwt() returns the current standard JWT claims
    jwt_claim := auth.jwt() -> 'app_metadata';
    
    IF jwt_claim IS NOT NULL AND jwt_claim ? 'organization_id' THEN
        org_id := (jwt_claim ->> 'organization_id')::UUID;
        RETURN org_id;
    END IF;
    
    -- Slow/Safe Path: Database Lookup
    -- (Used if token is not yet refreshed or for internal checks)
    SELECT organization_id INTO org_id
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------------------
-- 4. BACKFILL: Sync existing users
-- -----------------------------------------------------------------------------------------
-- We force an update on all users to trigger the sync (no data change, just touch)
-- This ensures everyone gets the metadata claim.
UPDATE public.users 
SET organization_id = organization_id 
WHERE organization_id IS NOT NULL;

COMMIT;
