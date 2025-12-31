
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
    console.error("Could not read .env file");
}

const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboardQuery() {
    console.log("Attempting Dashboard task query...");
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name, client_id),
                assignee:users!tasks_assignee_id_fkey(full_name, avatar_url),
                creator:users!tasks_created_by_fkey(id, full_name)
            `)
            .limit(5);

        if (error) {
            console.error("FAILED: Query returned error:", error);
        } else {
            console.log("SUCCESS: Query worked. Returned rows:", data?.length);
            // Log first row structure to check validity
            if (data && data.length > 0) {
                console.log("First row sample:", JSON.stringify(data[0], null, 2));
            }
        }
    } catch (e) { // Supabase client usually doesn't throw, but just in case
        console.error("CRITICAL: Query threw exception:", e);
    }
}

debugDashboardQuery();
