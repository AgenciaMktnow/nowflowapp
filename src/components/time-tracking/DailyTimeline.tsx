import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TaskModal from './TaskModal';

interface DailyTimelineProps {
    userIds?: string[];
    clientId?: string;
}

export interface TaskLog {
    id: string;
    start_time: string;
    end_time: string | null;
    duration_seconds: number;
    user: {
        full_name: string;
        avatar_url?: string;
        email: string;
        id: string;
    };
    task: {
        title: string;
        project: {
            name: string;
        } | null;
        client: {
            id: string;
            name: string;
        } | null;
    } | null;
}

const PIXELS_PER_HOUR = 60;
const TOTAL_HOURS = 24;

export default function DailyTimeline({ userIds, clientId }: DailyTimelineProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);
    const [selectedTask, setSelectedTask] = useState<TaskLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const targetUserIds = userIds && userIds.length > 0 ? userIds : (user?.id ? [user.id] : []);
    const isMultiUser = targetUserIds.length > 1;

    useEffect(() => {
        if (targetUserIds.length > 0) fetchDailyLogs();
        else setLoading(false);

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
                        id,
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

            const formattedLogs: TaskLog[] = (data || [])
                .map((log: any) => {
                    // Se vier array, pegue o primeiro elemento, senão use como está
                    const userObj = Array.isArray(log.user) ? log.user[0] : log.user;
                    const taskObj = Array.isArray(log.task) ? log.task[0] : log.task;

                    // Para project e client, que também podem ser arrays dentro do task
                    const projectObj = Array.isArray(taskObj?.project) ? taskObj.project[0] : taskObj?.project || null;
                    const clientObj = Array.isArray(taskObj?.client) ? taskObj.client[0] : taskObj?.client || null;

                    return {
                        id: log.id,
                        start_time: log.start_time,
                        end_time: log.end_time,
                        duration_seconds: log.duration_seconds,
                        user: userObj,
                        task: taskObj
                            ? {
                                ...taskObj,
                                project: projectObj,
                                client: clientObj
                            }
                            : null
                    };
                })
                .filter((log: TaskLog) => {
                    if (!log.task || !log.user) return false;
                    if (clientId && log.task.client?.id !== clientId) return false;
                    return true;
                });

            setLogs(formattedLogs || []);
        } catch (err) {
            console.error('Error fetching timeline:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPosition = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getHours() * PIXELS_PER_HOUR + d.getMinutes();
    };

    const getHeight = (durationSeconds: number) => Math.max(20, (durationSeconds / 3600) * PIXELS_PER_HOUR);

    const getColor = (task: TaskLog['task']) => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];
        if (!task?.client?.id) return '#6B7280';
        return colors[task.client.id.charCodeAt(0) % colors.length];
    };

    // Agrupa logs por usuário
    const logsByUser = targetUserIds.map(uid => ({
        user: logs.find(l => l.user.id === uid)?.user || { id: uid, full_name: 'Usuário', avatar_url: '' },
        logs: logs.filter(l => l.user.id === uid)
    }));

    // Scroll automático para primeira tarefa ou horário atual
    useEffect(() => {
        if (scrollRef.current && logs.length > 0) {
            const firstLogTop = getPosition(logs[0].start_time);
            scrollRef.current.scrollTop = firstLogTop - 40; // ajusta margem
        }
    }, [logs]);

    return (
        <>
            <div className="relative bg-surface-dark border border-gray-800 rounded-2xl shadow-xl h-[640px] flex flex-col overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-white text-lg font-semibold flex items-center gap-2 tracking-tight">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        Linha do Tempo (Hoje)
                        {isMultiUser && <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full ml-2">(Equipe)</span>}
                    </h3>
                </div>

                <div
                    ref={scrollRef}
                    className="relative flex-1 overflow-x-auto overflow-y-auto px-6 py-6 custom-scrollbar bg-background-dark/40 flex"
                >
                    {/* Usuário Columns */}
                    {logsByUser.map((col, idx) => (
                        <div key={col.user.id} className="flex-1 min-w-[200px] relative border-l border-gray-700/20 last:border-r">
                            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background-dark z-10 px-1 py-1 border-b border-gray-800">
                                {col.user.avatar_url ? (
                                    <img src={col.user.avatar_url} alt={col.user.full_name} className="w-6 h-6 rounded-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold">{col.user.full_name?.charAt(0)}</div>
                                )}
                                <span className="text-sm font-semibold text-white">{col.user.full_name}</span>
                            </div>

                            {/* Horas e Tarefas */}
                            <div className="relative">
                                {Array.from({ length: TOTAL_HOURS }).map((_, hour) => (
                                    <div key={hour} className="h-[60px] border-b border-gray-800/20 flex items-start px-2">
                                        <span className="text-[10px] text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
                                    </div>
                                ))}

                                {/* Logs */}
                                {col.logs.map(log => {
                                    const duration = log.end_time
                                        ? log.duration_seconds
                                        : (new Date().getTime() - new Date(log.start_time).getTime()) / 1000;
                                    const top = getPosition(log.start_time);
                                    const height = getHeight(duration);

                                    return (
                                        <div
                                            key={log.id}
                                            className="absolute left-2 right-2 rounded-xl text-xs text-white px-2 py-1 cursor-pointer shadow-md hover:opacity-90"
                                            style={{ top: `${top}px`, height: `${height}px`, backgroundColor: getColor(log.task) }}
                                            title={`${log.task?.title}\n${log.task?.client?.name} • ${new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${log.end_time ? new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}`}
                                            onClick={() => {
                                                setSelectedTask(log);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <div className="truncate font-semibold">{log.task?.title}</div>
                                            {height > 25 && (
                                                <div className="text-[10px] text-gray-200 truncate">
                                                    {log.task?.client?.name} • {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.end_time ? new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Current Time Indicator */}
                    <div
                        className="absolute left-0 right-0 h-[2px] bg-red-500/80 z-50 pointer-events-none"
                        style={{ top: currentTime.getHours() * PIXELS_PER_HOUR + currentTime.getMinutes() }}
                    />
                </div>

                {/* Empty State */}
                {logs.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-gray-500 opacity-50">
                            <span className="material-symbols-outlined text-5xl mb-2">history_toggle_off</span>
                            <p className="text-sm">Nenhum registro encontrado hoje</p>
                        </div>
                    </div>
                )}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
            />
        </>
    );
}