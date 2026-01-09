import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DailyTimelineProps {
    userIds?: string[];
    clientId?: string;
}

export default function DailyTimeline({ userIds, clientId }: DailyTimelineProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const targetUserIds = userIds && userIds.length > 0 ? userIds : (user?.id ? [user.id] : []);
    const isMultiUser = targetUserIds.length > 1;

    useEffect(() => {
        if (targetUserIds.length > 0) {
            fetchDailyLogs();
        } else {
            setLogs([]);
            setLoading(false);
        }

        // Auto-scroll to current time or 8 AM on load
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 480; // 8 AM * 60px
        }

        // Update current time line every minute
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, [JSON.stringify(targetUserIds), clientId]);

    const fetchDailyLogs = async () => {
        setLoading(true);
        try {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('time_logs')
                .select(`
                    id,
                    start_time,
                    end_time,
                    duration_seconds,
                    user:users (
                        full_name,
                        avatar_url,
                        email
                    ),
                    task:tasks (
                        title,
                        project:projects(name),
                        client:clients(id, name)
                    )
                `)
                .in('user_id', targetUserIds)
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString())
                .order('start_time');

            if (error) throw error;

            // Client side filter
            const filteredData = data?.filter((log: any) => {
                if (!log.task) return false;
                if (clientId && log.task.client?.id !== clientId) return false;
                return true;
            });

            setLogs(filteredData || []);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const PIXELS_PER_HOUR = 60;
    const TOTAL_HOURS = 24;

    const getPosition = (dateStr: string) => {
        const d = new Date(dateStr);
        const hours = d.getHours();
        const minutes = d.getMinutes();
        return hours * PIXELS_PER_HOUR + minutes;
    };

    const getHeight = (durationSeconds: number) => {
        // Minimum height 20px to be visible
        return Math.max(20, (durationSeconds / 3600) * PIXELS_PER_HOUR);
    };

    return (
        <div className="bg-surface-dark border border-gray-800 rounded-2xl overflow-hidden shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    Linha do Tempo (Hoje)
                    {isMultiUser && <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full ml-2">(Equipe)</span>}
                </h3>
            </div>

            <div ref={scrollRef} className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
                {/* Hours Grid */}
                {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
                    <div key={hour} className="relative h-[60px] border-b border-gray-800/30 w-full flex">
                        <span className="w-12 text-xs text-gray-500 -mt-2 text-right pr-4 shrink-0">
                            {hour.toString().padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 relative">
                            {/* Line across is handled by border-b */}
                        </div>
                    </div>
                ))}

                {/* Current Time Indicator */}
                <div
                    className="absolute left-12 right-4 h-0.5 bg-red-500 z-50 pointer-events-none flex items-center"
                    style={{ top: currentTime.getHours() * PIXELS_PER_HOUR + currentTime.getMinutes() + 16 }} // +16 for padding/offset adjustment
                >
                    <div className="absolute -left-1.5 size-3 bg-red-500 rounded-full"></div>
                </div>

                {/* Log Blocks */}
                {logs.map(log => {
                    // If no end time (active timer), use current time for height
                    const duration = log.end_time
                        ? log.duration_seconds
                        : (new Date().getTime() - new Date(log.start_time).getTime()) / 1000;

                    const top = getPosition(log.start_time) + 16; // +16 padding top of container
                    const height = getHeight(duration || 0);

                    return (
                        <div
                            key={log.id}
                            className="absolute left-16 right-4 rounded-lg bg-primary/20 border-l-4 border-primary p-2 text-xs overflow-hidden hover:bg-primary/30 transition-colors cursor-pointer group z-10 flex flex-col justify-between"
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={() => alert(`Tarefa: ${log.task?.title}\nUsuário: ${log.user?.full_name}`)}
                        >
                            <div className="flex items-start justify-between gap-2 w-full">
                                <div className="font-bold text-white truncate flex-1">{log.task?.title}</div>
                                {isMultiUser && log.user && (
                                    <div className="shrink-0 flex items-center justify-center p-0.5 bg-background-dark rounded-full" title={log.user.full_name}>
                                        {log.user.avatar_url ? (
                                            <img src={log.user.avatar_url} className="w-5 h-5 rounded-full" alt={log.user.full_name} />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[8px] text-white font-bold">
                                                {log.user.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {height > 30 && (
                                <div className="text-gray-300 truncate text-[10px] mt-0.5">
                                    {log.task?.client?.name} • {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.end_time ? new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Helper for empty states */}
                {logs.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-4xl">history_toggle_off</span>
                            <p className="text-sm mt-2">Nenhum registro hoje</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
