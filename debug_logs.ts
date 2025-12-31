
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log("Checking active time logs...");

    // Test the exact query used in Dashboard.tsx
    const { data: logs, error } = await supabase
        .from('time_logs')
        .select(`
            task_id,
            user:users!time_logs_user_id_fkey(full_name)
        `)
        .is('end_time', null);

    if (error) {
        console.error("Query Error:", error);

        // Try fallback query without explicit FK constraint name to see if that's the issue
        console.log("Trying fallback query...");
        const { data: fallbackLogs, error: fallbackError } = await supabase
            .from('time_logs')
            .select(`
                task_id,
                user:users(full_name)
            `)
            .is('end_time', null);

        if (fallbackError) {
            console.error("Fallback Query Error:", fallbackError);
        } else {
            console.log("Fallback Query Success:", fallbackLogs);
        }

    } else {
        console.log("Query Success:", JSON.stringify(logs, null, 2));
    }
}

checkLogs();
