-- EMERGENCY FIX: Create Board 'Neto' and Link Projects
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
    v_board_id UUID;
    v_team_id UUID;
BEGIN
    -- 1. Create Board 'Neto' if not exists
    SELECT id INTO v_board_id FROM public.boards WHERE name = 'Neto';
    
    IF v_board_id IS NULL THEN
        INSERT INTO public.boards (name, color, description)
        VALUES ('Neto', 'bg-blue-600', 'Quadro Principal')
        RETURNING id INTO v_board_id;
        RAISE NOTICE 'Created Board Neto: %', v_board_id;
    ELSE
        RAISE NOTICE 'Board Neto already exists: %', v_board_id;
    END IF;

    -- 2. Link Orphans Projects (No Board) to this Board
    UPDATE public.projects
    SET board_id = v_board_id
    WHERE board_id IS NULL;
    
    RAISE NOTICE 'Linked orphan projects to Board Neto';

    -- 3. Link Orphans (No Team) to First Available Team
    SELECT id INTO v_team_id FROM public.teams LIMIT 1;
    
    IF v_team_id IS NOT NULL THEN
        UPDATE public.projects
        SET team_id = v_team_id
        WHERE team_id IS NULL;
        RAISE NOTICE 'Linked orphan projects to Team ID: %', v_team_id;
    ELSE
        RAISE NOTICE 'No teams found to link.';
    END IF;

END $$;
