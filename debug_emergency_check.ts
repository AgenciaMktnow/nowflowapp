import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Checking Boards ---');
    const { data: boards } = await supabase.from('boards').select('id, name');
    console.table(boards);

    console.log('\n--- Checking User Table (for Team ID) ---');
    const { data: users, error: uError } = await supabase.from('users').select('*').limit(1);

    if (users && users.length > 0) {
        console.log('User sample keys:', Object.keys(users[0]));
    } else {
        console.log('No users found or error:', uError);
    }
}

checkData();
