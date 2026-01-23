
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260116_simplify_rls_final.sql');

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`Read migration file from ${migrationPath}`);
        console.log(`Length: ${sql.length} characters`);

        console.log('Attempting to execute via RPC exec_sql...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('RPC exec_sql failed:', error);
            console.error('--- MANUAL ACTION REQUIRED ---');
            console.error('Please copy the content of supabase/migrations/20260116_simplify_rls_final.sql and run it in the Supabase SQL Editor.');
        } else {
            console.log('SUCCESS: Migration applied successfully via RPC.');
        }

    } catch (e) {
        console.error('Error reading or executing migration:', e);
    }
}

applyFix();
