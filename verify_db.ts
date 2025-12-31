
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking client_projects table...');

    // Try to select from the table
    const { data, error } = await supabase
        .from('client_projects')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing table:', error);
    } else {
        console.log('Table exists and is accessible. Rows found:', data?.length ?? 0);
    }
}

checkTable();
