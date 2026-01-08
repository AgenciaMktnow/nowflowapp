-- Migration: Fix Notification Titles & Logic (Strict Rules)

-- 1. Refine Task Assignment: Prevent "New Task" on Devolutions
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
BEGIN
    -- Skip if the task is being "returned" (Status = WAITING_CLIENT)
    -- Movement trigger will handle the "Devolution" notification.
    IF NEW.status = 'WAITING_CLIENT' THEN
        RETURN NEW;
    END IF;

    -- Fetch Task Title
    SELECT title INTO v_task_title FROM public.tasks WHERE id = NEW.id;

    IF (NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR NEW.assignee_id != OLD.assignee_id)) THEN
        IF (NEW.assignee_id != auth.uid()) THEN 
            INSERT INTO public.notifications (user_id, task_id, type, title, message)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'ASSIGNMENT',
                '📌 Nova Tarefa',
                'Você recebeu a tarefa ' || v_task_title || '.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Refine Task Movement: Strict Devolution and Completion Messages
CREATE OR REPLACE FUNCTION public.handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_new TEXT;
    v_task_title TEXT;
    v_creator_id UUID;
    v_last_comment TEXT;
    v_actor_name TEXT;
    v_is_completion BOOLEAN DEFAULT FALSE;
    v_is_devolution BOOLEAN DEFAULT FALSE;
    v_metadata JSONB;
    v_title TEXT;
    v_message TEXT;
    v_column_title TEXT;
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Fetch Task Details
        SELECT t.created_by, t.title, bc.title 
        INTO v_creator_id, v_task_title, v_column_title
        FROM public.tasks t
        LEFT JOIN public.board_columns bc ON bc.id = NEW.column_id
        WHERE t.id = NEW.id;

        -- Fetch Actor Name (Who triggered this?)
        SELECT full_name INTO v_actor_name FROM public.users WHERE id = auth.uid();
        IF v_actor_name IS NULL THEN v_actor_name := 'Alguém'; END IF;

        -- Detect Specific Scenarios
        IF NEW.status = 'WAITING_CLIENT' THEN 
            v_is_devolution := TRUE;
            v_status_new := 'Aguardando Cliente'; -- Not used for logic, just display fallback
        ELSIF NEW.status = 'DONE' THEN 
            v_is_completion := TRUE;
            v_status_new := 'Concluído';
        ELSE
             -- Human Readable Status
             IF v_column_title IS NOT NULL THEN
                 v_status_new := v_column_title;
             ELSE
                 v_status_new := NEW.status; -- Fallback
                 IF v_status_new = 'IN_PROGRESS' THEN v_status_new := 'Em Progresso'; END IF;
             END IF;
        END IF;


        -- Fetch Context for Devolution (Last Comment)
        IF v_is_devolution THEN
            SELECT content INTO v_last_comment 
            FROM public.task_comments 
            WHERE task_id = NEW.id 
            ORDER BY created_at DESC 
            LIMIT 1;
        END IF;

        v_metadata := CASE 
            WHEN v_last_comment IS NOT NULL THEN jsonb_build_object('context', v_last_comment) 
            ELSE '{}'::jsonb 
        END;

        -- A. Notify Assignee
        IF (NEW.assignee_id IS NOT NULL AND NEW.assignee_id != auth.uid()) THEN
            
            IF v_is_completion THEN
                v_title := '✅ Tarefa Concluída';
                v_message := v_actor_name || ' finalizou a tarefa ' || v_task_title || '.';
            ELSIF v_is_devolution THEN
                v_title := '🔄 Tarefa Devolvida';
                v_message := 'A tarefa ' || v_task_title || ' retornou para você. Verifique os comentários.';
            ELSE
                v_title := 'Tarefa Movimentada';
                v_message := 'O status de ' || v_task_title || ' mudou para: ' || v_status_new;
            END IF;

            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (NEW.assignee_id, NEW.id, 'MOVEMENT', v_title, v_message, v_metadata);
        END IF;

        -- B. Notify Creator (if different and not already notified as assignee)
        IF (v_creator_id IS NOT NULL AND v_creator_id != auth.uid() AND (NEW.assignee_id IS NULL OR v_creator_id != NEW.assignee_id)) THEN
             
             -- Customize message for Creator too?
             -- User prompt focused on Assignee flow, but let's keep Creator consistent or simple.
             -- Keeping Creator logic slightly separate or mirroring.
             
            IF v_is_completion THEN
                v_title := '✅ Tarefa Concluída';
                v_message := v_actor_name || ' finalizou a tarefa ' || v_task_title || '.';
            ELSE
                 v_title := 'Atualização na Tarefa';
                 v_message := 'O Status de ' || v_task_title || ' mudou para: ' || v_status_new;
            END IF;

             INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (
                v_creator_id,
                NEW.id,
                'MOVEMENT',
                v_title,
                v_message,
                v_metadata
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
