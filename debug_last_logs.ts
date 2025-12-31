
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
    console.log("Fetching last 50 time logs...");

    // Fetch logs descending
    const { data: logs, error } = await supabase
        .from('time_logs')
        .select(`
            id,
            start_time,
            end_time,
            duration_seconds,
            is_manual,
            task:tasks(id, title, task_number),
            user:users(full_name)
        `)
        .order('start_time', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${logs?.length} logs.`);

    // Filter for today/recent to spot the "2h 02m" entry
    const interestingLogs = logs?.filter(l =>
        (l.task && l.task.task_number === 60965) ||
        (l.duration_seconds && l.duration_seconds > 7000)
    );

    console.log(`\n--- Potential Matches for User Issue ---`);
    interestingLogs?.forEach((log: any) => {
        console.log(`\n[${log.is_manual ? 'MANUAL' : 'TIMER'}] Task #${log.task?.task_number}`);
        console.log(`  User: ${log.user?.full_name}`);
        console.log(`  Start: ${log.start_time}`);
        console.log(`  Duration: ${log.duration_seconds}s (${(log.duration_seconds / 3600).toFixed(2)}h)`);
        console.log(`  End: ${log.end_time}`);
    });

}

run();
