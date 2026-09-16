-- Function to atomically stop active timer and start a new one
-- Prevents race conditions that cause duplicate running timers

CREATE OR REPLACE FUNCTION start_task_timer(
    p_task_id UUID,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_new_log JSONB;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Stop any currently active timer for this user
    -- Also calculates duration_seconds based on server time for accuracy
    UPDATE time_logs
    SET 
        end_time = v_now,
        duration_seconds = EXTRACT(EPOCH FROM (v_now - start_time))::INTEGER
    WHERE user_id = p_user_id 
    AND end_time IS NULL;

    -- 2. Start new timer
    INSERT INTO time_logs (task_id, user_id, start_time, is_manual, entry_category)
    VALUES (p_task_id, p_user_id, v_now, false, 'TIMER')
    RETURNING to_jsonb(time_logs.*) INTO v_new_log;

    -- 3. Update task status if not already (Optional but good for consistency)
    -- We only switch to IN_PROGRESS. We don't overwrite if it's already 'DONE' or something? 
    -- Usually starting a timer implies work is in progress.
    UPDATE tasks
    SET status = 'IN_PROGRESS'
    WHERE id = p_task_id 
    AND status != 'IN_PROGRESS';

    RETURN v_new_log;
END;
$$ LANGUAGE plpgsql;
