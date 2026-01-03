import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySearchIndexes() {
    console.log('🚀 Starting search indexes creation...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'add_search_indexes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Split by semicolon to get individual statements
    const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
        // Extract index name for better logging
        const indexMatch = statement.match(/idx_\w+/);
        const indexName = indexMatch ? indexMatch[0] : 'unknown';

        try {
            console.log(`📊 Creating index: ${indexName}...`);

            const { error } = await supabase.rpc('exec_sql', {
                sql_string: statement + ';'
            });

            if (error) {
                // Check if error is because index already exists
                if (error.message?.includes('already exists')) {
                    console.log(`   ✓ ${indexName} already exists (skipped)`);
                    successCount++;
                } else {
                    throw error;
                }
            } else {
                console.log(`   ✅ ${indexName} created successfully`);
                successCount++;
            }
        } catch (error: any) {
            console.error(`   ❌ Failed to create ${indexName}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
        console.log('\n🎉 All search indexes created successfully!');
        console.log('💡 Your search queries will now be much faster.');
    } else {
        console.log('\n⚠️  Some indexes failed to create.');
        console.log('💡 You may need to create them manually in Supabase SQL Editor.');
    }
}

// Run the script
applySearchIndexes()
    .then(() => {
        console.log('\n✨ Script completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
