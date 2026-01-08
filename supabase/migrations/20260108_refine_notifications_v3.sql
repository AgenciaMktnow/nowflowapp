-- =========================================================================================
-- NOTIFICATION SYSTEM REFINEMENT V3
-- 1. Fix: Prevent "New Task" on Completion (Ignore DONE).
-- 2. Style: Standardize format "[User] [Action]: [Task]".
-- 3. Feature: Intelligent Comments (Snippets).
-- 4. Logic: Detect "Adjustment Needed" (Done -> Back).
-- =========================================================================================

-- 1. REFINE TASK ASSIGNMENT TRIGGER
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
    v_assigner_name TEXT;
BEGIN
    -- Bug Fix: Ignore if task is being completed (DONE) or returned (WAITING_CLIENT)
    -- This prevents double notification when status updates coincide with assignment refresh
    IF NEW.status IN ('DONE', 'WAITING_CLIENT') THEN
        RETURN NEW;
    END IF;

    -- Fetch Task Title
    SELECT title INTO v_task_title FROM public.tasks WHERE id = NEW.id;

    -- Fetch Assigner Name (Current User)
    SELECT full_name INTO v_assigner_name FROM public.users WHERE id = auth.uid();
    IF v_assigner_name IS NULL THEN v_assigner_name := 'Alguém'; END IF;

    -- Trigger Logic: New Assignment or Re-assignment
    IF (NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR NEW.assignee_id != OLD.assignee_id)) THEN
        -- Don't notify self
        IF (NEW.assignee_id != auth.uid()) THEN 
            INSERT INTO public.notifications (user_id, task_id, type, title, message)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'ASSIGNMENT',
                '📌 Nova Tarefa',
                v_assigner_name || ' te atribuiu uma nova tarefa: ' || v_task_title || '.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. REFINE TASK MOVEMENT TRIGGER
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_new TEXT;
    v_task_title TEXT;
    v_creator_id UUID;
    v_last_comment TEXT;
    v_actor_name TEXT;
    v_is_completion BOOLEAN DEFAULT FALSE;
    v_is_adjustment BOOLEAN DEFAULT FALSE; -- Done -> In Progress
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
            v_is_adjustment := TRUE; -- Moved FROM Done back to something else
             -- Human status
            IF v_column_title IS NOT NULL THEN
                 v_status_new := v_column_title;
            ELSE
                 v_status_new := NEW.status; 
            END IF;
        ELSE
            -- Normal Movement
             IF v_column_title IS NOT NULL THEN
                 v_status_new := v_column_title;
             ELSE
                 v_status_new := NEW.status;
             END IF;
        END IF;

        -- Context from Comment (for Devolution or standard)
        SELECT content INTO v_last_comment 
        FROM public.task_comments 
        WHERE task_id = NEW.id 
        ORDER BY created_at DESC 
        LIMIT 1;

        v_metadata := CASE 
            WHEN v_last_comment IS NOT NULL THEN jsonb_build_object('context', substring(v_last_comment from 1 for 100)) 
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

        -- B. Notify Creator (if different and not assignee)
        IF (v_creator_id IS NOT NULL AND v_creator_id != auth.uid() AND (NEW.assignee_id IS NULL OR v_creator_id != NEW.assignee_id)) THEN
             -- Same message for Creator usually works well
             INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
            VALUES (v_creator_id, NEW.id, 'MOVEMENT', v_title, v_message, v_metadata);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. REFINE COMMENT TRIGGER (Intelligent Snippets)
-- -----------------------------------------------------------------------------------------
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

    -- Create Snippet (First 50 chars + ellipsis)
    v_snippet := substring(v_content from 1 for 60);
    IF length(v_content) > 60 THEN v_snippet := v_snippet || '...'; END IF;
    -- Remove markdown bold/italics ideally, but simple substring is acceptable for MVP.
    
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
