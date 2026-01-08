import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'task_created' | 'task_assigned' | 'task_commented' | 'task_mentioned' | 'task_status_changed' | 'task_completed' | 'task_returned' | 'task_deadline_approaching' | 'test_email'
  data: {
    task_id: string
    user_id?: string
    comment_id?: string
    old_status?: string
    new_status?: string
    last_comment?: string
    changed_by?: string
    metadata?: any
  }
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

    const payload = await req.json()
    console.log('Incoming Payload:', JSON.stringify(payload))

    let type: NotificationRequest['type']
    let data: NotificationRequest['data']

    // DETECT SOURCE: Direct Call vs Webhook
    if (payload.record && payload.table === 'notifications') {
      const record = payload.record

      switch (record.type) {
        case 'ASSIGNMENT':
          type = 'task_assigned'
          break
        case 'MOVEMENT':
          if (record.title.includes('✅')) {
            type = 'task_completed'
          } else if (record.title.includes('Aguardando')) {
            type = 'task_returned'
          } else if (record.title.includes('⏳')) {
            type = 'task_deadline_approaching'
          } else {
            type = 'task_status_changed'
          }
          break
        case 'COMMENT':
          type = 'task_commented'
          break
        case 'MENTION':
          type = 'task_mentioned'
          break
        default:
          console.log('Skipping unknown notification type:', record.type)
          return new Response('Skipped unknown type', { status: 200 })
      }

      data = {
        task_id: record.task_id,
        user_id: record.user_id,
        new_status: record.message,
        metadata: record.metadata
      }

    } else {
      type = payload.type
      data = payload.data
    }

    console.log('Processing Email Logic:', { type, data })

    let task = null
    if (type !== 'test_email') {
      const { data: taskData, error: taskError } = await supabaseClient
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
      task = taskData
    }

    let recipientId = data.user_id
    if (!recipientId && (type === 'task_status_changed' || type === 'task_returned')) {
      recipientId = task?.assignee_id || task?.created_by
    }
    if (!recipientId && type === 'task_assigned') {
      recipientId = task?.assignee_id
    }

    if (!recipientId) return new Response('No recipient identified', { status: 200 })

    const { data: prefs } = await supabaseClient
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', recipientId)
      .single()

    const shouldNotify = checkPrefs(type, prefs)
    if (!shouldNotify) {
      console.log('User disabled notifications for type:', type)
      return new Response('Notification disabled by user', { status: 200 })
    }

    const { data: recipient } = await supabaseClient
      .from('users')
      .select('email, full_name')
      .eq('id', recipientId)
      .single()

    if (!recipient?.email) return new Response('Recipient email not found', { status: 200 })

    const { data: settings } = await supabaseClient
      .from('system_settings')
      .select('logo_dark_url')
      .single()

    let emailData: any = {
      subject: '',
      title: '',
      message: '',
      task_title: task?.title || 'Tarefa',
      project_name: task?.project?.name || 'Projeto',
      task_link: `${Deno.env.get('APP_URL')}/tasks/${task?.task_number}`,
      logo_url: settings?.logo_dark_url,
      recipient_name: recipient.full_name || 'Usuário'
    }

    // Extract Context from Metadata (e.g. Devolution Reason)
    const contextReason = data.metadata?.context || null;

    switch (type) {
      case 'task_created':
        emailData.subject = `✨ Nova tarefa criada: ${task.title}`
        emailData.title = '✨ Nova Tarefa Criada'
        emailData.message = `Uma nova tarefa foi adicionada ao projeto **${emailData.project_name}**.`
        break
      case 'task_assigned':
        emailData.subject = `📋 Nova tarefa atribuída: ${task.title}`
        emailData.title = '📋 Nova Tarefa Atribuída'
        emailData.message = 'Você foi definido como responsável por esta tarefa.'
        break
      case 'task_returned':
        emailData.subject = `🔄 Devolução/Pausa: ${task.title}`
        emailData.title = '🔄 Tarefa Devolvida'
        emailData.message = 'A tarefa aguarda ação do cliente ou revisão.'
        if (contextReason) emailData.context = `**Motivo/Contexto:** ${contextReason}`
        break
      case 'task_status_changed':
        emailData.subject = `🚀 Status atualizado: ${task.title}`
        emailData.title = '🚀 Status Atualizado'
        emailData.message = `O status da tarefa foi alterado para: **${task.status}**.`
        break
      case 'task_deadline_approaching':
        emailData.subject = `⏳ Prazo Próximo: ${task.title}`
        emailData.title = '⏳ Atenção ao Prazo'
        emailData.message = 'Esta tarefa vence em menos de 24 horas. Por favor, verifique.'
        if (contextReason) emailData.context = contextReason
        break
      case 'task_completed':
        emailData.subject = `✅ Missão Cumprida: ${task.title}`
        emailData.title = '✅ Missão Cumprida!'
        emailData.message = 'Parabéns! A tarefa foi concluída com sucesso.'
        if (contextReason) emailData.context = `**Obs:** ${contextReason}`
        break
      case 'task_mentioned':
        emailData.subject = `⚠️ Você foi mencionado: ${task.title}`
        emailData.title = '⚠️ Nova Menção'
        emailData.message = 'Você foi mencionado em um comentário nesta tarefa.'
        if (contextReason) emailData.context = `**Comentário:** "${contextReason}"`
        break
      case 'task_commented':
        // Metadata might contain count
        const count = data.metadata?.count || 1;
        emailData.subject = `💬 ${count > 1 ? `${count} novos comentários` : 'Novo comentário'}: ${task.title}`
        emailData.title = '💬 Nova Interação'
        emailData.message = `${count > 1 ? 'Existem novos comentários' : 'Há um novo comentário'} nesta tarefa.`
        if (contextReason) emailData.context = `"${contextReason}"`
        break
      case 'test_email':
        emailData.subject = `🧪 E-mail de Teste NowFlow`
        emailData.title = '🧪 Teste de Conexão'
        emailData.message = 'Este é um e-mail de teste para validar a configuração do SMTP e do Edge Function.'
        emailData.project_name = 'Sistema NowFlow'
        emailData.task_link = `${Deno.env.get('APP_URL')}/settings`
        break
    }

    await sendSmtpEmail({
      to: recipient.email,
      subject: emailData.subject,
      html: getEmailHtml(emailData)
    })

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Error in send-notification:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

