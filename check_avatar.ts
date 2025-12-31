
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserAvatar() {
    console.log("--- Checking 'users' columns ---");

    // Check avatar_url
    const { error } = await supabase
        .from('users')
        .select('avatar_url')
        .limit(1);

    if (error) {
        console.log("❌ 'avatar_url' column might be missing:", error.message);
    } else {
        console.log("✅ 'avatar_url' column exists.");
    }
}

checkUserAvatar();
