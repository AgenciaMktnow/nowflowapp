
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const userEmail = 'neto@mktnow.com.br';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceAdmin() {
    console.log(`Setting role 'ADMIN' for ${userEmail}...`);

    const { data, error } = await supabase
        .from('users')
        .update({ role: 'ADMIN' })
        .eq('email', userEmail)
        .select();

    if (error) {
        console.error("Error updating user role:", error.message);
        console.log("\nTIP: If RLS is enabled, you might need to run this SQL directly in Supabase Dashboard:");
        console.log(`UPDATE public.users SET role = 'ADMIN' WHERE email = '${userEmail}';`);
    } else {
        console.log("Success! User updated:");
        console.table(data);
    }
}

forceAdmin();
