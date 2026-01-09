-- Add needs_password_change column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

-- Update ensure_user_profile function to handle the new flag
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT,
    user_role TEXT,
    user_needs_password_change BOOLEAN DEFAULT FALSE -- New parameter
)
RETURNS JSONB AS $$
DECLARE
    new_profile public.users;
BEGIN
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at, needs_password_change)
    VALUES (
        user_id,
        user_email,
        user_full_name,
        user_role,
        now(),
        now(),
        user_needs_password_change -- Set the flag
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now(),
        -- Only update needs_password_change if explicitly passed as true (to avoid resetting it on casual updates)
        needs_password_change = CASE 
            WHEN user_needs_password_change IS TRUE THEN TRUE 
            ELSE public.users.needs_password_change 
        END
    RETURNING * INTO new_profile;

    RETURN to_jsonb(new_profile);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for user to complete setup (turn off flag)
CREATE OR REPLACE FUNCTION public.complete_password_setup()
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET needs_password_change = FALSE
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
