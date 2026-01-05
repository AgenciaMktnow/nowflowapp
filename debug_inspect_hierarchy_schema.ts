
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const tables = ['boards', 'clients', 'projects', 'teams', 'users', 'user_teams'];

    for (const table of tables) {
        console.log(`--- Table: ${table} ---`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
            console.log(`Table ${table} is empty or columns not accessible.`);
        }
    }
}

inspectSchema();
