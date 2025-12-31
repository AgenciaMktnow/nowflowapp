
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
    console.log("Debugging Task #60965 logs...");

    // Fetch the task ID first to be sure
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('task_number', 60965)
        .single();

    if (taskError || !task) {
        console.error("Task #60965 not found!", taskError);
        // Try to fetch ANY task with logs to see if DB is working
        const { data: anyLog } = await supabase.from('time_logs').select('id').limit(1);
        console.log("Any logs in DB?", anyLog?.length);
        return;
    }

    console.log(`Task Found: ${task.title} (${task.id})`);

    // Fetch ALL logs for this task
    const { data: logs, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('task_id', task.id)
        .order('start_time', { ascending: true });

    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }

    console.log(`Found ${logs?.length} logs for this task.`);

    let totalSec = 0;
    logs?.forEach((log: any) => {
        console.log(`\nLog ID: ${log.id}`);
        console.log(`  Type: ${log.is_manual ? 'MANUAL' : 'TIMER'}`);
        console.log(`  Start: ${log.start_time}`);
        console.log(`  End:   ${log.end_time}`);
        console.log(`  Duration (sec): ${log.duration_seconds}`);

        if (log.duration_seconds === null) console.warn("  WARNING: Duration is NULL");

        totalSec += (log.duration_seconds || 0);
    });

    console.log(`\n Calculated Total: ${(totalSec / 3600).toFixed(4)}h`);

    // Check 2.0h user claim
    // 2h 3m 21s = 7401 seconds.
    // 2h = 7200 seconds.
}

run();
