-- =========================================================================================
-- FIX: NOTIFICATION HTML SANITIZATION
-- Purpose: Remove raw HTML tags from notifications (Bell & Email payloads) for cleaner UX.
-- =========================================================================================

-- 1. Helper Function: Strip HTML Tags
CREATE OR REPLACE FUNCTION public.strip_html_tags(p_text TEXT)
RETURNS TEXT AS $$
DECLARE
    v_clean TEXT;
BEGIN
    IF p_text IS NULL THEN
        RETURN NULL;
    END IF;

    -- Remove HTML tags
    v_clean := regexp_replace(p_text, '<[^>]+>', '', 'g');
    
    -- Replace HTML entities
    v_clean := replace(v_clean, '&nbsp;', ' ');
    v_clean := replace(v_clean, '&amp;', '&');
    v_clean := replace(v_clean, '&lt;', '<');
    v_clean := replace(v_clean, '&gt;', '>');
    v_clean := replace(v_clean, '&quot;', '"');

    -- Collapse multiple spaces
    v_clean := regexp_replace(v_clean, '\s+', ' ', 'g');
    
    RETURN trim(v_clean);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- 2. Update Bell Notification Trigger (handle_new_comment)
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_assignee_id UUID;
    v_task_creator_id UUID;
    v_task_title TEXT;
    v_mention_id UUID;
    v_existing_notif_id UUID;
    v_cur_count INT;
    v_content TEXT;
    v_snippet TEXT;
    v_actor_name TEXT;
    v_message TEXT;
BEGIN
    v_content := NEW.content;

    -- Silence System Comments
    IF v_content ILIKE '🔄%' OR v_content ILIKE '%**Tarefa Devolvida**%' 
       OR v_content ILIKE '📌%' OR v_content ILIKE '%**Tarefa Clonada**%' 
       OR v_content ILIKE '✅%' 
    THEN
        RETURN NEW;
    END IF;

    -- Get Context
    SELECT assignee_id, created_by, title INTO v_task_assignee_id, v_task_creator_id, v_task_title 
    FROM public.tasks WHERE id = NEW.task_id;

    SELECT full_name INTO v_actor_name FROM public.users WHERE id = auth.uid();
    IF v_actor_name IS NULL THEN v_actor_name := 'Alguém'; END IF;

    -- SANITIZE CONTENT
    v_content := public.strip_html_tags(v_content);

    -- Create Snippet (First 80 chars + ellipsis)
    v_snippet := substring(v_content from 1 for 80);
    IF length(v_content) > 80 THEN v_snippet := v_snippet || '...'; END IF;
    
    -- Format: "[User] comentou em [Task]: "[Snippet]""
    v_message := v_actor_name || ' comentou em ' || v_task_title || ': "' || v_snippet || '"';


    -- A. Handle Mentions
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        FOREACH v_mention_id IN ARRAY NEW.mentions
        LOOP
            IF v_mention_id != auth.uid() THEN
                INSERT INTO public.notifications (user_id, task_id, type, title, message)
                VALUES (
                    v_mention_id, 
                    NEW.task_id, 
                    'MENTION', 
                    '⚠️ Você foi mencionado', 
                    v_actor_name || ' te mencionou em ' || v_task_title || ': "' || v_snippet || '"'
                );
            END IF;
        END LOOP;
    END IF;

    -- B. Handle Assignee
    IF v_task_assignee_id IS NOT NULL AND v_task_assignee_id != auth.uid() AND NOT (NEW.mentions @> ARRAY[v_task_assignee_id]) THEN
        -- Check for existing unread comment
        SELECT id, (metadata->>'count')::int INTO v_existing_notif_id, v_cur_count
        FROM public.notifications WHERE user_id = v_task_assignee_id AND task_id = NEW.task_id AND type = 'COMMENT' AND is_read = FALSE LIMIT 1;

        IF v_existing_notif_id IS NOT NULL THEN
            v_cur_count := COALESCE(v_cur_count, 1) + 1;
            UPDATE public.notifications 
            SET title = v_cur_count || ' novos comentários', 
                message = 'Existem ' || v_cur_count || ' novos comentários em: ' || v_task_title, 
                metadata = jsonb_build_object('count', v_cur_count), 
                created_at = now() 
            WHERE id = v_existing_notif_id;
        ELSE
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata) 
            VALUES (v_task_assignee_id, NEW.task_id, 'COMMENT', 'Novo comentário', v_message, '{"count": 1}'::jsonb);
        END IF;
    END IF;

    -- C. Handle Creator
    IF v_task_creator_id IS NOT NULL 
       AND v_task_creator_id != auth.uid() 
       AND (v_task_assignee_id IS NULL OR v_task_creator_id != v_task_assignee_id)
       AND NOT (NEW.mentions @> ARRAY[v_task_creator_id]) 
    THEN
        SELECT id, (metadata->>'count')::int INTO v_existing_notif_id, v_cur_count
        FROM public.notifications WHERE user_id = v_task_creator_id AND task_id = NEW.task_id AND type = 'COMMENT' AND is_read = FALSE LIMIT 1;

        IF v_existing_notif_id IS NOT NULL THEN
             v_cur_count := COALESCE(v_cur_count, 1) + 1;
            UPDATE public.notifications 
            SET title = v_cur_count || ' novos comentários', 
                message = 'Existem ' || v_cur_count || ' novos comentários em: ' || v_task_title, 
                metadata = jsonb_build_object('count', v_cur_count), 
                created_at = now() 
            WHERE id = v_existing_notif_id;
        ELSE
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata) 
            VALUES (v_task_creator_id, NEW.task_id, 'COMMENT', 'Novo comentário', v_message, '{"count": 1}'::jsonb);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update Email Edge Function Payload (notify_edge_function)
