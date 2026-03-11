import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // If the table is empty this won't show keys, so we'll just ask for the data
    const { data, error } = await supabase.from('tasks').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        if (data && data.length > 0) {
            fs.writeFileSync('task_keys.json', JSON.stringify(Object.keys(data[0])));
        } else {
            console.log("No data found to infer keys from.");
        }
    }
}

run();
