-- Migration: Refine Notification Content (Devolution & Assignment)
-- Fixes generic messages to be more specific and actionable.

-- 1. Refine Task Assignment Trigger to include Task Name
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
BEGIN
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
                -- "Task Name foi atribuída a você" or similar
                v_task_title || ' foi atribuída a você.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Refine Task Movement Trigger for "Devolution" context
CREATE OR REPLACE FUNCTION public.handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_new TEXT;
    v_task_title TEXT;
    v_creator_id UUID;
    v_last_comment TEXT;
    v_is_completion BOOLEAN DEFAULT FALSE;
    v_is_devolution BOOLEAN DEFAULT FALSE;
    v_metadata JSONB;
    v_title TEXT;
    v_message TEXT;
    v_column_title TEXT;
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Fetch Task Details
        -- Also fetch Column Title for display if available
        SELECT t.created_by, t.title, bc.title 
        INTO v_creator_id, v_task_title, v_column_title
        FROM public.tasks t
        LEFT JOIN public.board_columns bc ON bc.id = NEW.column_id
        WHERE t.id = NEW.id;

        -- Format Status & Detect Types
        v_status_new := NEW.status;
        
        -- Use Column Title if available, else fallback
        IF v_column_title IS NOT NULL THEN
             v_status_new := v_column_title;
        ELSE
            IF v_status_new = 'IN_PROGRESS' THEN v_status_new := 'Em Progresso';
            ELSIF v_status_new = 'WAITING_CLIENT' THEN v_status_new := 'Aguardando Cliente';
            ELSIF v_status_new = 'DONE' THEN v_status_new := 'Concluído';
            END IF;
        END IF;

        -- Detect Specific Scenarios
        IF NEW.status = 'WAITING_CLIENT' THEN 
            v_is_devolution := TRUE;
        ELSIF NEW.status = 'DONE' THEN 
            v_is_completion := TRUE;
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
            
            -- Determine Description/Body
            IF v_is_completion THEN
                v_title := '✅ Tarefa Concluída!';
                v_message := 'A tarefa ' || v_task_title || ' foi marcada como concluída.';
            ELSIF v_is_devolution THEN
                v_title := '🔄 Tarefa Devolvida';
                v_message := v_task_title || ' foi devolvida para você.';
                IF v_last_comment IS NOT NULL THEN
                     -- Truncate comment if too long? For now, full or simple snippet
                     v_message := v_message || ' Motivo: ' || substring(v_last_comment from 1 for 100) || '...';
                END IF;
            ELSE
                v_title := 'Tarefa Movimentada';
                v_message := v_status_new || ': ' || v_task_title;
            END IF;

            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (NEW.assignee_id, NEW.id, 'MOVEMENT', v_title, v_message, v_metadata);
        END IF;

        -- B. Notify Creator (if different)
        IF (v_creator_id IS NOT NULL AND v_creator_id != auth.uid() AND (NEW.assignee_id IS NULL OR v_creator_id != NEW.assignee_id)) THEN
             INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (
                v_creator_id,
                NEW.id,
                'MOVEMENT',
                CASE WHEN v_is_completion THEN '✅ Missão Cumprida!' ELSE 'Atualização na Tarefa' END,
                CASE 
                    WHEN v_is_completion THEN 'A tarefa ' || v_task_title || ' foi entregue.'
                    ELSE 'O Status de ' || v_task_title || ' mudou para: ' || v_status_new 
                END,
                v_metadata
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
