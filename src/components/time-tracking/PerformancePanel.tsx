import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PerformancePanelProps {
    userIds?: string[];
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
}

export default function PerformancePanel({ userIds, clientId, startDate, endDate }: PerformancePanelProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<{ client: string, color: string, percentage: number, hours: number }[]>([]);
    const [totalHours, setTotalHours] = useState(0);

    const targetUserIds = userIds && userIds.length > 0 ? userIds : (user?.id ? [user.id] : []);

    useEffect(() => {
        if (targetUserIds.length > 0) {
            fetchStats();
        } else {
            setStats([]);
            setTotalHours(0);
        }
    }, [targetUserIds.join(','), clientId, startDate?.toISOString(), endDate?.toISOString()]);

    const fetchStats = async () => {
        if (!startDate || !endDate) return;

        try {
            const startQuery = new Date(startDate);
            startQuery.setHours(0, 0, 0, 0);

            const endQuery = new Date(endDate);
            endQuery.setDate(endQuery.getDate() + 1);
            endQuery.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('time_logs')
                .select(`
                    duration_seconds,
                    task:tasks (
                        client_id,
                        client:clients(id, name),
                        project:projects(
                            client:clients(id, name)
                        )
                    )
                `)
                .in('user_id', targetUserIds)
                .gte('start_time', startQuery.toISOString())
                .lt('start_time', endQuery.toISOString())
                .not('duration_seconds', 'is', null);

            if (error) throw error;

            if (data) {
                const filteredData = data.filter((log: any) => {
                    if (!log.task) return false;

                    if (
                        clientId &&
                        log.task?.client?.id !== clientId &&
                        log.task?.project?.client?.id !== clientId
                    ) return false;

                    return true;
                });

                const clientMap: Record<string, number> = {};
                let total = 0;

                filteredData.forEach((log: any) => {
                    const clientName =
                        log.task?.client?.name ||
                        log.task?.project?.client?.name ||
                        'Sem Cliente';

                    const seconds = Number(log.duration_seconds || 0);
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
    let cumulative = 0;

    const segments = stats.map(stat => {
        const start = cumulative;
        cumulative += stat.percentage;
        return `${stat.color} ${start}% ${cumulative}%`;
    });

    const finalGradient =
        segments.length > 0
            ? `conic-gradient(${segments.join(', ')})`
            : 'conic-gradient(#2a2a2a 0% 100%)';

    return (
        <>
            <div className="bg-surface-dark border border-gray-800 rounded-2xl px-7 py-7 shadow-xl h-full flex flex-col">
                <h3 className="text-white text-lg font-semibold tracking-tight flex items-center gap-2 mb-8">
                    <span className="material-symbols-outlined text-primary">pie_chart</span>
                    Distribuição por Cliente
                </h3>

                <div className="flex-1 flex flex-col items-center justify-center gap-10">
                    {/* Donut Chart */}
                    <div
                        className="size-52 rounded-full relative flex items-center justify-center transition-all duration-700 ease-out shadow-lg"
                        style={{
                            background: finalGradient,
                            backgroundColor: '#2a2a2a'
                        }}
                    >
                        <div className="size-40 bg-surface-dark rounded-full flex flex-col items-center justify-center z-10 border border-gray-800/60 shadow-inner">
                            <span className="text-4xl font-bold text-white tracking-tight">{totalHours.toFixed(1)}h</span>
                            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mt-1">Período Selecionado</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="w-full grid grid-cols-1 gap-3 mt-2">
                        {stats.map(stat => (
                            <div
                                key={stat.client}
                                className="flex items-center justify-between text-sm px-4 py-2 rounded-lg bg-background-dark/40 border border-gray-800/60 hover:bg-background-dark/60 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="size-3.5 rounded-full ring-2 ring-background-dark" style={{ backgroundColor: stat.color }}></span>
                                    <span className="text-gray-300 truncate font-medium" title={stat.client}>{stat.client}</span>
                                </div>
                                <span className="font-semibold text-white text-sm">{Math.round(stat.percentage)}%</span>
                            </div>
                        ))}
                        {stats.length === 0 && (
                            <div className="col-span-1 text-center text-gray-500 text-sm py-6">Nenhum dado encontrado para o período selecionado</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5 rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-white/20 mb-2">emoji_events</span>
                <h3 className="text-white font-bold">Metas Semanais</h3>
                <p className="text-xs text-gray-400 mt-1">Em breve você poderá definir metas de horas.</p>
            </div>
        </>
    );
}
