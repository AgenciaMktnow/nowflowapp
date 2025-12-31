
-- Add weekly_capacity_hours to users table for Dynamic Utilization Reports
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_capacity_hours INTEGER DEFAULT 40;

-- Optional: Update existing users to have 40 by default if null (though DEFAULT handles new inserts)
UPDATE users SET weekly_capacity_hours = 40 WHERE weekly_capacity_hours IS NULL;
