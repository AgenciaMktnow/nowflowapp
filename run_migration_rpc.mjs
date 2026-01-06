
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser
const envPath = path.resolve(process.cwd(), '.env');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
    console.error('Could not read .env file');
}

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/add_entry_category_to_time_logs.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('--- EXECUTING MIGRATION ---');
    console.log(sql);

    // Try exec_sql RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('RPC Failed:', error);

        // Fallback: Check if column exists via RPC/Query? No, we can't.
        // If RPC failed, likely function not found or permission denied.
    } else {
        console.log('Migration applied successfully via RPC!');
    }
}

runMigration();
