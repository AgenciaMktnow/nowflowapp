
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking 'projects' table columns...");
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

    if (projectsError) {
        console.error("Error fetching projects:", projectsError);
    } else if (projects && projects.length > 0) {
        console.log(" 'projects' keys:", Object.keys(projects[0]));
        if (Object.keys(projects[0]).includes('team_id')) {
            console.log("SUCCESS: 'team_id' exists in 'projects'.");
        } else {
            console.error("FAILURE: 'team_id' MISSING in 'projects'.");
        }
    } else {
        console.log("No projects found to inspect columns. Try inserting a dummy project to check?");
    }

    console.log("\nChecking 'teams' table...");
    const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .limit(1);

    if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        // If error is 404 relation not found, table likely missing
    } else {
        console.log(" 'teams' table exists. Count:", teams?.length || 0);
        if (teams && teams.length > 0) {
            console.log(" 'teams' keys:", Object.keys(teams[0]));
        }
    }
}

checkSchema();
