-- Auto-sync auth.users to public.users
-- This ensures every authenticated user has a profile in public.users

-- Create or replace the sync function
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user profile in public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'MEMBER'),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_sync();

-- Backfill: Sync all existing auth users to public.users
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    avatar_url,
    created_at,
    updated_at
)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    COALESCE(raw_user_meta_data->>'role', 'MEMBER') as role,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    created_at,
    updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Verify sync worked
SELECT 
    'Auth Users' as source,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Public Users' as source,
    COUNT(*) as count
FROM public.users;