CREATE OR REPLACE FUNCTION notify_edge_function()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT;
    v_last_comment TEXT;
    v_edge_url TEXT := 'https://mowxezzjmtjlzftpzdxf.supabase.co/functions/v1/send-notification';
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Determine Event Type
    IF TG_OP = 'INSERT' THEN
        v_type := 'task_created';
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check for status change
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF is_status_returned(OLD.status, NEW.status) THEN
                v_type := 'task_returned';
                -- Fetch last comment for context
                SELECT content INTO v_last_comment 
                FROM task_comments 
                WHERE task_id = NEW.id 
                ORDER BY created_at DESC 
                LIMIT 1;
                
                -- SANITIZE FOR EMAIL
                v_last_comment := public.strip_html_tags(v_last_comment);
                
            ELSE
                v_type := 'task_status_changed';
            END IF;
            v_old_status := OLD.status;
            v_new_status := NEW.status;
        ELSIF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL THEN
            v_type := 'task_assigned';
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- Send HTTP request to Edge Function
    IF v_type IS NOT NULL THEN
        PERFORM net.http_post(
            url := v_edge_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('request.headers')::jsonb->>'authorization'
            ),
            body := jsonb_build_object(
                'type', v_type,
                'data', jsonb_build_object(
                    'task_id', NEW.id,
                    'old_status', v_old_status,
                    'new_status', v_new_status,
                    'last_comment', v_last_comment, -- Now Clean
                    'changed_by', auth.uid()
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Bell Movement Trigger (handle_task_movement)
CREATE OR REPLACE FUNCTION public.handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_new TEXT;
    v_task_title TEXT;
    v_creator_id UUID;
    v_last_comment TEXT;
    v_actor_name TEXT;
    v_is_completion BOOLEAN DEFAULT FALSE;
    v_is_adjustment BOOLEAN DEFAULT FALSE; 
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

        -- Fetch Actor Name
        SELECT full_name INTO v_actor_name FROM public.users WHERE id = auth.uid();
        IF v_actor_name IS NULL THEN v_actor_name := 'Sistema'; END IF;

        -- Detect Specific Scenarios
        IF NEW.status = 'WAITING_CLIENT' THEN 
            v_is_devolution := TRUE;
            v_status_new := 'Aguardando Cliente';
        ELSIF NEW.status = 'DONE' THEN 
            v_is_completion := TRUE;
            v_status_new := 'Concluído';
        ELSIF OLD.status = 'DONE' AND NEW.status != 'DONE' THEN
            v_is_adjustment := TRUE;
            IF v_column_title IS NOT NULL THEN v_status_new := v_column_title; ELSE v_status_new := NEW.status; END IF;
        ELSE
             IF v_column_title IS NOT NULL THEN v_status_new := v_column_title; ELSE v_status_new := NEW.status; END IF;
        END IF;

        -- Context from Comment
        SELECT content INTO v_last_comment 
        FROM public.task_comments 
        WHERE task_id = NEW.id 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- SANITIZE
        v_last_comment := public.strip_html_tags(v_last_comment);
        
        -- Use only first 100 chars
        v_last_comment := substring(v_last_comment from 1 for 100);

        v_metadata := CASE 
            WHEN v_last_comment IS NOT NULL THEN jsonb_build_object('context', v_last_comment) 
            ELSE '{}'::jsonb 
        END;

        -- DEFINE MESSAGES
        IF v_is_completion THEN
            v_title := '✅ Tarefa Concluída';
            v_message := v_actor_name || ' concluiu a tarefa: ' || v_task_title || '.';
        ELSIF v_is_adjustment THEN
            v_title := '🔄 Ajuste Necessário';
            v_message := v_actor_name || ' reabriu a tarefa: ' || v_task_title || '.';
        ELSIF v_is_devolution THEN
            v_title := '🔄 Tarefa Devolvida';
            v_message := v_actor_name || ' devolveu a tarefa: ' || v_task_title || '. Verifique os comentários.';
        ELSE
            -- Generic
            v_title := 'Tarefa Movimentada';
            v_message := v_actor_name || ' moveu ' || v_task_title || ' para: ' || v_status_new || '.';
        END IF;


        -- A. Notify Assignee
        IF (NEW.assignee_id IS NOT NULL AND NEW.assignee_id != auth.uid()) THEN
            INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (NEW.assignee_id, NEW.id, 'MOVEMENT', v_title, v_message, v_metadata);
        END IF;

        -- B. Notify Creator
        IF (v_creator_id IS NOT NULL AND v_creator_id != auth.uid() AND (NEW.assignee_id IS NULL OR v_creator_id != NEW.assignee_id)) THEN
             INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (v_creator_id, NEW.id, 'MOVEMENT', v_title, v_message, v_metadata);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
