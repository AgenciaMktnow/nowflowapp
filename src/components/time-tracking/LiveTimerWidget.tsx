import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type ActiveTimer = {
    id: string;
    start_time: string;
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
    userId?: string;
}

export default function LiveTimerWidget({ userId }: LiveTimerWidgetProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(true);

    // Use passed userId or fallback to current user
    const targetUserId = userId || user?.id;

    useEffect(() => {
        if (targetUserId) {
            fetchActiveTimer();
            // Optional: Subscribe to changes (Realtime)
            const subscription = supabase
                .channel('time_logs_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'time_logs',
                    filter: `user_id=eq.${targetUserId}`
                }, () => {
                    fetchActiveTimer();
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [targetUserId]);

    useEffect(() => {
        let interval: any;
        if (activeTimer) {
            // Calculate initial elapsed time
            const updateTime = () => {
                const start = new Date(activeTimer.start_time).getTime();
                const now = new Date().getTime();
                setElapsedSeconds(Math.floor((now - start) / 1000));
            };

            updateTime(); // Immediate update
            interval = setInterval(updateTime, 1000);
        } else {
            setElapsedSeconds(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTimer]);

    const fetchActiveTimer = async () => {
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select(`
                    id,
                    start_time,
                    task:tasks (
                        id,
                        task_number,
                        title,
                        project:projects(name),
                        client:clients(name)
                    )
                `)
                .eq('user_id', targetUserId)
                .is('end_time', null)
                .limit(1);

            if (error) throw error;
            setActiveTimer(data && data.length > 0 ? (data[0] as any) : null);
        } catch (error) {
            console.error('Error fetching active timer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStopTimer = async () => {
        if (!activeTimer) return;

        try {
            const now = new Date();
            const { error } = await supabase
                .from('time_logs')
                .update({
                    end_time: now.toISOString(),
                    duration_seconds: elapsedSeconds // Save the calculated seconds
                })
                .eq('id', activeTimer.id);

            if (error) throw error;

            // Log activity (optional, but good for consistency)
            // Ideally we'd import logActivity service here if needed

            setActiveTimer(null);
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
                    {formatTime(elapsedSeconds)}
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
                    onClick={handleStopTimer}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl font-bold transition-all transform active:scale-95"
                >
                    <span className="material-symbols-outlined fill-current">stop</span>
                    Parar
                </button>
                {/* Pause button could be implemented if we support "pausing" (which usually means stopping and starting a new entry later) 
                     For now, let's keep it simple with just STOP as per most time trackers.
                 */}
            </div>
        </div>
    );
}
