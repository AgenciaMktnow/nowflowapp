
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
    console.log("Checking columns...");
    // Try to insert a dummy log with description
    const { error } = await supabase
        .from('time_logs')
        .select('description')
        .limit(1);

    if (error) {
        console.log("Column 'description' likely DOES NOT exist. Error:", error.message);
    } else {
        console.log("Column 'description' EXISTS.");
    }
}
run();
