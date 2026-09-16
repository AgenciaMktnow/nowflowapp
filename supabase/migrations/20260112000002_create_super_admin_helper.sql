-- Shared by billing, broadcasts, metrics and cross-organization RLS policies.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_super BOOLEAN;
    user_email TEXT;
BEGIN
    is_super := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'is_super_admin')::boolean;
    user_email := current_setting('request.jwt.claims', true)::jsonb ->> 'email';

    RETURN is_super IS TRUE
        OR user_email IN (
            'neto@mktnow.com.br',
            'duqueneto@gmail.com',
            'duqueneto@gmail.com.br'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
