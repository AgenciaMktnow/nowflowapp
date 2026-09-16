-- Add default_board_id to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'default_board_id') THEN
        ALTER TABLE clients ADD COLUMN default_board_id UUID REFERENCES boards(id);
    END IF;
END $$;