function checkPrefs(type: string, prefs: any): boolean {
  if (!prefs) return true // Default always notify if no prefs row
  switch (type) {
    case 'task_created': return prefs.notify_task_created
    case 'task_assigned': return prefs.notify_task_moved // Assigned usually triggers on move or create
    case 'task_status_changed': return prefs.notify_task_moved
    case 'task_returned': return prefs.notify_task_returned
    case 'task_commented': return prefs.notify_new_comment
    default: return true
  }
}

async function sendSmtpEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') || 'smtp.resend.com',
      port: Number(Deno.env.get('SMTP_PORT')) || 465,
      tls: true,
      auth: {
        user: Deno.env.get('SMTP_USER') || 'resend',
        pass: Deno.env.get('SMTP_PASS') || '',
      },
    },
  })

  await client.send({
    from: Deno.env.get('SMTP_FROM') || 'NowFlow <onboarding@resend.dev>',
    to,
    subject,
    content: html,
    html,
  })

  await client.close()
}

function getEmailHtml(data: any): string {
  const logoFallback = `<h1 style="color: #13EC5B; margin: 0; font-family: sans-serif; font-size: 24px; font-weight: 900; letter-spacing: -1px;">NowFlow</h1>`
  const logoHtml = data.logo_url
    ? `<img src="${data.logo_url}" alt="Logo" style="max-height: 40px; width: auto; object-contain: contain;" />`
    : logoFallback

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { background-color: #0a1612; margin: 0; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #102216; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            .header { padding: 40px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); background-color: #0d1e14; }
            .content { padding: 40px; }
            .badge { display: inline-block; padding: 4px 12px; background-color: rgba(19, 236, 91, 0.1); border: 1px solid rgba(19, 236, 91, 0.2); border-radius: 20px; color: #13EC5B; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
            h2 { font-size: 24px; font-weight: 800; margin: 0 0 16px 0; color: #ffffff; letter-spacing: -0.5px; }
            p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0; }
            .info-card { background-color: rgba(255,255,255,0.02); border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 32px; }
            .info-label { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .info-value { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 0; }
            .context-box { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
            .btn { display: inline-block; width: 100%; box-sizing: border-box; background-color: #13EC5B; color: #0a1612; text-decoration: none; padding: 18px; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-align: center; transition: all 0.3s; box-shadow: 0 4px 20px rgba(19, 236, 91, 0.2); }
            .footer { padding: 32px; text-align: center; font-size: 12px; color: #475569; background-color: #0d1e14; }
            .footer a { color: #13EC5B; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${logoHtml}
            </div>
            <div class="content">
                <div class="badge">NOTIFICAÇÃO</div>
                <h2>${data.title}</h2>
                <p>Olá, ${data.recipient_name}. ${data.message}</p>
                
                <div class="info-card">
                    <div class="info-label">Tarefa</div>
                    <div class="info-value">${data.task_title}</div>
                    
                    <div style="margin-top: 16px;">
                        <div class="info-label">Projeto</div>
                        <div class="info-value">${data.project_name}</div>
                    </div>

                    ${data.context ? `
                    <div class="context-box">
                        <div class="info-label">Contexto</div>
                        <div class="info-value" style="font-weight: 400; font-style: italic; color: #94a3b8; font-size: 14px;">"${data.context}"</div>
                    </div>
                    ` : ''}
                </div>

                <a href="${data.task_link}" class="btn">Abrir no NowFlow</a>
            </div>
            <div class="footer">
                🚀 NowFlow Inc. Todos os direitos reservados.<br>
                <span style="display:block; margin-top:8px;">Você recebeu este e-mail porque está habilitado para notificações em sua <a href="${Deno.env.get('APP_URL')}/settings">configuração de conta</a>.</span>
            </div>
        </div>
    </body>
    </html>
    `
}
