import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        console.log('Running Check-Deadlines Job...')

        // Logic: Find tasks due within next 26 hours (buffer) that haven't been warned
        // We look a bit ahead (26h) to ensure we catch them around the 24h mark even if cron drifts
        // Condition: due_date < now + 26h AND due_date > now AND warning_sent = false

        // Note: If due_date is just DATE (not timestamp), comparisons might need adjustment.
        // Assuming timestamptz or similar. If DATE, it defaults to 00:00.

        const now = new Date()
        const alertThreshold = new Date(now.getTime() + (26 * 60 * 60 * 1000)).toISOString()
        const pastThreshold = new Date(now.getTime()).toISOString() // Don't alert for already overdue in this specific sweep? Or should we?
        // Let's stick to "Approaching Deadline" logic.

        const { data: tasks, error } = await supabaseClient
            .from('tasks')
            .select('id, title, assignee_id, created_by, due_date')
            .eq('deadline_warning_sent', false)
            .neq('status', 'DONE')
            .lt('due_date', alertThreshold)
            .gt('due_date', pastThreshold)
            .not('assignee_id', 'is', null)

        if (error) throw error

        console.log(`Found ${tasks?.length || 0} tasks approaching deadline.`)

        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                // 1. Notify Assignee
                if (task.assignee_id) {
                    await supabaseClient.from('notifications').insert({
                        user_id: task.assignee_id,
                        task_id: task.id,
                        type: 'MOVEMENT', // Re-using MOVEMENT or generic, but let's use Metadata to denote Urgency if possible, or just a custom Title
                        // Actually, 'MOVEMENT' type maps to task_status_changed usually.
                        // Should we add a new type 'DEADLINE'? 
                        // To avoid breaking enum, let's use 'MOVEMENT' but with Custom Title provided by Trigger logic? 
                        // Wait, we are inserting DIRECTLY into notifications.
                        // The Edge Function `send-notification` handles 'ASSIGNMENT', 'MOVEMENT', 'COMMENT', 'MENTION'.
                        // If I insert 'MOVEMENT', `send-notification` will trigger email 'task_status_changed' -> 'O status mudou...'.
                        // THAT IS BAD. It will say "Status mudou: [NULL]" or similar.

                        // FIX: `send-notification` detects "Aguardando" and "✅" in title.
                        // I should add detection for "⏳" or "Prazo" in `send-notification` OR add 'DEADLINE' to DB enum.
                        // Adding to DB Enum requires migration. 
                        // Let's use 'MENTION' type strictly for triggering "generic" attention? No, confusing.
                        // Let's use 'MOVEMENT' but relies on `send-notification` update I just made? 
                        // I didn't add DEADLINE support there yet. `send-notification` handles `task_status_changed`.

                        // Quick Fix: I will update `send-notification` to handle "⏳" title as a deadline alert.
                        // And here I insert with title "⏳ Prazo Próximo".

                        title: '⏳ Prazo Próximo (24h)',
                        message: 'Esta tarefa vence em menos de 24 horas.',
                        metadata: { context: 'Por favor, verifique o andamento.' }
                    })
                }

                // 2. Notify Creator (if diff)
                if (task.created_by && task.created_by !== task.assignee_id) {
                    await supabaseClient.from('notifications').insert({
                        user_id: task.created_by,
                        task_id: task.id,
                        type: 'MOVEMENT',
                        title: '⏳ Prazo Próximo (24h)',
                        message: `A tarefa "${task.title}" vence amanhã.`,
                        metadata: { context: 'Notificação automática de acompanhamento.' }
                    })
                }

                // 3. Update Flag
                await supabaseClient
                    .from('tasks')
                    .update({ deadline_warning_sent: true })
                    .eq('id', task.id)
            }
        }

        return new Response(JSON.stringify({ processed: tasks?.length || 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Error in check-deadlines:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
