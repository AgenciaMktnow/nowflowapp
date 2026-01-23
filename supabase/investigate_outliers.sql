-- INVESTIGATE TASK 51 (or specific task) LOGS
-- Finding the logs that sum up to ~2620h (approx 9,432,000 seconds)

SELECT 
    id, 
    task_id, 
    duration_seconds, 
    start_time, 
    end_time, 
    created_at, 
    is_manual 
FROM time_logs 
WHERE duration_seconds > 86400 -- Look for logs > 24h
ORDER BY duration_seconds DESC;
