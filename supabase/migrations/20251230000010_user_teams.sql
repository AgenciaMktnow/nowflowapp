-- Create user_teams junction table
CREATE TABLE IF NOT EXISTS user_teams (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, team_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team_id ON user_teams(team_id);

-- Explicitly enable RLS
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and Managers can manage team assignments
CREATE POLICY "Admins and Managers can manage user_teams" ON user_teams
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role = 'ADMIN' OR users.role = 'MANAGER')
        )
    );

-- Policy: Users can view their own team assignments
CREATE POLICY "Users can view their own teams" ON user_teams
    FOR SELECT
    USING (
        auth.uid() = user_id
    );

-- Optional: Migrate existing data (if applicable and strictly desired, but might be safer to let user do it manually or logic in app)
-- INSERT INTO user_teams (user_id, team_id)
-- SELECT u.id, t.id
-- FROM users u
-- JOIN teams t ON u.team = t.name
-- WHERE u.team IS NOT NULL
-- ON CONFLICT DO NOTHING;
