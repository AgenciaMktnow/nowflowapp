-- FIX USER CREATION LOGIC (Shield Protocol Integration)

-- 1. Create a secure RPC to invite users (bypassing RLS for the insertion)
CREATE OR REPLACE FUNCTION public.invite_user(
    new_email TEXT,
    new_role TEXT,
    new_name TEXT
)
RETURNS UUID AS $$
DECLARE
    admin_org_id UUID;
    admin_role TEXT;
    new_invite_id UUID;
BEGIN
    -- Check if executor is Admin
    SELECT role, organization_id INTO admin_role, admin_org_id
    FROM public.users
    WHERE id = auth.uid();

    IF admin_role IS NULL OR admin_role NOT IN ('ADMIN', 'MANAGER') THEN -- Allowing Managers too? Let's tick to Admin for now or both.
        RAISE EXCEPTION 'Apenas Administradores podem convidar usuários.';
    END IF;

    -- Insert Invitation
    INSERT INTO public.invitations (email, organization_id, role, created_at)
    VALUES (new_email, admin_org_id, new_role, now())
    ON CONFLICT (email) DO UPDATE 
    SET role = excluded.role, 
        organization_id = excluded.organization_id, -- Sync with inviter's org
        created_at = now()
    RETURNING id INTO new_invite_id;

    RETURN new_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add RLS Policies for Invitations (Just in case frontend wants to read)
DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
CREATE POLICY "Admins can view invitations" ON public.invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('ADMIN', 'MANAGER')
            AND users.organization_id = invitations.organization_id
        )
    );
