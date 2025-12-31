
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Starting Debug Report Simulation...");

    // Simulate "Today"
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    console.log(`Querying from ${startIso} to ${endIso}`);

    // Query mimicking report.service.ts
    let query = supabase
        .from('time_logs')
        .select(`
            id,
            start_time,
            end_time,
            duration_seconds,
            is_manual,
            user_id,
            task:tasks(
                 id, 
                 title,
                 task_number 
            )
        `)
        .gte('start_time', startIso)
        .lte('start_time', endIso)
        .not('duration_seconds', 'is', null);

    const { data: logs, error } = await query;

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log(`Found ${logs?.length} logs.`);

    if (!logs) return;

    // Filter for a specific scenario if needed, or just dump all relevant ones
    // We are looking for logs related to the task mentions (e.g. mix of manual and timer)

    // Group by Task
    const taskMap = new Map();

    logs.forEach((log: any) => {
        if (!log.task) return;
        const taskId = log.task.id;
        const title = log.task.title;

        if (!taskMap.has(taskId)) {
            taskMap.set(taskId, {
                title,
                taskNumber: log.task.task_number,
                timerSeconds: 0,
                manualSeconds: 0,
                totalSeconds: 0,
                logs: []
            });
        }

        const t = taskMap.get(taskId);
        t.logs.push({
            id: log.id,
            type: log.is_manual ? 'MANUAL' : 'TIMER',
            duration: log.duration_seconds,
            start: log.start_time
        });

        const dur = log.duration_seconds || 0;
        t.totalSeconds += dur;

        if (log.is_manual) {
            t.manualSeconds += dur;
        } else {
            t.timerSeconds += dur;
        }
    });

    // Print summary
    console.log("\n--- Task Summaries ---");
    taskMap.forEach((t) => {
        if (t.manualSeconds > 0 && t.timerSeconds > 0) {
            console.log(`\nTask [#${t.taskNumber}] ${t.title}`);
            console.log(`  Total: ${(t.totalSeconds / 3600).toFixed(4)}h (${t.totalSeconds}s)`);
            console.log(`  Timer: ${(t.timerSeconds / 3600).toFixed(4)}h (${t.timerSeconds}s)`);
            console.log(`  Manual: ${(t.manualSeconds / 3600).toFixed(4)}h (${t.manualSeconds}s)`);
            console.log(`  Logs:`, t.logs);
        } else if (t.manualSeconds > 0) {
            // Print specific interesting manual only tasks to see if they SHOULD have timer
            if (t.taskNumber == 60965) {
                console.log(`\n[TARGET FOUND] Task [#${t.taskNumber}] ${t.title}`);
                console.log(`  TIMERS MISSING? Only found manual.`);
                console.log(`  Logs:`, t.logs);
            }
        }
    });

}

run();
