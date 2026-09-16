-- =========================================================================================
-- FIX DELETE USER RPC - PREVENT DATA LOSS
-- Problem: Previous version only transferred 'assignee_id', causing 'created_by' tasks to be deleted via CASCADE.
-- Solution: Transfer 'created_by' ownership to the new owner BEFORE deleting the user.
-- =========================================================================================

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
  count_created INTEGER;
  count_assigned INTEGER;
BEGIN
  -- 1. Security Check: Only Admin
  SELECT role INTO requesting_user_role
  FROM public.users
  WHERE id = auth.uid();

  IF requesting_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Acesso Negado: Apenas Administradores podem excluir usuários.';
  END IF;

  -- 2. Prevent Self-Deletion
  IF target_user_id = auth.uid() THEN
     RAISE EXCEPTION 'Ação Não Permitida: Você não pode excluir sua própria conta.';
  END IF;

  -- 3. Validation & Transfer
  IF new_owner_id IS NOT NULL THEN
     -- Verify if new_owner exists
     IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new_owner_id) THEN
        RAISE EXCEPTION 'Erro: O usuário de destino para transferência não existe.';
     END IF;

     -- A. Transfer TASKS Ownership (The "DNA" - created_by)
     -- This prevents ON DELETE CASCADE from wiping out tasks created by this user.
     UPDATE public.tasks 
     SET created_by = new_owner_id 
     WHERE created_by = target_user_id;
     
     GET DIAGNOSTICS count_created = ROW_COUNT;

     -- B. Transfer TASKS Assignment (The "Responsibility" - assignee_id)
     UPDATE public.tasks 
     SET assignee_id = new_owner_id 
     WHERE assignee_id = target_user_id;

     GET DIAGNOSTICS count_assigned = ROW_COUNT;

     -- Optional: Transfer Attachments ownership?
     -- Usually attachments are personal, but let's transfer to prevent loss.
     UPDATE public.task_attachments
     SET user_id = new_owner_id
     WHERE user_id = target_user_id;

  END IF;

  -- 4. Delete the User
  -- Now safe to delete, as FK dependencies for tasks have been moved.
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- (Optional logging or notification could be added here)
  
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID, UUID) TO authenticated;
