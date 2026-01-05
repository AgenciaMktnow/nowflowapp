
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.log("Auth Admin error (typical for anon key):", authError.message);
        // Fallback: just query public.users
    }

    console.log("--- PUBLIC USERS ---");
    const { data: publicUsers, error: pubError } = await supabase
        .from('users')
        .select('*');

    if (pubError) {
        console.error("Error fetching public users:", pubError.message);
    } else {
        console.table(publicUsers);
    }
}

checkUser();
