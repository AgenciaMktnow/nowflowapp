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

async function checkRelations() {
    console.log('--- Checking Projects Relations ---');
    const { data: projects, error: pError } = await supabase
        .from('projects')
        .select(`id, name, board_id, team_id, client_id`);

    if (pError) {
        console.error('Error fetching projects:', pError);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('No projects found.');
    } else {
        console.table(projects);

        const invalidProjects = projects.filter(p => !p.board_id || !p.team_id);
        if (invalidProjects.length > 0) {
            console.warn(`WARNING: ${invalidProjects.length} Projects are missing Board or Team IDs. This will cause filters to hide tasks for these projects.`);
        } else {
            console.log('All projects validly linked.');
        }
    }

    console.log('\n--- Checking Filter Existence ---');
    const { data: boards } = await supabase.from('boards').select('id, name');
    const { data: teams } = await supabase.from('teams').select('id, name');
    const { data: clients } = await supabase.from('clients').select('id, name');

    console.log(`Boards found: ${boards?.length}`);
    console.log(`Teams found: ${teams?.length}`);
    console.log(`Clients found: ${clients?.length}`);
}

checkRelations();
