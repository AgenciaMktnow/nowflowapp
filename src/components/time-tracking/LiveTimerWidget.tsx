import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type ActiveTimer = {
    id: string;
    start_time: string;
    user_id: string;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
    task: {
        id: string; // real ID
        task_number: number;
        title: string;
        project?: {
            name: string;
        };
        client?: {
            name: string;
        };
    };
};

interface LiveTimerWidgetProps {
    userIds?: string[];
    clientId?: string;
}

export default function LiveTimerWidget({ userIds, clientId }: LiveTimerWidgetProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]); // Array for multi-user
    const [elapsedSeconds, setElapsedSeconds] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    // Determine target User IDs (default to current user if empty/undefined)
    const targetUserIds = userIds && userIds.length > 0 ? userIds : (user?.id ? [user.id] : []);

    // Check if we are in "Single User View" (explicitly me, or just one user selected)
    // If multiple users selected, we use List Mode.
    const isMultiUser = targetUserIds.length > 1;

    useEffect(() => {
        if (targetUserIds.length > 0) {
            fetchActiveTimers();

            // Realtime subscription could be heavy for "All Users", but let's try strict filter
            const subscription = supabase
                .channel('time_logs_live_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'time_logs',
                    filter: `end_time=is.null` // We listen to all active timers and filter in callback or refine filter? 
                    // Postgres filter IN (...) is not supported efficiently in realtime filters string syntax usually.
                    // Better to just refresh on ANY time_log change for safety or poll.
                    // Let's stick to polling active timers every minute + initial fetch, or simple refresh on events.
                }, () => {
                    fetchActiveTimers(); // Brute force refresh is safer than complex filter logic for now
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [JSON.stringify(targetUserIds), clientId]);

    useEffect(() => {
        let interval: any;
        if (activeTimers.length > 0) {
            const updateTime = () => {
                const now = new Date().getTime();
                const newSeconds: Record<string, number> = {};

                activeTimers.forEach(timer => {
                    const start = new Date(timer.start_time).getTime();
                    newSeconds[timer.id] = Math.floor((now - start) / 1000);
                });
                setElapsedSeconds(newSeconds);
            };

            updateTime(); // Immediate update
            interval = setInterval(updateTime, 1000);
        } else {
            setElapsedSeconds({});
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTimers]);

    const fetchActiveTimers = async () => {
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select(`
                    id,
                    start_time,
                    user_id,
                    user:users (
                        full_name,
                        avatar_url
                    ),
                    task:tasks (
                        id,
                        task_number,
                        title,
                        project:projects(name),
                        client:clients(id, name)
                    )
                `)
                .in('user_id', targetUserIds)
                .is('end_time', null);

            if (error) throw error;

            // Client side filter
            const filteredData = (data as any[])?.filter((log: any) => {
                if (!log.task) return false;
                if (clientId && log.task.client?.id !== clientId) return false;
                return true;
            });

            setActiveTimers(filteredData || []);
        } catch (error) {
            console.error('Error fetching active timers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStopTimer = async (timerId: string, currentSeconds: number) => {
        try {
            const now = new Date();
            const { error } = await supabase
                .from('time_logs')
                .update({
                    end_time: now.toISOString(),
                    duration_seconds: currentSeconds
                })
                .eq('id', timerId);

            if (error) throw error;

            // Optimistic update
            setActiveTimers(prev => prev.filter(t => t.id !== timerId));
        } catch (error) {
            console.error('Error stopping timer:', error);
            alert('Erro ao parar o timer.');
        }
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) return null;

    // --- VIEW: Multi-User List ---
    if (isMultiUser) {
        if (activeTimers.length === 0) {
            return (
                <div className="bg-surface-dark border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[100px] shadow-sm">
                    <span className="material-symbols-outlined text-gray-600">timer_off</span>
                    <p className="text-gray-500 text-sm">Nenhum membro da equipe com timer ativo.</p>
                </div>
            );
        }

        return (
            <div className="bg-surface-dark border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-background-dark/50">
                    <h3 className="text-white text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">timer</span>
                        Timers Ativos ({activeTimers.length})
                    </h3>
                </div>
                <div className="divide-y divide-gray-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {activeTimers.map(timer => (
                        <div key={timer.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {timer.user?.avatar_url ? (
                                    <img src={timer.user.avatar_url} className="w-8 h-8 rounded-full border border-gray-700" title={timer.user.full_name} />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold" title={timer.user?.full_name}>
                                        {timer.user?.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="text-white text-sm font-medium truncate">{timer.task.title}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {timer.user?.full_name} • {timer.task.client?.name}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-mono text-primary font-bold text-lg">
                                    {formatTime(elapsedSeconds[timer.id] || 0)}
                                </span>
                                {/* Optional: Admin could stop other people's timers? Maybe strictly for now NO, or safely yes if admin. 
                                    Let's allow stopping for now as it's useful for managers. */}
                                <button
                                    onClick={() => handleStopTimer(timer.id, elapsedSeconds[timer.id] || 0)}
                                    className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                    title="Parar Timer"
                                >
                                    <span className="material-symbols-outlined">stop_circle</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- VIEW: Single User (Big Timer) ---
    // If strict single user (targetUserIds has 1 item), we behave like original logic
    const activeTimer = activeTimers[0]; // Take first one found (should be only one per user ideally)

    if (!activeTimer) {
        return (
            <div className="bg-surface-dark border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px] shadow-lg">
                <div className="size-16 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-gray-500">timer_off</span>
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Nenhum timer ativo</h3>
                    <p className="text-gray-400 text-sm mt-1">Selecione uma tarefa para começar a contar o tempo.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-2 px-6 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-full font-bold text-sm transition-colors"
                >
                    Ir para Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-surface-dark border border-primary/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-6 shadow-[0_0_30px_rgba(19,236,91,0.05)] min-h-[200px]">
            {/* Background Pulse Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent animate-pulse pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider animate-pulse">
                    <span className="size-2 rounded-full bg-primary"></span>
                    Em Andamento
                </span>
                <div className="font-mono text-5xl md:text-6xl font-black text-white tracking-widest tabular-nums drop-shadow-xl">
                    {formatTime(elapsedSeconds[activeTimer.id] || 0)}
                </div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div
                    onClick={() => navigate(`/tasks/${activeTimer.task.task_number}`)}
                    className="cursor-pointer group hover:bg-white/5 p-3 rounded-xl transition-colors"
                >
                    <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {activeTimer.task.title}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-1">
                        {activeTimer.task.client && <span>{activeTimer.task.client.name}</span>}
                        {activeTimer.task.client && activeTimer.task.project && <span>•</span>}
                        {activeTimer.task.project && <span>{activeTimer.task.project.name}</span>}
                        <span>•</span>
                        <span className="font-mono text-primary">#{activeTimer.task.task_number}</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-3 w-full max-w-xs">
                <button
                    onClick={() => handleStopTimer(activeTimer.id, elapsedSeconds[activeTimer.id] || 0)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl font-bold transition-all transform active:scale-95"
                >
                    <span className="material-symbols-outlined fill-current">stop</span>
                    Parar
                </button>
            </div>
        </div>
    );
}
