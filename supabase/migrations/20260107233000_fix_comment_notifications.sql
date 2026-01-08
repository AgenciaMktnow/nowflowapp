-- Migration: Fix Comment Notifications (Silence System Messages)
-- Overrides previous definitions of handle_new_comment

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_assignee_id UUID;
    v_task_creator_id UUID;
    v_mention_id UUID;
    v_existing_notif_id UUID;
    v_cur_count INT;
    v_content TEXT;
BEGIN
    v_content := NEW.content;

    -- 🔴 SILENCE SYSTEM COMMENTS
    -- If the comment starts with specific system icons/phrases, do NOT notify as a "New Comment".
    -- The Task Movement trigger handles the specific notification for these events.
    IF v_content ILIKE '🔄%' OR v_content ILIKE '%**Tarefa Devolvida**%' 
       OR v_content ILIKE '📌%' OR v_content ILIKE '%**Tarefa Clonada**%' 
       OR v_content ILIKE '✅%' 
    THEN
        RETURN NEW;
    END IF;

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

    -- C. Handle Creator Notification
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
