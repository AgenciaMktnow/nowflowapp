-- Function to handle unique active timer per user
CREATE OR REPLACE FUNCTION handle_unique_active_timer()
RETURNS TRIGGER AS $$
BEGIN
    -- If a new timer is being started (end_time is NULL)
    IF NEW.end_time IS NULL THEN
        -- Close any existing active timer for this user
        -- We set end_time to NOW() and calculate duration
        UPDATE time_logs
        SET 
            end_time = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))
        WHERE 
            user_id = NEW.user_id 
            AND end_time IS NULL 
            AND id != NEW.id; -- Safety check to not update self if update trigger (though this is INSERT)
            
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run BEFORE INSERT on time_logs
DROP TRIGGER IF EXISTS enforce_unique_active_timer ON time_logs;
CREATE TRIGGER enforce_unique_active_timer
BEFORE INSERT ON time_logs
FOR EACH ROW
EXECUTE FUNCTION handle_unique_active_timer();
