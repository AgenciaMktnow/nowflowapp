import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Helper to inject custom scrollbar styles if not global
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

type Activity = {
    id: string;
    activity_type: string;
    content: string;
    created_at: string;
    user: {
        full_name: string;
        avatar_url?: string;
    } | {
        full_name: string;
        avatar_url?: string;
    }[];
    metadata?: any;
};

type ActivityFeedProps = {
    taskId: string;
};

// Helper for time ago
const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'agora';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `há ${days}d`;

    return date.toLocaleDateString('pt-BR');
};

export default function ActivityFeed({ taskId }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();

        const subscription = supabase
            .channel(`activity_feed_${taskId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'task_activities',
                filter: `task_id=eq.${taskId}`
            }, () => {
                fetchActivities();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [taskId]);

    const fetchActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('task_activities')
                .select(`
                    id,
                    activity_type,
                    content,
                    created_at,
                    metadata,
                    user:users(full_name, avatar_url)
                `)
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActivities(data as unknown as Activity[] || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'STATUS_CHANGE': return 'swap_horiz';
            case 'TIMER_START': return 'play_arrow';
            case 'TIMER_STOP': return 'stop';
            case 'ATTACHMENT_ADD': return 'attach_file';
            case 'COMMENT': return 'chat_bubble_outline';
            case 'ASSIGNEE_CHANGE': return 'person_add';
            case 'CHECKLIST_COMPLETE': return 'check_box';
            case 'RETURN_TASK': return 'replay';
            case 'HANDOVER': return 'keyboard_return';
            default: return 'info';
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'STATUS_CHANGE': return 'text-blue-400 bg-blue-400/10';
            case 'TIMER_START': return 'text-green-400 bg-green-400/10';
            case 'TIMER_STOP': return 'text-orange-400 bg-orange-400/10';
            case 'ATTACHMENT_ADD': return 'text-purple-400 bg-purple-400/10';
            case 'RETURN_TASK': return 'text-red-400 bg-red-400/10';
            default: return 'text-text-muted-dark bg-surface-dark';
        }
    };

    const getUserDetails = (user: Activity['user']) => {
        if (Array.isArray(user)) {
            return user[0] || { full_name: 'Usuário' };
        }
        return user || { full_name: 'Usuário' };
    };

    const getUserInitials = (name?: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (loading) return <div className="text-center py-4 text-text-muted-dark text-xs">Carregando atividades...</div>;

    if (activities.length === 0) return <div className="text-center py-4 text-text-muted-dark text-xs">Nenhuma atividade recente.</div>;

    return (
        <div className="space-y-4">
            <style>{scrollbarStyles}</style>
            <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2">Atividade Recente</h3>
            {/* Scrollable Container */}
            <div className="space-y-4 relative max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Vertical Line Fixed Position Logic needs adjustment if inside scroll, keeping inside for now but line might break. 
                    Better to keep line relative to content. 
                */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border-dark z-0"></div>

                {activities.map((activity) => {
                    const user = getUserDetails(activity.user);
                    return (
                        <div key={activity.id} className="relative z-10 flex items-start gap-3">
                            {/* Avatar */}
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="size-8 rounded-full border-2 border-background-dark object-cover" />
                            ) : (
                                <div className="size-8 rounded-full bg-surface-dark border-2 border-background-dark flex items-center justify-center text-[10px] text-text-muted-dark font-bold shrink-0">
                                    {getUserInitials(user?.full_name)}
                                </div>
                            )}

                            <div className="flex-1 bg-surface-dark/50 border border-border-dark/50 rounded-lg p-3 hover:bg-surface-dark transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`material-symbols-outlined text-[16px] p-1 rounded-full ${getActivityColor(activity.activity_type)}`}>
                                        {getActivityIcon(activity.activity_type)}
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                        {user?.full_name}
                                    </span>
                                    <span className="text-xs text-text-muted-dark font-normal">
                                        {activity.content}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 pl-8">
                                    {timeAgo(activity.created_at)}
                                </div>

                                {/* Metadata Details (Optional) */}
                                {activity.metadata?.reason && (
                                    <div className="mt-2 text-xs text-text-muted-dark italic bg-black/20 p-2 rounded ml-8 border-l-2 border-red-400/50">
                                        "{activity.metadata.reason}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
