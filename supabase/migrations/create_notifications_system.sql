-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('ASSIGNMENT', 'MOVEMENT', 'COMMENT', 'MENTION')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores count for grouping, e.g., { "count": 1 }
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_task_type ON notifications(task_id, type);


-- TRIGGER FUNCTION: Handle Task Assignment
CREATE OR REPLACE FUNCTION handle_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If assignee changed and is not null and is different from the user who made the change (auth.uid())
    -- Note: We can't easily check 'who made the change' inside a trigger without some hacks or relying on application logic.
    -- Ideally, we check if NEW.assignee_id != OLD.assignee_id (or OLD is null).
    -- Self-assignment check: typically we want to notify even if self-assigned? No, usually not.
    -- Supabase `auth.uid()` works in triggers if invoked from client.
    
    IF (NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR NEW.assignee_id != OLD.assignee_id)) THEN
        IF (NEW.assignee_id != auth.uid()) THEN -- Don't notify self
            INSERT INTO notifications (user_id, task_id, type, title, message)
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

-- TRIGGER: Task Assignment
DROP TRIGGER IF EXISTS on_task_assignment ON tasks;
CREATE TRIGGER on_task_assignment
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_task_assignment();


-- TRIGGER FUNCTION: Handle Task Movement
CREATE OR REPLACE FUNCTION handle_task_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_status_old TEXT;
    v_status_new TEXT;
BEGIN
    -- Check if status changed or column_id changed (if you use column_id for kanban)
    -- Assuming status is primary driver for "Movement" notification as per user request.
    
    IF (NEW.assignee_id IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Only notify if the assignee is NOT the one who moved it
        IF (NEW.assignee_id != auth.uid()) THEN
            v_status_new := NEW.status;
            -- Simple formatting for status
            IF v_status_new = 'IN_PROGRESS' THEN v_status_new := 'Em Progresso';
            ELSIF v_status_new = 'WAITING_CLIENT' THEN v_status_new := 'Aguardando Cliente';
            ELSIF v_status_new = 'DONE' THEN v_status_new := 'Concluído';
            END IF;

            INSERT INTO notifications (user_id, task_id, type, title, message)
            VALUES (
                NEW.assignee_id,
                NEW.id,
                'MOVEMENT',
                'Tarefa Movimentada',
                'Sua tarefa mudou de status para: ' || v_status_new
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Task Movement
DROP TRIGGER IF EXISTS on_task_movement ON tasks;
CREATE TRIGGER on_task_movement
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_task_movement();


-- TRIGGER FUNCTION: Handle New Comment (with Grouping and Mentions)
CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_assignee_id UUID;
    v_recipient_id UUID;
    v_existing_notif_id UUID;
    v_cur_count INT;
    v_mention_id UUID;
    v_mentions UUID[];
BEGIN
    -- Get task assignee
    SELECT assignee_id INTO v_task_assignee_id FROM tasks WHERE id = NEW.task_id;
    
    -- 1. Handle Mentions (High Priority, No Grouping)
    -- NEW.mentions is UUID[] array of user_ids mentioned
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        FOREACH v_mention_id IN ARRAY NEW.mentions
        LOOP
            -- Don't notify self if mentioned (unlikely but possible)
            IF v_mention_id != auth.uid() THEN
                INSERT INTO notifications (user_id, task_id, type, title, message)
                VALUES (
                    v_mention_id,
                    NEW.task_id,
                    'MENTION',
                    'Você foi mencionado',
                    'Você foi mencionado em um comentário.'
                );
            END IF;
        END LOOP;
    END IF;

    -- 2. Handle Generic Comment Notification (with Grouping)
    -- Notify Assignee if they are not the commenter AND they weren't just mentioned (to avoid double notif)
    -- Simplifying: If you are mentioned, you get a MENTION notification.
    -- If you are assignee and NOT mentioned, you get a COMMENT notification.
    
    IF v_task_assignee_id IS NOT NULL AND v_task_assignee_id != auth.uid() THEN
         -- Check if assignee was already mentioned to avoid spam
         IF NOT (NEW.mentions @> ARRAY[v_task_assignee_id]) THEN
            
            -- Check for existing UNREAD comment notification for this task
            SELECT id, metadata->>'count' INTO v_existing_notif_id, v_cur_count
            FROM notifications
            WHERE user_id = v_task_assignee_id
              AND task_id = NEW.task_id
              AND type = 'COMMENT'
              AND is_read = FALSE
            LIMIT 1;

            IF v_existing_notif_id IS NOT NULL THEN
                -- Aggregate/Group
                v_cur_count := COALESCE(v_cur_count, 1) + 1;
                UPDATE notifications
                SET 
                    title = v_cur_count || ' novos comentários',
                    message = 'Existem ' || v_cur_count || ' novos comentários nesta tarefa.',
                    metadata = jsonb_build_object('count', v_cur_count),
                    created_at = now() -- Bump timestamp to top
                WHERE id = v_existing_notif_id;
            ELSE
                -- Create new
                INSERT INTO notifications (user_id, task_id, type, title, message, metadata)
                VALUES (
                    v_task_assignee_id,
                    NEW.task_id,
                    'COMMENT',
                    'Novo comentário',
                    'Fizeram um comentário na sua tarefa.',
                    '{"count": 1}'::jsonb
                );
            END IF;
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: New Comment
DROP TRIGGER IF EXISTS on_new_comment ON task_comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_comment();
