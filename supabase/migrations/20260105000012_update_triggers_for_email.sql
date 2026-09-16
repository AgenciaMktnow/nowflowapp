-- Refactor Triggers to call Edge Function
-- Note: This requires the pg_net extension to be enabled in Supabase

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to check if status is "returned" (moving to an earlier stage)
CREATE OR REPLACE FUNCTION is_status_returned(old_status TEXT, new_status TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    states TEXT[] := ARRAY['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE'];
    old_idx INT;
    new_idx INT;
BEGIN
    SELECT array_position(states, old_status) INTO old_idx;
    SELECT array_position(states, new_status) INTO new_idx;
    
    RETURN (old_idx IS NOT NULL AND new_idx IS NOT NULL AND new_idx < old_idx);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Unified Trigger Function for Email Notifications
CREATE OR REPLACE FUNCTION notify_edge_function()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT;
    v_last_comment TEXT;
    v_edge_url TEXT := 'https://mowxezzjmtjlzftpzdxf.supabase.co/functions/v1/send-notification'; -- Replace with actual URL if different
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
    -- We use net.http_post for async execution
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
                    'last_comment', v_last_comment,
                    'changed_by', auth.uid()
                )
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Unified Trigger
DROP TRIGGER IF EXISTS on_task_event_notify_email ON tasks;
CREATE TRIGGER on_task_event_notify_email
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_edge_function();

-- Comment Trigger
CREATE OR REPLACE FUNCTION notify_comment_edge_function()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://mowxezzjmtjlzftpzdxf.supabase.co/functions/v1/send-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.headers')::jsonb->>'authorization'
        ),
        body := jsonb_build_object(
            'type', 'task_commented',
            'data', jsonb_build_object(
                'task_id', NEW.task_id,
                'comment_id', NEW.id,
                'commenter_id', NEW.user_id
            )
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notify_email ON task_comments;
CREATE TRIGGER on_comment_notify_email
    AFTER INSERT ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_comment_edge_function();
