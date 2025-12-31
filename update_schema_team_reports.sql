-- Add 'team' column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;

-- Add 'is_manual' column to time_logs table if it doesn't exist
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- Optional: Create an index on team for performance if filtering becomes frequent
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);
