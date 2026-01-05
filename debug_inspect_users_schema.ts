import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function inspectUsersTable() {
    console.log('--- Inspecting public.users Table ---');

    // Try to use Information Schema via a dynamic query if possible
    // Since we can't run raw SQL easily via client, we use a trick:
    // We try to insert a dummy record with a missing required field (except id/email)
    // or we try to select and look at the first record.

    try {
        // 1. Get raw structure if possible (requires a specific RPC or permissive policy)
        console.log('Attempting to fetch one record to see all column names...');
        const { data, error } = await supabase.from('users').select('*').limit(1);

        if (error) {
            console.error('Error selecting from users:', error.message, error.code);
        } else if (data && data.length > 0) {
            console.log('Columns found in users:', Object.keys(data[0]));
            console.log('Sample record:', data[0]);
        } else {
            console.log('Users table is empty. Cannot detect columns via SELECT.');
        }

        // 2. Check Role Constraint specifically
        console.log('\nTesting "OPERATIONAL" role insert (this should fail if constraint is old)...');
        // We use a fake UUID to not conflict
        const testId = '00000000-0000-0000-0000-000000000000';
        const { error: insertError } = await supabase.from('users').insert([{
            id: testId,
            email: 'test_role@debug.com',
            full_name: 'Test Role',
            role: 'OPERATIONAL'
        }]);

        if (insertError) {
            console.log('Insert with OPERATIONAL role failed as expected if constraint is missing:');
            console.log('Error Message:', insertError.message);
            console.log('Error Code:', insertError.code);
            console.log('Error Hint:', insertError.hint);
        } else {
            console.log('Insert with OPERATIONAL role succeeded! Constraint is correct.');
            // Cleanup
            await supabase.from('users').delete().eq('id', testId);
        }

    } catch (err) {
        console.error('Unexpected error during inspection:', err);
    }
}

inspectUsersTable();
