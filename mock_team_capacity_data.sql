
-- 1. Create a Team (Removed description column as it does not exist)
INSERT INTO teams (name) 
VALUES ('Equipe de Desenvolvimento') 
ON CONFLICT DO NOTHING;

-- 2. Assign User to Team (First User found)
-- We need to get the ID correctly. Explicit subquery is safer.
WITH target_team AS (
    SELECT id FROM teams WHERE name = 'Equipe de Desenvolvimento' LIMIT 1
),
target_user AS (
    SELECT id FROM users LIMIT 1
)
INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id
FROM target_user u, target_team t
ON CONFLICT DO NOTHING;

-- 3. Update User Capacity to 20h for testing utilization bar
UPDATE users 
SET weekly_capacity_hours = 20 
WHERE id = (SELECT id FROM users LIMIT 1);
