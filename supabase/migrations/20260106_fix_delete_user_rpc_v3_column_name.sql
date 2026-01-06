-- Migration: Correction of delete_user_complete RPC (user_id -> assignee_id)
DROP FUNCTION IF EXISTS public.delete_user_complete(UUID, UUID);

CREATE OR REPLACE FUNCTION public.delete_user_complete(
    target_user_id UUID,
    new_owner_id UUID DEFAULT NULL
)
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

  -- Transfer Responsibilities (if new_owner_id is provided)
  IF new_owner_id IS NOT NULL THEN
     -- Verify if new_owner exists
     IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new_owner_id) THEN
        RAISE EXCEPTION 'Erro: O usuário de destino para transferência não existe.';
     END IF;

     -- Reassign Tasks (CORRECTED COLUMN: assignee_id)
     UPDATE public.tasks 
     SET assignee_id = new_owner_id 
     WHERE assignee_id = target_user_id;
  END IF;

  -- Delete from auth.users (Cascades to public.users usually)
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID, UUID) TO authenticated;
