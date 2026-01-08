-- Migration: Fix Notification Status Names (Use Board Columns)
-- Updates logic to fetch human-readable stage name from board_columns table.

CREATE OR REPLACE FUNCTION public.handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_display TEXT;
    v_task_title TEXT;
    v_creator_id UUID;
    v_last_comment TEXT;
    v_is_completion BOOLEAN DEFAULT FALSE;
    v_is_devolution BOOLEAN DEFAULT FALSE;
    v_column_title TEXT;
    v_metadata JSONB;
BEGIN
    -- Logic: Status changed OR Column changed
    -- Sometimes status stays same (IN_PROGRESS) but column changes (Dev -> Review)
    IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.column_id IS DISTINCT FROM OLD.column_id) THEN
        
        -- Fetch Task Details & Column Name
        SELECT t.created_by, t.title, bc.title 
        INTO v_creator_id, v_task_title, v_column_title
        FROM public.tasks t
        LEFT JOIN public.board_columns bc ON bc.id = NEW.column_id
        WHERE t.id = NEW.id;

        -- Determine Display Status
        IF v_column_title IS NOT NULL THEN
            v_status_display := v_column_title;
        ELSE
            -- Fallback to Status Enum Mapping
            v_status_display := NEW.status;
            IF v_status_display = 'IN_PROGRESS' THEN v_status_display := 'Em Progresso';
            ELSIF v_status_display = 'WAITING_CLIENT' THEN v_status_display := 'Aguardando Cliente';
            ELSIF v_status_display = 'DONE' THEN v_status_display := 'Concluído';
            END IF;
        END IF;

        -- Detect Types depending on Status Enum (Logic remains on Enum for behavioral flags)
        IF NEW.status = 'WAITING_CLIENT' THEN 
            v_is_devolution := TRUE;
            v_status_display := 'Aguardando Cliente'; -- Force specific display for this special state? Or keep column name? Likely keep column name if explicit. 
            -- Actually, usually Waiting Client is a specific status. Let's trust column name if exists, else Default.
        ELSIF NEW.status = 'DONE' THEN 
            v_is_completion := TRUE;
        END IF;

        -- Fetch Context for Devolution
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
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'MOVEMENT',
                CASE WHEN v_is_completion THEN '✅ Tarefa Concluída!' ELSE 'Tarefa Movimentada' END,
                CASE 
                    WHEN v_is_completion THEN 'A tarefa foi marcada como concluída.'
                    ELSE 'A tarefa foi movida para: ' || v_status_display
                END,
                v_metadata
            );
        END IF;

        -- B. Notify Creator
        IF (v_creator_id IS NOT NULL AND v_creator_id != auth.uid() AND (NEW.assignee_id IS NULL OR v_creator_id != NEW.assignee_id)) THEN
             INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (
                v_creator_id,
                NEW.id,
                'MOVEMENT',
                CASE WHEN v_is_completion THEN '✅ Missão Cumprida!' ELSE 'Atualização na sua Tarefa' END,
                CASE 
                    WHEN v_is_completion THEN 'Sua tarefa foi entregue com sucesso.'
                    ELSE 'A tarefa foi movida para: ' || v_status_display
                END,
                v_metadata
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger logic update: Must fire on column_id change too!
DROP TRIGGER IF EXISTS on_task_movement ON public.tasks;
CREATE TRIGGER on_task_movement
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_movement();
