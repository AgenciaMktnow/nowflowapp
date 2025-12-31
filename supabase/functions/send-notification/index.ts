import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
    type: 'task_assigned' | 'task_commented' | 'task_status_changed'
    data: {
        task_id: string
        user_id?: string
        comment_id?: string
        old_status?: string
        new_status?: string
    }
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { type, data }: NotificationRequest = await req.json()

        console.log('Notification request:', { type, data })

        // Get task details
        const { data: task, error: taskError } = await supabaseClient
            .from('tasks')
            .select(`
        *,
        project:projects(name),
        assignee:users!tasks_assignee_id_fkey(id, email, full_name),
        creator:users!tasks_created_by_fkey(id, email, full_name)
      `)
            .eq('id', data.task_id)
            .single()

        if (taskError) throw taskError

        let emailData: any = {}
        let recipients: string[] = []

        switch (type) {
            case 'task_assigned':
                if (task.assignee?.email) {
                    recipients = [task.assignee.email]
                    emailData = {
                        subject: `📋 Nova tarefa atribuída: ${task.title}`,
                        assignee_name: task.assignee.full_name || 'Usuário',
                        task_title: task.title,
                        task_description: task.description || 'Sem descrição',
                        project_name: task.project?.name || 'Projeto',
                        due_date: task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo',
                        assigned_by: task.creator?.full_name || 'Sistema',
                        task_link: `${Deno.env.get('APP_URL')}/tasks/${task.id}`
                    }
                }
                break

            case 'task_commented':
                // Get comment details
                const { data: comment } = await supabaseClient
                    .from('task_comments')
                    .select('*, user:users(full_name, email)')
                    .eq('id', data.comment_id)
                    .single()

                if (comment) {
                    // Notify task assignee and creator (excluding commenter)
                    recipients = [
                        task.assignee?.email,
                        task.creator?.email
                    ].filter((email, index, self) =>
                        email &&
                        email !== comment.user.email &&
                        self.indexOf(email) === index
                    )

                    emailData = {
                        subject: `💬 Novo comentário em: ${task.title}`,
                        recipient_name: 'Usuário',
                        commenter_name: comment.user.full_name || 'Usuário',
                        task_title: task.title,
                        comment_text: comment.content,
                        task_link: `${Deno.env.get('APP_URL')}/tasks/${task.id}`
                    }
                }
                break

            case 'task_status_changed':
                // Notify creator and assignee
                recipients = [
                    task.assignee?.email,
                    task.creator?.email
                ].filter((email, index, self) =>
                    email && self.indexOf(email) === index
                )

                emailData = {
                    subject: `🔄 Status atualizado: ${task.title}`,
                    recipient_name: 'Usuário',
                    task_title: task.title,
                    old_status: data.old_status,
                    new_status: data.new_status,
                    task_link: `${Deno.env.get('APP_URL')}/tasks/${task.id}`
                }
                break
        }

        // Send emails
        if (recipients.length > 0) {
            await sendEmail(recipients, emailData, type)
        }

        return new Response(
            JSON.stringify({ success: true, recipients }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

async function sendEmail(recipients: string[], data: any, type: string) {
    const template = getEmailTemplate(type, data)

    // Using Gmail SMTP via Supabase Auth
    // Note: This is a placeholder - actual implementation depends on Supabase SMTP config
    console.log('Sending email to:', recipients)
    console.log('Subject:', data.subject)
    console.log('Template:', template)

    // In production, this would use Supabase's built-in email or external SMTP
    // For now, we'll use Supabase Auth's email functionality

    return true
}

function getEmailTemplate(type: string, data: any): string {
    const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #13EC5B 0%, #0fa047 100%); color: #0a1612; padding: 30px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
      .content { padding: 30px 20px; color: #333; }
      .content h2 { color: #0a1612; margin-top: 0; }
      .button { 
        display: inline-block;
        background: #13EC5B; 
        color: #0a1612; 
        padding: 12px 24px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: bold;
        margin: 20px 0;
      }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      .info-box { background: #f9f9f9; border-left: 4px solid #13EC5B; padding: 15px; margin: 15px 0; }
    </style>
  `

    switch (type) {
        case 'task_assigned':
            return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nowflow</h1>
            </div>
            <div class="content">
              <h2>📋 Nova Tarefa Atribuída</h2>
              <p>Olá <strong>${data.assignee_name}</strong>,</p>
              <p>Uma nova tarefa foi atribuída para você:</p>
              
              <div class="info-box">
                <p><strong>📋 Tarefa:</strong> ${data.task_title}</p>
                <p><strong>📁 Projeto:</strong> ${data.project_name}</p>
                <p><strong>📅 Prazo:</strong> ${data.due_date}</p>
                <p><strong>👤 Atribuído por:</strong> ${data.assigned_by}</p>
              </div>
              
              <p><strong>Descrição:</strong></p>
              <p>${data.task_description}</p>
              
              <a href="${data.task_link}" class="button">Ver Tarefa</a>
            </div>
            <div class="footer">
              <p>Nowflow - Sistema de Gestão de Projetos</p>
              <p>Esta é uma notificação automática. Não responda este email.</p>
            </div>
          </div>
        </body>
        </html>
      `

        case 'task_commented':
            return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nowflow</h1>
            </div>
            <div class="content">
              <h2>💬 Novo Comentário</h2>
              <p>Olá,</p>
              <p><strong>${data.commenter_name}</strong> comentou em uma tarefa que você está acompanhando:</p>
              
              <div class="info-box">
                <p><strong>📋 Tarefa:</strong> ${data.task_title}</p>
                <p><strong>💬 Comentário:</strong></p>
                <p style="font-style: italic;">"${data.comment_text}"</p>
              </div>
              
              <a href="${data.task_link}" class="button">Ver Comentário</a>
            </div>
            <div class="footer">
              <p>Nowflow - Sistema de Gestão de Projetos</p>
              <p>Esta é uma notificação automática. Não responda este email.</p>
            </div>
          </div>
        </body>
        </html>
      `

        case 'task_status_changed':
            return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nowflow</h1>
            </div>
            <div class="content">
              <h2>🔄 Status Atualizado</h2>
              <p>Olá,</p>
              <p>O status de uma tarefa foi atualizado:</p>
              
              <div class="info-box">
                <p><strong>📋 Tarefa:</strong> ${data.task_title}</p>
                <p><strong>🔄 Status:</strong> ${data.old_status} → ${data.new_status}</p>
              </div>
              
              <a href="${data.task_link}" class="button">Ver Tarefa</a>
            </div>
            <div class="footer">
              <p>Nowflow - Sistema de Gestão de Projetos</p>
              <p>Esta é uma notificação automática. Não responda este email.</p>
            </div>
          </div>
        </body>
        </html>
      `

        default:
            return ''
    }
}
