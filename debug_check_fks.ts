
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFKs() {
    const { data, error } = await supabase.rpc('get_table_fks', { table_name: 'projects' });

    if (error) {
        // Fallback: query information_schema if rpc is not available
        const { data: qData, error: qError } = await supabase
            .from('projects')
            .select(`
                id,
                client_id,
                board_id,
                team_id
            `)
            .limit(1);

        console.log('Columns in projects:', qData ? Object.keys(qData[0]) : 'error/empty');
        console.log('Query Error (expected if empty):', qError?.message);

        console.log('\nChecking information_schema via SQL (requires custom RPC or direct query if enabled)...');
        // Since I cannot run raw SQL easily without RPC, I'll rely on what I saw in schema.sql and migrations.
    } else {
        console.log('FKs for projects:', data);
    }
}

checkFKs();
