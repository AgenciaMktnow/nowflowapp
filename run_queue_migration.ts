
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv'; // Assuming dotenv is available or manual parse

// Try to load .env
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envConfig = dotenv.config({ path: envPath }).parsed;
    if (envConfig) {
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    console.log("Dotenv load failed, relying on keys in file or process");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or Service Key if available

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sqlPath = path.join(process.cwd(), 'add_queue_position.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL via exec_sql...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration Failed:', error.message);
        console.log('PLEASE RAN THIS SQL MANUALLY IN SUPABASE DASHBOARD SQL EDITOR:');
        console.log(sql);
    } else {
        console.log('Migration Success!');
    }
}

run();
