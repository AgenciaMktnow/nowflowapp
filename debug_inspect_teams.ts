
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

async function inspectTeams() {
    console.log("--- TEAMS TABLE STRUCTURE (via query) ---");
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching teams:", error.message);
    } else {
        console.log("Teams table exists. Columns found in data:", data.length > 0 ? Object.keys(data[0]) : "Table empty, checking RPC or generic approach...");
    }
}

inspectTeams();
