
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProductivityWidget() {
    const { user } = useAuth();
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
    const [stats, setStats] = useState({
        focusTime: 0,
        tasksCompleted: 0
    });


    useEffect(() => {
        if (user) fetchStats();
    }, [user, period]);

    const fetchStats = async () => {

        try {

            let startDate = new Date();

            if (period === 'day') {
                startDate.setHours(0, 0, 0, 0);
            } else if (period === 'week') {
                const day = startDate.getDay();
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
            } else {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
            }

            const isoStart = startDate.toISOString();

            // 1. Fetch Focus Time
            const { data: logs } = await supabase
                .from('time_logs')
                .select('duration_seconds')
                .eq('user_id', user!.id)
                .gte('start_time', isoStart);

            const totalSeconds = logs?.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) || 0;

            // 2. Fetch Tasks Completed (using status=DONE and created_at as proxy if strictly needed, 
            // but for now checking tasks updated to DONE in period is hard without logs. 
            // Better: Count tasks that are DONE and *maybe* were created recently? 
            // Actually, let's try to infer from time_logs on DONE tasks?)
            // A simpler valid metric: Count tasks that are DONE. Ideally we'd filter by completion date.
            // Let's try to query 'updated_at' if it exists.

            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('assignee_id', user!.id)
                .eq('status', 'DONE')
            // This is imperfect without completed_at, but we'll leave it simple for now or strictly rely on Focus Time which is the main gamification.
            // .gte('created_at', isoStart); // This would only count tasks created AND done in period. 

            // Workaround: We will just show "Focus Time" as the main visual, and "Tasks Completed (Total)" or hide the period filter for tasks if inaccurate.
            // But let's assume we want to gamify focus time mostly.

            setStats({
                focusTime: totalSeconds,
                tasksCompleted: count || 0
            });

        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {

        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    // Calculate progress for "Day" (Goal: 8h?)
    const getProgress = () => {
        if (period === 'day') return Math.min((stats.focusTime / (8 * 3600)) * 100, 100);
        if (period === 'week') return Math.min((stats.focusTime / (40 * 3600)) * 100, 100);
        return Math.min((stats.focusTime / (160 * 3600)) * 100, 100);
    };

    return (
        <div className="bg-[#183925] border border-[#13ec5b]/10 rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-primary">trophy</span>
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">monitoring</span>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Produtividade</h3>
                </div>
                <div className="flex bg-background-dark/50 rounded-lg p-1 border border-white/5">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${period === p ? 'bg-primary text-background-dark shadow-sm' : 'text-text-secondary hover:text-white'}`}
                        >
                            {p === 'day' ? 'Hoje' : (p === 'week' ? 'Semana' : 'Mês')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-bold text-white">{formatTime(stats.focusTime)}</span>
                    <span className="text-text-secondary text-sm mb-2">focados</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-surface-highlight rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${getProgress()}%` }}
                    ></div>
                </div>
                <p className="text-xs text-text-secondary">
                    {period === 'day' ? 'Meta diária: 8h' : (period === 'week' ? 'Meta semanal: 40h' : 'Meta mensal: 160h')}
                </p>
            </div>
        </div>
    );
}
