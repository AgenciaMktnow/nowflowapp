import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProductivityWidgetNew() {

    const { user } = useAuth();

    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

    const [stats, setStats] = useState({
        focusTime: 0,
        tasksCompleted: 0
    });

    const [weeklyData, setWeeklyData] = useState<number[]>([]);
    const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

    useEffect(() => {
        if (user) fetchStats();
    }, [user, period]);

    const fetchStats = async () => {

        try {

            let startDate = new Date();

            if (period === 'day') {

                startDate.setHours(0,0,0,0);

            } else if (period === 'week') {

                const day = startDate.getDay();
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                startDate.setHours(0,0,0,0);

            } else {

                startDate.setDate(1);
                startDate.setHours(0,0,0,0);

            }

            const isoStart = startDate.toISOString();

            if (!user?.id) return;

            const { data: logs } = await supabase
                .from('time_logs')
                .select('duration_seconds,start_time')
                .eq('user_id', user.id)
                .gte('start_time', isoStart);

            const totalSeconds =
                logs?.reduce((acc, curr) =>
                    acc + (curr.duration_seconds || 0), 0) ?? 0;

            const { count } = await supabase
                .from('tasks')
                .select('*', { count:'exact', head:true })
                .eq('assignee_id', user.id)
                .eq('status', 'DONE')
                .gte('completed_at', isoStart);

            const weekMap: Record<string, number> = {};

            logs?.forEach((log) => {

                const day = new Date(log.start_time).toLocaleDateString();

                weekMap[day] =
                    (weekMap[day] || 0) + log.duration_seconds;

            });

            const weekArray =
                Object.values(weekMap).map(s => s / 3600);

            setWeeklyData(weekArray);

            if (weekArray.length > 1) {

                const last = weekArray[weekArray.length - 1];
                const prev = weekArray[weekArray.length - 2];

                if (last > prev) setTrend('up');
                else if (last < prev) setTrend('down');
                else setTrend('neutral');

            }

            setStats({
                focusTime: totalSeconds,
                tasksCompleted: count ?? 0
            });

        }

        catch (error) {
            console.error('Error fetching stats:', error);
        }

    };

    const formatTime = (seconds:number) => {

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);

        return `${h}h ${m}m`;

    };

    const getGoalSeconds = () => {

        if (period === 'day') return 8 * 3600;
        if (period === 'week') return 40 * 3600;
        return 160 * 3600;

    };

    const progress =
        Math.min((stats.focusTime / getGoalSeconds()) * 100, 100);

    return (

        <div className="bg-gradient-to-br from-[#0f1f17] to-[#183925] border border-[#13ec5b]/10 rounded-2xl p-6 flex flex-col gap-6 h-full shadow-xl relative overflow-hidden">

            {/* Glow effect */}

            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>

            {/* HEADER */}

            <div className="flex items-center justify-between relative z-10">

                <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">

                        <span className="material-symbols-outlined text-primary text-lg">
                            monitoring
                        </span>

                    </div>

                    <div>

                        <h3 className="text-sm font-semibold text-white">
                            Produtividade
                        </h3>

                        <p className="text-[11px] text-text-secondary">
                            acompanhamento de foco
                        </p>

                    </div>

                </div>

                {/* PERIOD SELECTOR */}

                <div className="flex bg-black/30 backdrop-blur rounded-lg p-1 border border-white/5">

                    {(['day','week','month'] as const).map((p)=>(

                        <button
                            key={p}
                            onClick={()=>setPeriod(p)}
                            className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all ${
                                period===p
                                ?'bg-primary text-black shadow'
                                :'text-text-secondary hover:text-white'
                            }`}
                        >
                            {p==='day'?'Hoje':p==='week'?'Semana':'Mês'}
                        </button>

                    ))}

                </div>

            </div>

            {/* MAIN METRICS */}

            <div className="grid grid-cols-2 gap-4 relative z-10">

                <div className="bg-black/20 rounded-xl p-4 border border-white/5">

                    <div className="text-[11px] text-text-secondary mb-1">
                        Tempo focado
                    </div>

                    <div className="text-3xl font-bold text-white tracking-tight">
                        {formatTime(stats.focusTime)}
                    </div>

                </div>

                <div className="bg-black/20 rounded-xl p-4 border border-white/5">

                    <div className="text-[11px] text-text-secondary mb-1">
                        Tarefas concluídas
                    </div>

                    <div className="text-3xl font-bold text-white tracking-tight">
                        {stats.tasksCompleted}
                    </div>

                </div>

            </div>

            {/* PROGRESS */}

            <div className="relative z-10">

                <div className="flex justify-between text-xs text-text-secondary mb-2">

                    <span>Progresso da meta</span>

                    <span>{Math.round(progress)}%</span>

                </div>

                <div className="h-3 bg-black/30 rounded-full overflow-hidden">

                    <div
                        className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-700 ease-out"
                        style={{ width:`${progress}%` }}
                    />

                </div>

                <div className="flex justify-between text-[11px] text-text-secondary mt-1">

                    <span>{formatTime(stats.focusTime)}</span>
                    <span>meta {formatTime(getGoalSeconds())}</span>

                </div>

            </div>

            {/* TREND */}

            <div className="flex items-center justify-between text-xs relative z-10">

                <span className="text-text-secondary">
                    tendência recente
                </span>

                <span className={`px-2 py-1 rounded-full font-semibold text-[10px]
                    ${trend==='up' ? 'bg-green-400/20 text-green-400'
                    :trend==='down' ? 'bg-red-400/20 text-red-400'
                    :'bg-gray-400/20 text-gray-300'}`}>

                    {trend==='up' && '▲ Crescendo'}
                    {trend==='down' && '▼ Queda'}
                    {trend==='neutral' && 'Estável'}

                </span>

            </div>

            {/* GRAPH */}

            <div className="flex items-end gap-2 h-16 relative z-10">

                {weeklyData.map((h,i)=>{

                    const height =
                        Math.min((h / 8) * 100, 100);

                    return (

                        <div
                            key={i}
                            title={`${h.toFixed(1)}h`}
                            className="flex-1 bg-primary/70 hover:bg-primary rounded-md transition-all duration-300"
                            style={{
                                height:`${height}%`,
                                animation:`grow .4s ease ${i * 0.05}s backwards`
                            }}
                        />

                    );

                })}

            </div>

        </div>

    );

}