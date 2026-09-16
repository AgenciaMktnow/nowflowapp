CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND (
            is_super_admin = TRUE 
            OR email IN ('neto@mktnow.com.br', 'duqueneto@gmail.com', 'duqueneto@gmail.com.br', 'mauricio@mktnow.com.br')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
