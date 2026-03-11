import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260226_update_super_admin_mauricio.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('--- EXECUTING MIGRATION ---');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('RPC Failed:', error);
    } else {
        console.log('Migration applied successfully via RPC!');
    }
}

runMigration();
