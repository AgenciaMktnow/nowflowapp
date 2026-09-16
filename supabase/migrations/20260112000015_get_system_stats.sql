-- =========================================================================================
-- SYSTEM STATS RPC
-- Returns high-level infrastructure metrics (DB Size, Storage Size)
-- =========================================================================================

-- 1. Get System Stats
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE (
    db_size_bytes BIGINT,
    storage_size_bytes BIGINT
) AS $$
DECLARE
    v_db_size BIGINT;
    v_storage_size BIGINT;
BEGIN
    -- Security Check (Super Admin Only)
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Super Admin Only';
    END IF;

    -- Get Database Size
    SELECT pg_database_size(current_database()) INTO v_db_size;

    -- Get Storage Size (Sum of all objects in all buckets)
    -- Note: This requires access to storage.objects. If RLS blocks it, we might need a SECURITY DEFINER view or logic.
    -- Since this function is SECURITY DEFINER, it bypasses RLS if the user has table access, 
    -- but storage schema is distinct. We'll try direct access.
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    INTO v_storage_size
    FROM storage.objects;

    RETURN QUERY SELECT v_db_size, v_storage_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
