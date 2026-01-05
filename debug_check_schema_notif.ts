import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkSchema() {
    console.log('--- Checking Database Schema ---');

    // Check users table columns
    console.log('Checking columns for "users" table...');
    const { data: userCols, error: userError } = await supabase.rpc('get_column_names', { table_name: 'users' });
    if (userError) {
        console.log('RPC get_column_names failed (might not exist). Trying direct select.');
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
            console.error('Error selecting from users:', error);
        } else if (data && data.length > 0) {
            console.log('Columns in users:', Object.keys(data[0]));
        } else {
            console.log('Users table is empty, cannot detect columns via select.');
        }
    } else {
        console.log('Columns in users:', userCols);
    }

    // Check user_notification_settings table
    console.log('\nChecking "user_notification_settings" table...');
    const { data: notifData, error: notifError } = await supabase.from('user_notification_settings').select('*').limit(1);
    if (notifError) {
        if (notifError.code === 'PGRST116') {
            console.log('Table exists but is empty.');
        } else {
            console.error('Error accessing user_notification_settings:', notifError.message, notifError.code);
        }
    } else {
        console.log('Table "user_notification_settings" exists and is accessible.');
    }

    // Check for any active triggers
    console.log('\nChecking for triggers (requires RPC or high permissions)...');
    // Usually requires more than anon key, but let's see.
}

checkSchema();
