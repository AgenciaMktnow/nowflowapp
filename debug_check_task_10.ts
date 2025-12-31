
import { supabase } from './src/lib/supabase';

async function checkTask10() {
    console.log('Checking Task #10...');

    // Find task #10
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, due_date, start_date, created_at')
        .eq('task_number', 10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (tasks && tasks.length > 0) {
        console.log('Task #10 Data:', tasks[0]);
    } else {
        console.log('Task #10 not found.');
    }
}

checkTask10();
