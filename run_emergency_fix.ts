import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyFix() {
    console.log('--- STARTING EMERGENCY FIX ---');

    // 1. Find or Create Board 'Neto'
    let boardId = '';
    const { data: boards } = await supabase.from('boards').select('id').eq('name', 'Neto').single();

    if (boards) {
        boardId = boards.id;
        console.log(`Found existing Board 'Neto': ${boardId}`);
    } else {
        console.log("Board 'Neto' not found. Creating...");
        const { data: newBoard, error: bError } = await supabase
            .from('boards')
            .insert([{ name: 'Neto', color: 'bg-blue-600', description: 'Emergency Board' }])
            .select()
            .single();

        if (bError) {
            console.error('CRITICAL: Failed to create board:', bError);
            return;
        }
        boardId = newBoard.id;
        console.log(`Created Board 'Neto': ${boardId}`);
    }

    // 2. Link Orphan Projects to Board
    const { data: projects } = await supabase.from('projects').select('id, name, board_id, team_id');

    if (projects) {
        const orphanProjects = projects.filter(p => !p.board_id);
        console.log(`Found ${orphanProjects.length} projects without Board.`);

        for (const p of orphanProjects) {
            const { error } = await supabase.from('projects').update({ board_id: boardId }).eq('id', p.id);
            if (error) console.error(`Failed to update project ${p.name}:`, error);
            else console.log(`Linked project '${p.name}' to Board 'Neto'`);
        }
    }

    // 3. Link Orphan Projects to First Team (if any)
    const { data: teams } = await supabase.from('teams').select('id, name').limit(1);
    if (teams && teams.length > 0) {
        const teamId = teams[0].id;
        const teamName = teams[0].name;
        console.log(`Using Team '${teamName}' (${teamId}) for link fix.`);

        const orphanTeamProjects = projects?.filter(p => !p.team_id) || [];
        console.log(`Found ${orphanTeamProjects.length} projects without Team.`);

        for (const p of orphanTeamProjects) {
            const { error } = await supabase.from('projects').update({ team_id: teamId }).eq('id', p.id);
            if (error) console.error(`Failed to update project ${p.name} with team:`, error);
            else console.log(`Linked project '${p.name}' to Team '${teamName}'`);
        }
    } else {
        console.warn('No teams found to link projects to.');
    } // End Team Link

    console.log('--- EMERGENCY FIX COMPLETE ---');
}

emergencyFix();
