-- Add description column to time_logs table
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS description TEXT;
