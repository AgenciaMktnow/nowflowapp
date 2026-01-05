
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

const migrations = [
    'supabase/migrations/20260105_project_hierarchy_integrity.sql',
    'supabase/migrations/20260105_add_client_default_team.sql',
    'supabase/migrations/emergency_fix_user_creation.sql'
];

async function runMigrations() {
    for (const migrationPath of migrations) {
        const fullPath = path.resolve(process.cwd(), migrationPath);
        if (!fs.existsSync(fullPath)) {
            console.log(`Skipping ${migrationPath} (file not found)`);
            continue;
        }

        let sql = fs.readFileSync(fullPath, 'utf8');
        console.log(`--- EXECUTING MIGRATION: ${migrationPath} ---`);

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error(`FAILED: ${migrationPath}`, error);
        } else {
            console.log(`SUCCESS: ${migrationPath}`);
        }
    }
}

runMigrations();
