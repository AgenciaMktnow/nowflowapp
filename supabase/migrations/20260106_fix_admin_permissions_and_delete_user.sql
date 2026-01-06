-- 1. Fix RLS on users table to allow Admins to UPDATE and DELETE any user

-- Create UPDATE policy
CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
);

-- Create DELETE policy
CREATE POLICY "Admins can delete all users"
ON users
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
);


-- 2. Create Secure RPC to delete user from auth.users

-- Drop function if it already exists to avoid conflict
DROP FUNCTION IF EXISTS public.delete_user_complete(UUID);

CREATE OR REPLACE FUNCTION public.delete_user_complete(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get role of the user executing the function
  SELECT role INTO requesting_user_role
  FROM public.users
  WHERE id = auth.uid();

  -- Verify Admin role
  IF requesting_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Acesso Negado: Apenas Administradores podem excluir usuários.';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
     RAISE EXCEPTION 'Ação Não Permitida: Você não pode excluir sua própria conta.';
  END IF;

  -- Delete from auth.users (Cascades to public.users usually)
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID) TO authenticated;
