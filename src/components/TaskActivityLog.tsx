import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
    id: string;
    task_id: string;
    user_id: string;
    action_type: string;
    details: any;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string;
        email: string;
    };
}

interface TaskActivityLogProps {
    taskId: string;
}

const TaskActivityLog = ({ taskId }: TaskActivityLogProps) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();

        // Realtime subscription
        const channel = supabase
            .channel(`activities-${taskId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'task_activities',
                    filter: `task_id=eq.${taskId}`
                },
                (_payload) => {
                    // Optimistic update or just refetch. For simplest consistent user join, refetch is safer, but let's try to just insert if we can fetch user?
                    // Refetch is easiest to get relations.
                    fetchActivities();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId]);

    const fetchActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('task_activities')
                .select(`
                    *,
                    user:users(full_name, avatar_url, email)
                `)
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActivities(data || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMessage = (activity: Activity) => {
        const { action_type, details, user } = activity;
        const actorName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Sistema';

        switch (action_type) {
            case 'CREATED':
                return <span className="text-gray-300"><b>{actorName}</b> criou a tarefa.</span>;
            case 'STATUS_CHANGE':
                if (details.from && details.to) {
                    const statusLabels: Record<string, string> = {
                        'TODO': 'A Fazer',
                        'IN_PROGRESS': 'Em Andamento',
                        'WAITING_CLIENT': 'Em Revisão',
                        'REVIEW': 'Em Revisão',
                        'DONE': 'Concluído',
                        'BACKLOG': 'Backlog',
                        'CANCELED': 'Cancelado'
                    };
                    const fromLabel = statusLabels[details.from] || details.from;
                    const toLabel = statusLabels[details.to] || details.to;

                    return (
                        <span className="text-gray-300">
                            <b>{actorName}</b> moveu de <span className="px-1.5 py-0.5 rounded bg-white/5 text-xs border border-white/10">{fromLabel}</span> para <span className="px-1.5 py-0.5 rounded bg-white/5 text-xs border border-white/10">{toLabel}</span>
                        </span>
                    );
                }
                // Fallback for legacy logs
                return <span className="text-gray-300"><b>{actorName}</b> {details.content_snippet?.replace('moveu a tarefa para', 'alterou o status para') || 'alterou o status'}.</span>;
            case 'ASSIGNED':
                return <span className="text-gray-300"><b>{actorName}</b> adicionou <b>{details.assigned_to?.split(' ')[0]}</b> como responsável.</span>;
            case 'UNASSIGNED':
                return <span className="text-gray-300"><b>{actorName}</b> removeu <b>{details.removed_user?.split(' ')[0]}</b> dos responsáveis.</span>;
            case 'MY_PART':
                if (details.status === 'delivered') {
                    return <span className="text-green-400"><b>{actorName}</b> entregou a parte dele. ✋</span>;
                } else {
                    return <span className="text-orange-400"><b>{actorName}</b> cancelou a entrega.</span>;
                }
            case 'REOPENED':
                return <span className="text-purple-400 font-bold"><b>{actorName}</b> reabriu a tarefa! 🔄</span>;

            // --- NEW ACTIONS ---
            case 'CHECKLIST_COMPLETE':
                return <span className="text-gray-300"><b>{actorName}</b> marcou <i>"{details.content_snippet}"</i> como feito.</span>;
            case 'CHECKLIST_UNCOMPLETE':
                return <span className="text-gray-300"><b>{actorName}</b> desmarcou <i>"{details.content_snippet}"</i>.</span>;
            case 'ATTACHMENT_ADD':
                return <span className="text-gray-300"><b>{actorName}</b> anexou um arquivo. 📎</span>;
            case 'ATTACHMENT_REMOVE':
                return <span className="text-gray-300"><b>{actorName}</b> removeu um anexo.</span>;
            case 'PRIORITY_CHANGE':
                return <span className="text-gray-300"><b>{actorName}</b> alterou a prioridade para <b>{details.content_snippet}</b>.</span>;
            case 'DUE_DATE_CHANGE':
                return <span className="text-gray-300"><b>{actorName}</b> alterou o prazo para <b>{details.content_snippet}</b>.</span>;
            case 'RETURN_TASK':
                return <span className="text-red-400 font-bold"><b>{actorName}</b> devolveu e tarefa. Motivo: "{details.content_snippet || 'Não informado'}"</span>;
            case 'COMMENT':
                return <span className="text-gray-300"><b>{actorName}</b> comentou na tarefa.</span>;
            default:
                // Fallback for legacy "SYSTEM_LEGACY" or unknown types
                if (action_type === 'SYSTEM_LEGACY') return <span className="text-gray-400 italic"><b>{actorName}</b> realizou uma ação (sistema).</span>;
                return <span className="text-gray-300"><b>{actorName}</b> realizou uma ação ({action_type}).</span>;
        }
    };



    if (loading) return <div className="p-4 text-center text-xs text-gray-500">Carregando histórico...</div>;

    if (activities.length === 0) return <div className="p-4 text-center text-xs text-gray-500 italic">Nenhuma atividade registrada ainda.</div>;

    return (
        <div className="relative pl-4 border-l border-white/10 ml-2 space-y-6 py-2">
            {activities.map((activity) => (
                <div key={activity.id} className="relative flex gap-3 text-sm group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card bg-surface-card z-10 
                        ${activity.action_type === 'MY_PART' ? 'bg-green-500 border-green-500' : ''}
                        ${activity.action_type === 'REOPENED' ? 'bg-purple-500 border-purple-500' : ''}
                        ${activity.action_type === 'CREATED' ? 'bg-primary border-primary' : 'bg-gray-600 border-gray-600'}
                    `}></div>

                    {/* Content */}
                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                            {/* Avatar */}
                            <div className="w-5 h-5 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
                                {activity.user?.avatar_url ? (
                                    <img src={activity.user.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">
                                        {activity.user?.full_name?.[0] || '?'}
                                    </div>
                                )}
                            </div>

                            {/* Message */}
                            <div className="text-[13px] leading-snug break-words">
                                {formatMessage(activity)}
                            </div>
                        </div>

                        {/* Timestamp */}
                        <span className="text-[10px] text-gray-500 ml-7">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TaskActivityLog;
