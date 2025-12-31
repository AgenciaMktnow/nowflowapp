import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PerformancePanelProps {
    userId?: string;
}

export default function PerformancePanel({ userId }: PerformancePanelProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<{ client: string, color: string, percentage: number, hours: number }[]>([]);
    const [totalHours, setTotalHours] = useState(0);

    const targetUserId = userId || user?.id;

    useEffect(() => {
        if (targetUserId) {
            fetchStats();
        }
    }, [targetUserId]);

    const fetchStats = async () => {
        try {
            // Get logs for the last 7 days
            const start = new Date();
            start.setDate(start.getDate() - 7);

            const { data } = await supabase
                .from('time_logs')
                .select(`
                    duration_seconds,
                    task:tasks (
                        client:clients(name)
                    )
                `)
                .eq('user_id', targetUserId)
                .gte('start_time', start.toISOString())
                .not('duration_seconds', 'is', null);

            if (data) {
                const clientMap: Record<string, number> = {};
                let total = 0;

                data.forEach((log: any) => {
                    const clientName = log.task?.client?.name || 'Sem Cliente';
                    const seconds = log.duration_seconds || 0;
                    clientMap[clientName] = (clientMap[clientName] || 0) + seconds;
                    total += seconds;
                });

                const COLORS = ['#13EC5B', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444', '#EC4899'];

                const result = Object.entries(clientMap)
                    .map(([client, seconds], idx) => ({
                        client,
                        hours: seconds / 3600,
                        percentage: total > 0 ? (seconds / total) * 100 : 0,
                        color: COLORS[idx % COLORS.length]
                    }))
                    .sort((a, b) => b.percentage - a.percentage);

                setStats(result);
                setTotalHours(total / 3600);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Construct conic-gradient for the pie chart
    const gradient = stats.reduce((acc, curr, idx) => {
        const prevPercents = stats.slice(0, idx).reduce((p, c) => p + c.percentage, 0);
        const endPercent = prevPercents + curr.percentage;
        return `${acc}, ${curr.color} ${prevPercents}% ${endPercent}%`;
    }, '');

    const finalGradient = `conic-gradient(from 0deg ${gradient ? gradient.substring(1) : '#333 0% 100%'})`;

    return (
        <div className="bg-surface-dark border border-gray-800 rounded-2xl p-6 shadow-lg h-full flex flex-col">
            <h3 className="text-white text-lg font-bold flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">pie_chart</span>
                Distribuição por Cliente
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                {/* Donut Chart */}
                <div
                    className="size-48 rounded-full relative flex items-center justify-center"
                    style={{ background: finalGradient }}
                >
                    <div className="size-36 bg-surface-dark rounded-full flex flex-col items-center justify-center z-10">
                        <span className="text-3xl font-black text-white">{totalHours.toFixed(1)}h</span>
                        <span className="text-xs text-gray-500 font-medium uppercase">Esta Semana</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="w-full grid grid-cols-2 gap-3">
                    {stats.map(stat => (
                        <div key={stat.client} className="flex items-center justify-between text-sm px-2">
                            <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full" style={{ backgroundColor: stat.color }}></span>
                                <span className="text-gray-300 truncate max-w-[100px]" title={stat.client}>{stat.client}</span>
                            </div>
                            <span className="font-bold text-white">{Math.round(stat.percentage)}%</span>
                        </div>
                    ))}
                    {stats.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 text-sm">Nenhum dado disponível</div>
                    )}
                </div>
            </div>
        </div>
    );
}
