-- Migration: Sync Users 'team' column to 'user_teams' table
-- Run this in Supabase SQL Editor

-- 1. Ensure all Teams exist
INSERT INTO teams (name)
SELECT DISTINCT team 
FROM users 
WHERE team IS NOT NULL AND team != ''
AND team NOT IN (SELECT name FROM teams);

-- 2. Link Users to Teams
INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id
FROM users u
JOIN teams t ON t.name = u.team
WHERE u.team IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_teams ut WHERE ut.user_id = u.id AND ut.team_id = t.id
);

-- 3. Verify
SELECT t.name as team_name, COUNT(ut.user_id) as member_count
FROM teams t
LEFT JOIN user_teams ut ON ut.team_id = t.id
GROUP BY t.name;
