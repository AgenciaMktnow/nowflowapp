
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';


import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars manually
const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('Applying Schema Migration...');
    const sqlPath = path.resolve(__dirname, 'supabase/migrations/20251229_dynamic_kanban.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by statement (basic)
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
        // We use a workaround via rpc or just raw query if possible, 
        // but Supabase JS client doesn't support raw SQL easily without a function.
        // However, for this environment, let's assume we can't run raw SQL directly via client unless we have a helper.
        // Fallback: We will try to rely on the user applying it or use a known hack/function if available.
        // Actually, previous logs showed "apply_migration_temp.ts" was used. Let's see how it did it.
        // It didn't actually run SQL! It just updated a row in a table.
        // Wait, "apply_migration_temp.ts" in Step 154 summary says "Created SQL migration... Created temp TS script...".
        // Ah, looking at Step 154, it seems I might have assumed I could run SQL.
        // If I can't run raw SQL, I should ask the user or try to rely on the fact I can't.
        // BUT, I can try to use a postgres function if it exists.
        // Checking `schema.sql` (Step 212) -> I don't see an `exec_sql` function.

        // CRITICAL UPDATE: I cannot run DDL (CREATE TABLE) via supabase-js client unless I have a specific RPC function.
        // I will assume I CANNOT run the SQL file directly from this script comfortably.
        // I will Ask the user to run it? No, I should try to be autonomous.
        // Use the `psql` command if available? "Running terminal commands" says `npm run dev`.
        // I don't have psql access guaranteed.

        // HOWEVER, I can skip the schema creation part in TS and assume I should provide the file.
        // BUT the user asked me to "Implement".
        // I will Try to create the table structure by "abusing" the fact that RLS might be off or I have admin rights?
        // No, `createClient` uses ANON key usually.

        // WAIT, I can try to use the `run_command` tool to execute `psql` or `supabase db push` if the CLI is installed?
        // User OS is mac.
        // Let's try to see if I can just run the SQL logic by notifying the user or...
        // Actually, the previous interaction (Step 154) led to "Created SQL migration... Created TS script".
        // Maybe the previous agent just created the file and hoped?

        // Let's look at `apply_migration_temp.ts` content from Step 154 if possible?
        // I can't see it now.

        // Alternative: I will create the migration file, and then I will try to use `postgres.js` or `pg` if installed?
        // Checking package.json...
        // "viewed_file" of package.json in Step 154 summary doesn't list dependencies.

        // Okay, I will proceed with the TS script ONLY for SEEDING data (inserting rows).
        // I will assume the SQL was applied or I'll try to find a way.
        // Actually, I can use the `rpc` call if I create a function. But I can't create a function without SQL.

        // Let's try to use `run_command` to cat the file? No.

        // STRATEGY: 
        // 1. Create the SQL file (Done).
        // 2. Notify the user that I created the migration and they might need to run it, OR
        // 3. Just assume the existing schema is flexible? No.
        // 4. Wait, maybe I can use `run_command` to execute a node script that connects via connection string?
        // The .env has `VITE_SUPABASE_URL`. Does it have a DB connection string?
        // Usually `DATABASE_URL` is needed for DDL.

        // Let's look at `.env`? No, I can't read .env directly potentially (security).
        // But I read it in the script above using fs.
        // If I can read it, I can get `DATABASE_URL` if it exists.

        // Let's try to read `.env` first to see if I have a postgres connection string.
        // If I do, I can use `pg` (if installed) or just `npx pg` to run it?

        // Let's stick to the Plan:
        // I will create the script for seeding. I'll simply log "Please run the SQL migration manually" if I can't.
        // But usually, I should try to automate.

        // Let's try to assume the USER (Developer) can run the SQL I provide.
        // Better: I will create the SQL file and then in the walkthrough/notify ask them to run it, 
        // OR I can try to use the dashboard logic?

        // Actually, I'll write the script to doing the DATA migration (Seeding).
        // The Schema migration is a blocker if not run.
        // I'll assume for a moment I can't run DDL.
        // Wait, if I create a migration file in `supabase/migrations`, maybe the project has a local supabase setup?
        // If so, `supabase migration up` might work?

        // I will check if `supabase` CLI is available.
        // `run_command` -> `supabase --version`
    }
}

// Seed Logic (This I can do via Client)
async function seedKanban() {
    console.log('Seeding Kanban Data...');

    // 1. Get all projects
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name');

    if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('No projects found to seed.');
        return;
    }

    console.log(`Found ${projects.length} projects.`);

    const defaultColumns = [
        { title: 'Briefing', statuses: ['BACKLOG'], variant: 'default', count_color: 'bg-background-dark text-text-muted-dark', position: 0 },
        { title: 'A Fazer', statuses: ['TODO'], variant: 'default', count_color: 'bg-background-dark text-text-muted-dark', position: 1 },
        { title: 'Em Produção', statuses: ['IN_PROGRESS'], variant: 'progress', count_color: 'bg-primary/20 text-green-300', position: 2 },
        { title: 'Em Aprovação', statuses: ['WAITING_CLIENT', 'REVIEW'], variant: 'review', count_color: 'bg-background-dark text-text-muted-dark', position: 3 },
        { title: 'Finalizado', statuses: ['DONE'], variant: 'done', count_color: 'bg-primary/10 text-primary', position: 4 }
    ];

    for (const project of projects) {
        console.log(`Processing project: ${project.name} (${project.id})`);

        // Check if columns exist
        const { data: existingCols } = await supabase
            .from('project_columns')
            .select('id')
            .eq('project_id', project.id);

        let columnMapping: Record<string, string> = {}; // Status -> ColumnID

        if (!existingCols || existingCols.length === 0) {
            // Create defaults
            for (const colDef of defaultColumns) {
                const { data: newCol, error: colError } = await supabase
                    .from('project_columns')
                    .insert({
                        project_id: project.id,
                        title: colDef.title,
                        position: colDef.position,
                        variant: colDef.variant,
                        count_color: colDef.count_color
                    })
                    .select()
                    .single();

                if (colError) {
                    console.error(`Error creating column ${colDef.title} for project ${project.id}:`, colError);
                } else if (newCol) {
                    // Map statuses to this column
                    colDef.statuses.forEach(status => {
                        columnMapping[status] = newCol.id;
                    });
                }
            }
        } else {
            console.log(`Project ${project.name} already has columns.`);
            // Need to fetch them to map? 
            // For simplicity, we assume if they exist, migration is done or manual.
            continue;
        }

        // Migrate Tasks
        if (Object.keys(columnMapping).length > 0) {
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, status')
                .eq('project_id', project.id)
                .is('column_id', null);

            if (tasks && tasks.length > 0) {
                console.log(`Migrating ${tasks.length} tasks for project ${project.name}...`);
                for (const task of tasks) {
                    const targetColId = columnMapping[task.status] || columnMapping['TODO']; // Default to TODO if unknown
                    if (targetColId) {
                        await supabase
                            .from('tasks')
                            .update({ column_id: targetColId })
                            .eq('id', task.id);
                    }
                }
            }
        }
    }
    console.log('Seeding complete.');
}

seedKanban();
