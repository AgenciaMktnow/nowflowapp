-- Migration: Core Notification System
-- Description: Creates notifications table and triggers for Assignment, Movement, and Comments.
-- Includes Self-Notification prevention and RLS.

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('ASSIGNMENT', 'MOVEMENT', 'COMMENT', 'MENTION')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores count for grouping, e.g., { "count": 1 }
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_task_type ON public.notifications(task_id, type);

-- 2. Ensure Preferences Table Exists (Idempotent)
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    notify_task_created BOOLEAN DEFAULT TRUE,
    notify_task_moved BOOLEAN DEFAULT TRUE,
    notify_task_returned BOOLEAN DEFAULT TRUE,
    notify_new_comment BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notification settings" ON public.user_notification_settings;
CREATE POLICY "Users can manage their own notification settings" ON public.user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- 3. Triggers Implementation

-- Trigger 3.1: Task Assignment
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic: If assignee changed AND is not null AND new assignee is different from current user (triggerer)
    IF (NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR NEW.assignee_id != OLD.assignee_id)) THEN
        -- Prevent Self-Notification
        IF (NEW.assignee_id != auth.uid()) THEN 
            INSERT INTO public.notifications (user_id, task_id, type, title, message)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'ASSIGNMENT',
                'Nova Tarefa Atribuída',
                'Você foi definido como responsável por esta tarefa.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_assignment ON public.tasks;
CREATE TRIGGER on_task_assignment
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_assignment();


-- Trigger 3.2: Task Movement
CREATE OR REPLACE FUNCTION public.handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_new TEXT;
BEGIN
    -- Logic: If status changed AND assignee exists
    IF (NEW.assignee_id IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Prevent Self-Notification
        IF (NEW.assignee_id != auth.uid()) THEN
            v_status_new := NEW.status;
            -- Formatting
            IF v_status_new = 'IN_PROGRESS' THEN v_status_new := 'Em Progresso';
            ELSIF v_status_new = 'WAITING_CLIENT' THEN v_status_new := 'Aguardando Cliente';
            ELSIF v_status_new = 'DONE' THEN v_status_new := 'Concluído';
            END IF;

            INSERT INTO public.notifications (user_id, task_id, type, title, message)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'MOVEMENT',
                'Tarefa Movimentada',
                'O Status mudou para: ' || v_status_new
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_movement ON public.tasks;
CREATE TRIGGER on_task_movement
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_movement();


-- Trigger 3.3: New Comment (Mentions & Assignee)
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_assignee_id UUID;
    v_mention_id UUID;
    v_existing_notif_id UUID;
    v_cur_count INT;
BEGIN
    -- Get task assignee
    SELECT assignee_id INTO v_task_assignee_id FROM public.tasks WHERE id = NEW.task_id;
    
    -- A. Handle Mentions (High Priority)
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        FOREACH v_mention_id IN ARRAY NEW.mentions
        LOOP
            -- Prevent Self-Notification
            IF v_mention_id != auth.uid() THEN
                INSERT INTO public.notifications (user_id, task_id, type, title, message)
                VALUES (
                    v_mention_id,
                    NEW.task_id,
                    'MENTION',
                    'Você foi mencionado',
                    'Mencionaram você em um comentário.'
                );
            END IF;
        END LOOP;
    END IF;

    -- B. Handle Assignee Notification (If not commenter AND not mentioned to avoid duplicate)
    IF v_task_assignee_id IS NOT NULL AND v_task_assignee_id != auth.uid() THEN
         -- Check if assignee was already mentioned
         IF NOT (NEW.mentions @> ARRAY[v_task_assignee_id]) THEN
            
            -- Grouping Logic: Check for existing UNREAD comment notification
            SELECT id, (metadata->>'count')::int INTO v_existing_notif_id, v_cur_count
            FROM public.notifications
            WHERE user_id = v_task_assignee_id
              AND task_id = NEW.task_id
              AND type = 'COMMENT'
              AND is_read = FALSE
            LIMIT 1;

            IF v_existing_notif_id IS NOT NULL THEN
                -- Update existing
                v_cur_count := COALESCE(v_cur_count, 1) + 1;
                UPDATE public.notifications
                SET 
                    title = v_cur_count || ' novos comentários',
                    message = 'Existem ' || v_cur_count || ' novos comentários nesta tarefa.',
                    metadata = jsonb_build_object('count', v_cur_count),
                    created_at = now() -- Bump to top
                WHERE id = v_existing_notif_id;
            ELSE
                -- Create new
                INSERT INTO public.notifications (user_id, task_id, type, title, message, metadata)
                VALUES (
                    v_task_assignee_id,
                    NEW.task_id,
                    'COMMENT',
                    'Novo comentário',
                    'Comentaram na sua tarefa.',
                    '{"count": 1}'::jsonb
                );
            END IF;
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment ON public.task_comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON public.task_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_comment();
