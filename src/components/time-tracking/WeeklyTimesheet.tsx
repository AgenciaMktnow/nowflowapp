import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DateRangePicker from '../DateRangePicker';

interface WeeklyTimesheetProps {
    userIds?: string[];
    clientId?: string;
    startDate: Date;
    endDate: Date;
    setStartDate: (d: Date) => void;
    setEndDate: (d: Date) => void;
}

export default function WeeklyTimesheet({ userIds, clientId, startDate, endDate, setStartDate, setEndDate }: WeeklyTimesheetProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Helper: Get Monday of current week
    // const getStartOfWeek = (date: Date) => {
    //     const d = new Date(date);
    //     const day = d.getDay();
    //     const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    //     d.setDate(diff);
    //     d.setHours(0, 0, 0, 0);
    //     return d;
    // };

    // Initial Date Logic
    // const getInitialDate = (param: string, isEnd = false) => {
    //     const paramDate = searchParams.get(param);
    //     if (paramDate) return new Date(paramDate);
    //     if (isEnd) {
    //         const d = getStartOfWeek(new Date());
    //         d.setDate(d.getDate() + 6);
    //         return d;
    //     }
    //     return getStartOfWeek(new Date());
    // };

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    // Date State
    // const [startDate, setStartDate] = useState<Date>(getInitialDate('start'));
    // const [endDate, setEndDate] = useState<Date>(getInitialDate('end', true));

    // Determine target User IDs (default to current user if empty/undefined)
    const targetUserIds = userIds && userIds.length > 0 ? userIds : (user?.id ? [user.id] : []);

    // Sync to URL
    useEffect(() => {
        const params: any = {};
        if (startDate) params.start = startDate.toISOString();
        if (endDate) params.end = endDate.toISOString();
        setSearchParams(prev => ({ ...Object.fromEntries(prev), ...params }));
    }, [startDate, endDate, setSearchParams]);

    useEffect(() => {
        // Only fetch if we have users to fetch for
        if (targetUserIds.length > 0) {
            fetchWeeklyLogs();
        } else {
            setLogs([]);
            setLoading(false);
        }
    }, [JSON.stringify(targetUserIds), startDate, endDate, clientId]); // Add clientId to dep array

    const fetchWeeklyLogs = async () => {
        setLoading(true);
        try {
            // Ensure date boundaries are correct (Start 00:00, End 23:59 or Next Day 00:00)
            const startQuery = new Date(startDate);
            startQuery.setHours(0, 0, 0, 0);

            const endQuery = new Date(endDate);
            endQuery.setDate(endQuery.getDate() + 1);
            endQuery.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('time_logs')
                .select(`
                    id,
                    start_time,
                    duration_seconds,
                    task:tasks (
                        id,
                        task_number,
                        title,
                        project:projects(name),
                        client:clients(id, name)
                    )
                `)
                .in('user_id', targetUserIds) // Use IN for array
                .gte('start_time', startQuery.toISOString())
                .lt('start_time', endQuery.toISOString())
                .not('duration_seconds', 'is', null);

            if (error) throw error;

            // Client-side filtering for Client ID (Supabase join filtering is complex)
            const filteredData = data?.filter((log: any) => {
                // Filter out logs without tasks or where task client doesn't match
                if (!log.task) return false;
                if (clientId && log.task.client?.id !== clientId) return false;
                return true;
            });

            setLogs(filteredData || []);
        } catch (error) {
            console.error('Error fetching weekly logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate columns based on range
    const getDaysArray = (start: Date, end: Date) => {
        const arr = [];
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            arr.push(new Date(dt));
        }
        return arr;
    };
    const dateColumns = getDaysArray(startDate, endDate);
    const istooWide = dateColumns.length > 10;

    // Group logs
    const groupedData: Record<string, { task: any, daily: Record<string, number>, total: number }> = {};

    logs.forEach(log => {
        const taskId = log.task.id;
        if (!groupedData[taskId]) {
            groupedData[taskId] = {
                task: log.task,
                daily: {},
                total: 0
            };
        }

        const logDate = new Date(log.start_time).toLocaleDateString(); // Local date key matches columns
        const seconds = log.duration_seconds || 0;

        if (!groupedData[taskId].daily[logDate]) groupedData[taskId].daily[logDate] = 0;
        groupedData[taskId].daily[logDate] += seconds;
        groupedData[taskId].total += seconds;
    });

    const formatDuration = (seconds: number) => {

        if (!seconds) return '00h 00m 00s';

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');

        return `${hh}h ${mm}m ${ss}s`;
    };

    return (
        <div className="bg-surface-dark border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="px-8 py-6 border-b border-gray-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-background-dark/40">
                <h3 className="text-white text-lg font-semibold tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calendar_view_week</span>
                    Horas por Tarefa
                    {targetUserIds.length > 1 && <span className="text-xs font-medium text-gray-400 bg-gray-800/70 px-2.5 py-1 rounded-full ml-2 border border-gray-700">(Equipe: {targetUserIds.length})</span>}
                </h3>
                <div className="w-full md:w-80">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(s, e) => {
                            setStartDate(s);
                            setEndDate(e);
                        }}
                    />
                </div>
            </div>

            <div className="overflow-x-auto bg-background-dark/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-background-dark/70 text-gray-400 text-[11px] uppercase tracking-widest">
                            <th className="px-6 py-4 font-semibold border-b border-gray-800 min-w-[240px] sticky left-0 bg-surface-dark z-20 backdrop-blur">Tarefa / Projeto</th>
                            {!istooWide && dateColumns.map(d => (
                                <th key={d.toString()} className="px-5 py-4 font-semibold border-b border-gray-800 text-center min-w-[90px]">
                                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                                </th>
                            ))}
                            <th className="p-4 font-semibold border-b border-gray-800 text-center w-[100px] text-primary">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={istooWide ? 2 : dateColumns.length + 2} className="py-12 text-center text-gray-500 animate-pulse text-sm">Carregando dados...</td></tr>
                        ) : Object.keys(groupedData).length === 0 ? (
                            <tr><td colSpan={istooWide ? 2 : dateColumns.length + 2} className="py-12 text-center text-gray-500 text-sm">Nenhum registro neste período.</td></tr>
                        ) : (
                            Object.values(groupedData).map((row) => (
                                <tr key={row.task.id} className="hover:bg-white/5 transition-all duration-200 group">
                                    <td className="px-6 py-5 sticky left-0 bg-surface-dark group-hover:bg-white/5 transition-all duration-200 z-20 border-r border-gray-800/60">
                                        <div
                                            onClick={() => navigate(`/tasks/${row.task.task_number}`)}
                                            className="font-semibold text-white group-hover:text-primary transition-colors cursor-pointer truncate max-w-[360px]"
                                            title={row.task.title}
                                        >
                                            {row.task.title}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 flex gap-2">
                                            {row.task.client && <span>{row.task.client.name}</span>}
                                            {row.task.project && <span className="text-gray-600">• {row.task.project.name}</span>}
                                        </div>
                                    </td>
                                    {!istooWide && dateColumns.map(d => {
                                        const k = d.toLocaleDateString();
                                        const seconds = row.daily[k] || 0;
                                        return (
                                            <td key={d.toString()} className="px-5 py-5 text-center">
                                                <div className={`text-sm font-mono font-medium whitespace-nowrap ${seconds > 0 ? 'text-white' : 'text-gray-600'} transition-colors`}>
                                                    {formatDuration(seconds)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-4 text-center">
                                        <div className="text-sm font-semibold text-primary tracking-tight whitespace-nowrap">
                                            {formatDuration(row.total)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-primary/10 border-t border-gray-800">
                            <td className="px-6 py-5 font-semibold text-white text-right sticky left-0 bg-surface-dark z-20 border-r border-gray-800/60">Total do Período</td>
                            {!istooWide && dateColumns.map(d => {
                                const k = d.toLocaleDateString();
                                const dayTotal = Object.values(groupedData).reduce((acc, curr) => acc + (curr.daily[k] || 0), 0);
                                return (
                                    <td key={d.toString()} className="p-4 text-center font-bold text-white">
                                        {dayTotal > 0 ? formatDuration(dayTotal) : '-'}
                                    </td>
                                );
                            })}
                            <td className="px-5 py-5 text-center font-bold text-primary text-lg tracking-tight whitespace-nowrap">
                                {formatDuration(Object.values(groupedData).reduce((acc, curr) => acc + curr.total, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
