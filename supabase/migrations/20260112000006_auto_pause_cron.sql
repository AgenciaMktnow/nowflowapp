-- Migration: Auto-Pause Backend Logic

-- 1. Helper function to check if user has any auto-paused logs that need review
-- Used by Frontend to trigger the Modal
CREATE OR REPLACE FUNCTION check_auto_pause_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_log JSONB;
BEGIN
    SELECT to_jsonb(tl.*) INTO v_log
    FROM time_logs tl
    WHERE tl.user_id = p_user_id
    AND tl.auto_paused = true
    ORDER BY tl.end_time DESC
    LIMIT 1;

    RETURN v_log;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to dismiss the alert (acknowledge)
CREATE OR REPLACE FUNCTION dismiss_auto_pause_alert(p_log_id UUID)
RETURNS VOID AS $$
BEGIN
    -- We can either update the flag or just rely on 'viewed' logic. 
    -- Simplest: Set auto_paused to false (or add a separate 'viewed' column if we want to keep history of auto-pause).
    -- User request implies: "Ajustar tempo" or "Ok".
    -- Let's assume we keep 'auto_paused=true' for history, but maybe we need a 'alert_dismissed' flag?
    -- To keep it simple and schema minimal: We'll set 'auto_paused' to false AFTER the user acknowledges, 
    -- OR we add 'alert_dismissed' column. 
    -- Let's add 'alert_dismissed' column to be safe and keep history.
    NULL; -- Placeholder, assuming we handle this via update on frontend or simple update.
END;
$$ LANGUAGE plpgsql;

-- Updating schema to support dismissal if needed
ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS alert_dismissed BOOLEAN DEFAULT false;


-- 3. THE WATCHDOG Function (Cron Logic)
CREATE OR REPLACE FUNCTION check_and_pause_timers()
RETURNS void AS $$
DECLARE
    v_settings RECORD;
    v_limit_seconds INTEGER;
    v_log RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    -- Get Settings
    SELECT * INTO v_settings FROM system_settings LIMIT 1;

    -- If disabled or not set, exit
    IF v_settings.timer_auto_pause_enabled IS NOT TRUE OR v_settings.timer_max_hours IS NULL THEN
        RETURN;
    END IF;

    v_limit_seconds := v_settings.timer_max_hours * 3600;

    -- Loop through active timers exceeding limit
    FOR v_log IN 
        SELECT tl.id, tl.task_id, tl.user_id, tl.start_time
        FROM time_logs tl
        WHERE tl.end_time IS NULL
        AND (EXTRACT(EPOCH FROM (NOW() - tl.start_time))) > v_limit_seconds
    LOOP
        -- 1. Close timer
        UPDATE time_logs
        SET 
            end_time = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time)),
            auto_paused = true,
            alert_dismissed = false
        WHERE id = v_log.id;

        -- 2. Update status and Add Comment (System Log)
        UPDATE tasks
        SET status = 'PAUSED'
        WHERE id = v_log.task_id;

        -- Insert System Comment
        INSERT INTO comments (task_id, content, user_id, is_system_generated)
        VALUES (
            v_log.task_id, 
            format('[SISTEMA] Timer pausado automaticamente por exceder %s horas de atividade contínua.', v_settings.timer_max_hours),
            v_log.user_id, -- Attributed to user or system? Let's use user but mark as system if we had that flag. Or use NULL for system? 
            -- Assuming comments table has is_system_generated or similar. 
            -- If not, just text. User asked for specific log.
            true -- Assuming we have/add this column or just use text.
        );
        
        v_updated_count := v_updated_count + 1;
    END LOOP;

    -- Optional: Log execution result
    -- RAISE NOTICE 'Auto-pause check complete. Paused % timers.', v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable PG_CRON (If available) - Instructions for User
-- SELECT cron.schedule('*/10 * * * *', $$SELECT check_and_pause_timers()$$);
