-- Migration: Notifications Extended ("Parrudo" Edition)
-- Adds deadline column and updates triggers for Creator notifications, Devolution Context, and Celebration.

-- 1. Schema Change: Add Deadline Warning Flag
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deadline_warning_sent BOOLEAN DEFAULT FALSE;

-- 2. Update Trigger: Task Movement (Status Changes)
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
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Fetch Task Details
        SELECT created_by, title INTO v_creator_id, v_task_title FROM public.tasks WHERE id = NEW.id;

        -- Format Status & Detect Types
        v_status_new := NEW.status;
        IF v_status_new = 'IN_PROGRESS' THEN v_status_new := 'Em Progresso';
        ELSIF v_status_new = 'WAITING_CLIENT' THEN 
            v_status_new := 'Aguardando Cliente';
            v_is_devolution := TRUE;
        ELSIF v_status_new = 'DONE' THEN 
            v_status_new := 'Concluído';
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

        -- A. Notify Assignee (Existing Logic)
        IF (NEW.assignee_id IS NOT NULL AND NEW.assignee_id != auth.uid()) THEN
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'MOVEMENT',
                CASE WHEN v_is_completion THEN '✅ Tarefa Concluída!' ELSE 'Tarefa Movimentada' END,
                CASE 
                    WHEN v_is_completion THEN 'A tarefa foi marcada como concluída.'
                    ELSE 'O Status mudou para: ' || v_status_new 
                END,
                v_metadata
            );
        END IF;

        -- B. Notify Creator (New Logic)
        -- Condition: Creator exists AND != Current User AND != Assignee (avoid double notification)
        IF (v_creator_id IS NOT NULL AND v_creator_id != auth.uid() AND (NEW.assignee_id IS NULL OR v_creator_id != NEW.assignee_id)) THEN
             INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (
                v_creator_id,
                NEW.id,
                'MOVEMENT',
                CASE WHEN v_is_completion THEN '✅ Missão Cumprida!' ELSE 'Atualização na sua Tarefa' END,
                CASE 
                    WHEN v_is_completion THEN 'Sua tarefa foi entregue com sucesso.'
                    ELSE 'O Status da sua tarefa mudou para: ' || v_status_new 
                END,
                v_metadata
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update Trigger: New Comment (Add Creator Notification)
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_assignee_id UUID;
    v_task_creator_id UUID;
    v_mention_id UUID;
    v_existing_notif_id UUID;
    v_cur_count INT;
BEGIN
    SELECT assignee_id, created_by INTO v_task_assignee_id, v_task_creator_id FROM public.tasks WHERE id = NEW.task_id;
    
    -- A. Handle Mentions (Priority)
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        FOREACH v_mention_id IN ARRAY NEW.mentions
        LOOP
            IF v_mention_id != auth.uid() THEN
                INSERT INTO public.notifications (user_id, task_id, type, title, message)
                VALUES (v_mention_id, NEW.task_id, 'MENTION', '⚠️ Você foi mencionado', 'Mencionaram você em um comentário.');
            END IF;
        END LOOP;
    END IF;

    -- B. Handle Assignee Notification
    IF v_task_assignee_id IS NOT NULL AND v_task_assignee_id != auth.uid() AND NOT (NEW.mentions @> ARRAY[v_task_assignee_id]) THEN
        -- Check for existing unread comment notification to Group
        SELECT id, (metadata->>'count')::int INTO v_existing_notif_id, v_cur_count
        FROM public.notifications WHERE user_id = v_task_assignee_id AND task_id = NEW.task_id AND type = 'COMMENT' AND is_read = FALSE LIMIT 1;

        IF v_existing_notif_id IS NOT NULL THEN
            v_cur_count := COALESCE(v_cur_count, 1) + 1;
            UPDATE public.notifications SET title = v_cur_count || ' novos comentários', message = 'Existem ' || v_cur_count || ' novos comentários.', metadata = jsonb_build_object('count', v_cur_count), created_at = now() WHERE id = v_existing_notif_id;
        ELSE
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata) VALUES (v_task_assignee_id, NEW.task_id, 'COMMENT', 'Novo comentário', 'Comentaram na sua tarefa.', '{"count": 1}'::jsonb);
        END IF;
    END IF;

    -- C. Handle Creator Notification (New Logic)
    -- Condition: Creator exists AND != Commenter AND != Assignee (Handled in B) AND Not Mentioned (Handled in A)
    IF v_task_creator_id IS NOT NULL 
       AND v_task_creator_id != auth.uid() 
       AND (v_task_assignee_id IS NULL OR v_task_creator_id != v_task_assignee_id)
       AND NOT (NEW.mentions @> ARRAY[v_task_creator_id]) 
    THEN
        -- Grouping Logic for Creator
        SELECT id, (metadata->>'count')::int INTO v_existing_notif_id, v_cur_count
        FROM public.notifications WHERE user_id = v_task_creator_id AND task_id = NEW.task_id AND type = 'COMMENT' AND is_read = FALSE LIMIT 1;

        IF v_existing_notif_id IS NOT NULL THEN
            v_cur_count := COALESCE(v_cur_count, 1) + 1;
            UPDATE public.notifications SET title = v_cur_count || ' novos comentários', message = 'Existem ' || v_cur_count || ' novos comentários.', metadata = jsonb_build_object('count', v_cur_count), created_at = now() WHERE id = v_existing_notif_id;
        ELSE
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata) VALUES (v_task_creator_id, NEW.task_id, 'COMMENT', 'Novo comentário', 'Comentaram na tarefa que você criou.', '{"count": 1}'::jsonb);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
