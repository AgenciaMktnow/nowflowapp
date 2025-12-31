
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mowxezzjmtjlzftpzdxf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd3hlenpqbXRqbHpmdHB6ZHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDQ1MzMsImV4cCI6MjA4MTUyMDUzM30.0aqLw4hIZO3ZojzbOdg9_kbQtw27EZR8owlEZlyXhks';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTask() {
    console.log('--- Fetching Task #10 Data ---');
    const { data: task, error } = await supabase
        .from('tasks')
        .select(`
            *,
            project:projects(*),
            assignee:users!tasks_assignee_id_fkey(full_name)
        `)
        .eq('task_number', 10)
        .single();

    if (error) {
        console.error('Error fetching task:', error);
        return;
    }

    console.log('Task Title:', task.title);

    if (task.project) {
        console.log('Project Found:', task.project.name);
        console.log('Project Client ID:', task.project.client_id);

        if (task.project.client_id) {
            const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('id', task.project.client_id)
                .single();

            console.log('Client Found via ID:', client?.name || 'NOT FOUND');
        } else {
            console.log('WARNING: Project has NO Client ID.');

            // Search if there is a 'Client 1' or similar in the DB to suggest a link
            const { data: clients } = await supabase.from('clients').select('id, name');
            console.log('Available Clients in DB:', clients?.map(c => c.name));

            // Search if project name suggests a client?
            // "Manutenção Preventiva" is generic.
        }
    } else {
        console.log('WARNING: Task has NO Project linked.');
    }
}

checkTask();
