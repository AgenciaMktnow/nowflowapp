-- Function to calculate duration on update
CREATE OR REPLACE FUNCTION calculate_time_log_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- If end_time is being set (was null, now is not null) OR end_time changed
    IF (OLD.end_time IS NULL AND NEW.end_time IS NOT NULL) OR (NEW.end_time IS DISTINCT FROM OLD.end_time) THEN
        -- Calculate duration
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time));
    END IF;
    return NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run BEFORE UPDATE on time_logs
DROP TRIGGER IF EXISTS trg_calculate_duration ON time_logs;
CREATE TRIGGER trg_calculate_duration
BEFORE UPDATE ON time_logs
FOR EACH ROW
EXECUTE FUNCTION calculate_time_log_duration();
