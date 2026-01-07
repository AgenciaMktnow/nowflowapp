import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ProductivityWidget } from '../components/ProductivityWidget';
import TaskActionMenu from '../components/TaskActionMenu';
import { taskService } from '../services/task.service'; // <--- NEW
import TaskEditDrawer from '../components/TaskEditDrawer'; // <--- NEW
import { extractChecklistFromHtml } from '../utils/checklist';
import Header from '../components/layout/Header/Header';
import { useClickOutside } from '../hooks/useClickOutside';

type Task = {
    id: string;
    title: string;
    description: string;
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date: string;
    created_at: string; // FIXED: updated_at -> created_at
    assignee_id?: string;
    project_id?: string;
    project?: {
        name: string;
        client_id?: string;
    };
    assignee?: {
        full_name: string;
        avatar_url?: string;
    };
    creator?: {
        id: string;
        full_name: string;
    };
    category: string;
    task_number: number;
    time_logs?: { duration_seconds: number | null }[];
};

type Client = {
    id: string;
    name: string;
};

type Project = {
    id: string;
    name: string;
    client_id?: string;
};

export default function Dashboard() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Filter States
    const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'MINE'>('MINE');


    // Complex Filter State (Project or Client)
    const [entityFilter, setEntityFilter] = useState<{ type: 'CLIENT' | 'PROJECT' | null, id: string | null, name: string | null }>({ type: null, id: null, name: null });
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    // Timer State
    const [activeTimerTask, setActiveTimerTask] = useState<any>(null);
    const [timerElapsedTime, setTimerElapsedTime] = useState(0);
    const [timerHistoricTime, setTimerHistoricTime] = useState(0);
    const [activeTimeLogId, setActiveTimeLogId] = useState<string | null>(null);

    // Active Team Logs (Manager View)
    const [activeTeamLogs, setActiveTeamLogs] = useState<Record<string, { user_name: string }>>({});

    // Edit Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editTaskNumber, setEditTaskNumber] = useState<string | undefined>(undefined);


    // Click-outside handler for filter dropdown
    useClickOutside(filterDropdownRef, () => setShowFilterDropdown(false));

    useEffect(() => {
        fetchTasks();
        fetchFilters();
        checkActiveTimer();
        checkActiveTeamLogs();

        // Poll for team activity every 5 seconds
        const teamPoll = setInterval(() => {
            checkActiveTeamLogs();
        }, 5000);

        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Anti-Drift: Re-sync timer when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkActiveTimer();
                checkActiveTeamLogs();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            clearInterval(teamPoll);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [user, userProfile]);

    // Separate Effect for Timer Interval
    useEffect(() => {
        let interval: any;
        if (activeTimerTask) {
            interval = setInterval(() => {
                setTimerElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTimerTask]);





    const checkActiveTimer = async () => {
        if (!user) return;
        try {
            // 1. Check for active time log
            const { data: activeLog } = await supabase
                .from('time_logs')
                .select(`
                    *,
                    task:tasks (
                        *,
                        project:projects(name),
                        assignee:users!tasks_assignee_id_fkey(full_name)
                    )
                `)
                .eq('user_id', user.id) // FIXED: Revert to user_id for time_logs
                .is('end_time', null)
                .single();

            if (activeLog && activeLog.task) {
                setActiveTimerTask(activeLog.task);
                setActiveTimeLogId(activeLog.id);

                // Calculate initial elapsed
                const startTime = new Date(activeLog.start_time).getTime();
                const now = new Date().getTime();
                setTimerElapsedTime(Math.floor((now - startTime) / 1000));

                // 2. Fetch historic time for this task
                const { data: historyData } = await supabase
                    .from('time_logs')
                    .select('duration_seconds')
                    .eq('task_id', activeLog.task_id)
                    .not('end_time', 'is', null);

                if (historyData) {
                    const total = historyData.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
                    setTimerHistoricTime(total);
                }
            } else {
                setActiveTimerTask(null);
                setActiveTimeLogId(null);
                setTimerElapsedTime(0);
                setTimerHistoricTime(0);
            }
        } catch (error) {
            console.error('Error checking active timer:', error);
        }
    };

    const checkActiveTeamLogs = async () => {
        try {
            // Use simpler implicit relationship query
            const { data: logs, error } = await supabase
                .from('time_logs')
                .select(`
                task_id,
                user:users(full_name)
            `)
                .is('end_time', null);

            if (error) {
                console.error('Error fetching team logs:', error);
                return;
            }

            if (logs) {
                const activeMap: Record<string, { user_name: string }> = {};
                logs.forEach((log: any) => {
                    if (log.task_id && log.user?.full_name) {
                        activeMap[log.task_id] = { user_name: log.user.full_name };
                    }
                });
                setActiveTeamLogs(activeMap);
            }
        } catch (error) {
            console.error('Error checking active team logs:', error);
        }
    };

    const handlePauseTimer = async () => {
        if (!activeTimeLogId) return;
        try {
            // Fetch start time to calculate precise duration (Anti-Drift)
            const { data: logEntry } = await supabase
                .from('time_logs')
                .select('start_time')
                .eq('id', activeTimeLogId)
                .single();

            if (!logEntry) return;

            const startTime = new Date(logEntry.start_time).getTime();
            const now = new Date().getTime();
            const finalDuration = Math.floor((now - startTime) / 1000);

            const { error } = await supabase
                .from('time_logs')
                .update({
                    end_time: new Date().toISOString(),
                    duration_seconds: finalDuration
                })
                .eq('id', activeTimeLogId);

            if (error) throw error;

            // Also update task status to WAITING_CLIENT (Paused Column)
            if (activeTimerTask) {
                await supabase
                    .from('tasks')
                    .update({ status: 'WAITING_CLIENT' })
                    .eq('id', activeTimerTask.id);
            }

            // Re-fetch to update state
            checkActiveTimer();
            fetchTasks(); // Refresh board columns
        } catch (error) {
            console.error('Error pausing timer:', error);
        }
    };

    const fetchFilters = async () => {
        try {
            const { data: clientsData } = await supabase.from('clients').select('id, name').order('name');
            if (clientsData) setClients(clientsData);

            const { data: projectsData } = await supabase.from('projects').select('id, name, client_id').order('name');
            if (projectsData) setProjects(projectsData);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchTasks = async () => {
        if (!user) return;
        try {
            // Secure Query Logic
            // Default: Restricted to Assignee
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    client:client_id(name),
                    project:projects(name, client_id, client:client_id(name)),
                    assignee:users!tasks_assignee_id_fkey(full_name, avatar_url),
                    creator:users!tasks_created_by_fkey(id, full_name),
                    task_assignees(
                        user_id
                    ),
                    time_logs(duration_seconds)
                `)
                .order('created_at', { ascending: false });

            // Rule: MEMEBER/CLIENT sees ONLY their assigned tasks (Strict DB Filter)
            const isElevated = userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER';
            if (!isElevated) {
                query = query.eq('assignee_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        // 1. Filter by "Mine" vs "All"
        if (ownerFilter === 'MINE') {
            if (!user) return false;
            // MINE Filter Logic:
            // 1. Tasks assigned to me
            const isAssignee = task.assignee_id === user.id;

            // 2. Creator View: If Admin/Manager, show tasks created by me but assigned to others
            const isCreator = (userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER') && task.creator?.id === user.id;

            if (!isAssignee && !isCreator) return false;
        }



        // 3. Filter by Project or Client
        if (entityFilter.type === 'PROJECT') {
            if (task.project_id !== entityFilter.id) return false;
        } else if (entityFilter.type === 'CLIENT') {
            if (task.project?.client_id !== entityFilter.id) return false;
        }

        return true;
    });

    // Derived State from Filtered Tasks
    // Derived State from Filtered Tasks
    const openTasks = filteredTasks.filter(t => ['TODO', 'BACKLOG', 'IN_PROGRESS', 'REVIEW'].includes(t.status));
    const pausedTasks = filteredTasks.filter(t => ['WAITING_CLIENT'].includes(t.status));
    const doneTasks = filteredTasks.filter(t => t.status === 'DONE');




    // Smart Suggestion Logic
    const suggestedTask = (() => {
        // 1. Must be open and assigned to user (not just created by them)
        const candidates = filteredTasks.filter(t =>
            ['TODO', 'IN_PROGRESS', 'WAITING_CLIENT'].includes(t.status) &&
            t.assignee_id === user?.id
        );

        if (candidates.length === 0) return null;

        // 2. Sort by Priority (HIGH > MEDIUM > LOW) then Due Date
        return candidates.sort((a, b) => {
            const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            const diffPriority = priorityWeight[b.priority] - priorityWeight[a.priority];
            if (diffPriority !== 0) return diffPriority;

            // If same priority, check due date (earlier is better)
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        })[0];
    })();

    // Summary Metrics
    const dueTodayCount = filteredTasks.filter(t => {
        if (!t.due_date || t.status === 'DONE') return false;
        const today = new Date().toDateString();
        return new Date(t.due_date).toDateString() === today;
    }).length;

    const waitingReviewCount = filteredTasks.filter(t => t.status === 'REVIEW').length;

    const doneThisWeekCount = tasks.filter(t => { // Use 'tasks' to see global personal done? Or filteredTasks? User said "Total Done in Week". Filtered makes sense for "My Performance".
        if (t.status !== 'DONE' || !t.created_at) return false;
        const taskDate = new Date(t.created_at);
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
        return taskDate >= firstDayOfWeek;
    }).length;

    // --- QUICK ACTIONS HANDLERS ---
    const handleEdit = (task: any) => {
        setEditTaskNumber(String(task.task_number));
        setIsDrawerOpen(true);
    };

    const handleCloneSuccess = (newTask: any) => {
        fetchTasks(); // Refresh board
        // Auto-open new task
        if (newTask?.task_number) {
            setEditTaskNumber(String(newTask.task_number));
            setIsDrawerOpen(true);
        }
    };

    const handleUpdateList = () => {
        fetchTasks();
    };
    // ------------------------------


    const handleStartTask = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        // Remove activeTimerTask check to allow auto-switch
        if (!user) return;

        try {
            await taskService.startTimer(task.id, user.id);
            setActiveTimerTask(task);
            fetchTasks(); checkActiveTimer();
        } catch (error) { console.error(error); }
    };

    const handleQuickComplete = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        try {
            // Find 'Done' column id purely for consistency if possible, fallback to just status
            const { data: doneCol } = await supabase.from('kanban_columns').select('id').eq('title', 'Done').single();
            const updates: any = { status: 'DONE' };
            if (doneCol) updates.column_id = doneCol.id;

            await supabase.from('tasks').update(updates).eq('id', task.id);
            fetchTasks();
        } catch (error) { console.error(error); }
    };



    const formatTimer = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return {
            h: hours.toString().padStart(2, '0'),
            m: minutes.toString().padStart(2, '0'),
            s: seconds.toString().padStart(2, '0')
        };
    };

    const currentTimerDisplay = activeTimerTask ? formatTimer(timerHistoricTime + timerElapsedTime) : { h: '00', m: '00', s: '00' };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <Header
                title="Dashboard"
            />

            <div className="flex-1 overflow-y-auto p-8 pb-20 scroll-smooth">
                <div className="max-w-7xl mx-auto flex flex-col gap-8">
                    {/* Filter / Action Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-surface-highlight p-1.5 rounded-xl flex items-center shrink-0">
                                <button
                                    onClick={() => setOwnerFilter('MINE')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all border ${ownerFilter === 'MINE' ? 'bg-background-dark text-white border-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5 border-transparent'}`}>
                                    Minhas Tarefas
                                </button>
                                {userProfile?.role === 'ADMIN' && (
                                    <button
                                        onClick={() => setOwnerFilter('ALL')}
                                        className={`px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all border ${ownerFilter === 'ALL' ? 'bg-background-dark text-white border-white/5' : 'text-text-secondary hover:text-white hover:bg-white/5 border-transparent'}`}>
                                        Todas
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Filter */}
                            <div className="relative shrink-0" ref={filterDropdownRef}>
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilterDropdown
                                        ? 'bg-surface-highlight/50 border-primary ring-2 ring-primary/50 shadow-[0_0_20px_rgba(19,236,91,0.3)] text-white'
                                        : (entityFilter.type
                                            ? 'bg-primary/20 border-primary text-primary hover:border-primary/50'
                                            : 'bg-surface-highlight/50 border-surface-highlight text-text-secondary hover:text-white hover:bg-surface-highlight/80 hover:border-primary/30')
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                                    <span>{entityFilter.name || 'Projetos ou Clientes'}</span>
                                    {entityFilter.type ? (
                                        <span onClick={(e) => { e.stopPropagation(); setEntityFilter({ type: null, id: null, name: null }); }} className="material-symbols-outlined text-[16px] hover:text-white">close</span>
                                    ) : (
                                        <span className={`material-symbols-outlined text-[20px] transition-transform ${showFilterDropdown ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
                                    )}
                                </button>

                                {showFilterDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            {/* Clients Section */}
                                            {clients.length > 0 && (
                                                <div className="p-2 border-b border-white/5">
                                                    <p className="px-3 py-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">Clientes</p>
                                                    {clients.map(client => (
                                                        <button
                                                            key={client.id}
                                                            onClick={() => { setEntityFilter({ type: 'CLIENT', id: client.id, name: client.name }); setShowFilterDropdown(false); }}
                                                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                                                        >
                                                            <span>{client.name}</span>
                                                            {entityFilter.type === 'CLIENT' && entityFilter.id === client.id && <span className="material-symbols-outlined text-primary text-[16px]">check</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Projects Section */}
                                            {projects.length > 0 && (
                                                <div className="p-2">
                                                    <p className="px-3 py-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">Projetos</p>
                                                    {projects.map(project => (
                                                        <button
                                                            key={project.id}
                                                            onClick={() => { setEntityFilter({ type: 'PROJECT', id: project.id, name: project.name }); setShowFilterDropdown(false); }}
                                                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                                                        >
                                                            <span>{project.name}</span>
                                                            {entityFilter.type === 'PROJECT' && entityFilter.id === project.id && <span className="material-symbols-outlined text-primary text-[16px]">check</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {clients.length === 0 && projects.length === 0 && (
                                                <div className="p-4 text-center text-text-secondary text-sm">
                                                    Nenhum filtro disponível
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/tasks/new')}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-[#0fd650] text-background-dark px-6 py-3 rounded-xl font-bold shadow-[0_4px_20px_rgba(19,236,91,0.2)] hover:shadow-[0_6px_25px_rgba(19,236,91,0.3)] hover:-translate-y-0.5 transition-all w-full md:w-auto shrink-0 active:scale-95">
                            <span className="material-symbols-outlined">add</span>
                            <span>Nova Tarefa</span>
                        </button>
                    </div>

                    {/* Widgets Section */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Metrics & Timer Container (Col Span 8) */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Summary Metrics Row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-surface-highlight/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <span className="text-3xl font-bold text-white">{dueTodayCount}</span>
                                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider text-center">Vencendo Hoje</span>
                                </div>
                                <div className="bg-surface-highlight/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <span className="text-3xl font-bold text-white">{waitingReviewCount}</span>
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider text-center">Aguardando Revisão</span>
                                </div>
                                <div className="bg-surface-highlight/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <span className="text-3xl font-bold text-primary">{doneThisWeekCount}</span>
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider text-center">Concluído na Semana</span>
                                </div>
                            </div>

                            {/* Timer / Active Task Widget */}
                            <div className="bg-surface-highlight rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-9xl text-primary">timer</span>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${activeTimerTask ? 'bg-primary/20 text-primary' : (suggestedTask ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-highlight text-text-muted')}`}>
                                                {activeTimerTask ? 'Em Andamento' : (suggestedTask ? 'Sugestão Inteligente' : 'Sem Atividade')}
                                            </span>
                                            <span className="text-text-secondary text-xs">• {(() => {
                                                const t = activeTimerTask || suggestedTask;
                                                if (!t) return 'Geral';
                                                return (t as any).client?.name || (t.project as any)?.client?.name || t.project?.name || 'Geral';
                                            })()}</span>
                                        </div>
                                        <h3
                                            className="text-2xl font-bold text-white mb-1 cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => (activeTimerTask || suggestedTask) && navigate(`/tasks/${(activeTimerTask || suggestedTask).task_number}`)}
                                        >
                                            {activeTimerTask?.title || suggestedTask?.title || 'Nenhuma tarefa iniciada'}
                                        </h3>
                                        <p className="text-text-secondary text-sm">
                                            {activeTimerTask
                                                ? `Responsável: ${activeTimerTask.assignee?.full_name || 'Você'}`
                                                : (suggestedTask ? 'Sua próxima missão. Clique para iniciar.' : 'Dê play em uma tarefa para começar a trackear.')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6 bg-background-dark/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <div className="flex gap-3 text-center">
                                            <div className="flex flex-col gap-1 w-12">
                                                <div className="text-2xl font-mono font-bold text-white">{currentTimerDisplay.h}</div>
                                                <span className="text-[10px] uppercase text-text-secondary tracking-wider">Hr</span>
                                            </div>
                                            <div className="text-2xl font-mono font-bold text-primary">:</div>
                                            <div className="flex flex-col gap-1 w-12">
                                                <div className="text-2xl font-mono font-bold text-white">{currentTimerDisplay.m}</div>
                                                <span className="text-[10px] uppercase text-text-secondary tracking-wider">Min</span>
                                            </div>
                                            <div className="text-2xl font-mono font-bold text-primary">:</div>
                                            <div className="flex flex-col gap-1 w-12">
                                                <div className="text-2xl font-mono font-bold text-white">{currentTimerDisplay.s}</div>
                                                <span className="text-[10px] uppercase text-text-secondary tracking-wider">Seg</span>
                                            </div>
                                        </div>
                                        <div className="h-10 w-[1px] bg-white/10 mx-2"></div>
                                        {activeTimerTask ? (
                                            <button
                                                onClick={handlePauseTimer}
                                                className="flex items-center justify-center size-12 rounded-full bg-primary hover:bg-[#0fd650] text-background-dark transition-all shadow-[0_0_15px_rgba(19,236,91,0.3)] hover:scale-105 active:scale-95"
                                                title="Pausar Timer"
                                            >
                                                <span className="material-symbols-outlined text-[28px] fill">pause</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => suggestedTask && handleStartTask(e, suggestedTask)}
                                                className={`flex items-center justify-center size-12 rounded-full transition-all ${suggestedTask ? 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-background-dark shadow-[0_0_15px_rgba(19,236,91,0.1)] hover:scale-105 cursor-pointer' : 'bg-surface-highlight text-text-muted cursor-not-allowed'}`}
                                                disabled={!suggestedTask}
                                                title={suggestedTask ? "Iniciar Tarefa Sugerida" : "Nenhuma tarefa para iniciar"}
                                            >
                                                <span className="material-symbols-outlined text-[28px] fill">play_arrow</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Productivity / Gamification Widget */}
                        <div className="lg:col-span-4 h-full">
                            <ProductivityWidget />
                        </div>
                    </section>

                    {/* Columns Section */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        {/* Em Aberto Column */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-white"></div>
                                    <h3 className="text-white font-bold">Em Aberto</h3>
                                    <span className="text-xs text-text-secondary bg-surface-highlight px-2 py-0.5 rounded-full">{openTasks.length}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/tasks/new?status=TODO')}
                                    className="text-text-secondary hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>

                            {openTasks.map(task => (
                                <div key={task.id} onClick={() => navigate(`/tasks/${task.task_number}`)} className={`bg-surface-highlight hover:bg-[#2a5538] transition-colors p-4 rounded-xl cursor-pointer group border border-transparent hover:border-white/5 relative ${task.priority === 'HIGH' ? 'border-l-[4px] !border-l-orange-500' : (task.priority === 'MEDIUM' ? 'border-l-[4px] !border-l-blue-500' : '')} ${task.status === 'REVIEW' ? 'border-purple-500/50 hover:border-purple-500' : ''}`}>
                                    {/* Quick Actions Hover */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); activeTimerTask?.id === task.id ? handlePauseTimer() : handleStartTask(e, task); }}
                                            className={`size-8 rounded-full flex items-center justify-center transition-all shadow-lg ${activeTimerTask?.id === task.id ? 'bg-primary text-background-dark hover:scale-105' : 'bg-primary/20 hover:bg-primary text-primary hover:text-background-dark'}`}
                                            title={activeTimerTask?.id === task.id ? "Pausar Tarefa" : "Iniciar Tarefa"}
                                        >
                                            <span className="material-symbols-outlined text-lg fill">{activeTimerTask?.id === task.id ? 'pause' : 'play_arrow'}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleQuickComplete(e, task)}
                                            className="size-8 rounded-full bg-surface-dark hover:bg-green-500 flex items-center justify-center text-white transition-all shadow-lg border border-white/10"
                                            title="Concluir"
                                        >
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        </button>
                                        <div className="size-8 flex items-center justify-center">
                                            <TaskActionMenu
                                                task={task}
                                                onEdit={() => handleEdit(task)}
                                                onClone={handleCloneSuccess}
                                                onUpdate={handleUpdateList}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start mb-3 pr-24">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {(() => {
                                                const taskClientName = (task as any).client?.name;
                                                const projectClientName = (task.project as any)?.client?.name;
                                                const lookupClientName = clients.find(c => c.id === task.project?.client_id)?.name;
                                                const displayText = taskClientName || projectClientName || lookupClientName || task.project?.name;

                                                return displayText ? (
                                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#38bdf8]/10 text-[#38bdf8] uppercase truncate max-w-[150px]">
                                                        {displayText}
                                                    </span>
                                                ) : null;
                                            })()}
                                            {task.status === 'REVIEW' && (
                                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase tracking-wider border border-purple-500/20">Review</span>
                                            )}
                                            {/* Creator View: Delegated Tag */}
                                            {(userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER') && task.creator?.id === user?.id && task.assignee_id !== user?.id && (
                                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20">
                                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Delegada</span>
                                                    {task.assignee?.avatar_url && (
                                                        <img src={task.assignee.avatar_url} className="size-3 rounded-full" alt="Assignee" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h4 className="text-white font-medium mb-3 group-hover:text-primary transition-colors">{task.title}</h4>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-end gap-4 w-full">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    {task.due_date ? (
                                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) || new Date(task.due_date).toDateString() === new Date().toDateString() ? 'text-red-500' : 'text-text-secondary'}`}>
                                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                            <span>
                                                                {(() => {
                                                                    const [y, m, d] = task.due_date!.split('T')[0].split('-').map(Number);
                                                                    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                                                })()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-[11px] text-text-muted" title="Tarefa Contínua">
                                                            <span className="material-symbols-outlined text-sm">all_inclusive</span>
                                                            <span>Contínua</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Checklist Bar */}
                                                {(() => {
                                                    const stats = extractChecklistFromHtml(task.description || '');
                                                    if (stats.total === 0) return null;
                                                    const progress = Math.round((stats.completed / stats.total) * 100);
                                                    return (
                                                        <div className="w-full max-w-[120px]">
                                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#00FF00] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Total Time Badge */}
                                            {(() => {
                                                const totalSeconds = task.time_logs?.reduce((acc, log) => acc + (log.duration_seconds || 0), 0) || 0;
                                                if (totalSeconds > 0 && activeTimerTask?.id !== task.id) {
                                                    return (
                                                        <div className="flex items-center gap-1 bg-surface-dark/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-text-secondary border border-white/5" title="Tempo Total">
                                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                                            <span>{formatTimer(totalSeconds).h}:{formatTimer(totalSeconds).m}</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {/* Active Team Indicator */}
                                            {activeTeamLogs[task.id] && (
                                                <div className="flex items-center gap-1 bg-[#13ec5b]/10 px-2 py-0.5 rounded-full border border-[#13ec5b]/20" title={`Em andamento por: ${activeTeamLogs[task.id].user_name}`}>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ec5b] opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13ec5b]"></span>
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#13ec5b] truncate max-w-[60px]">{activeTeamLogs[task.id].user_name.split(' ')[0]}</span>
                                                </div>
                                            )}

                                            {task.assignee ? (
                                                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary" title={task.assignee.full_name}>
                                                    {task.assignee.full_name.charAt(0)}
                                                </div>
                                            ) : (
                                                <div className="size-6 rounded-full bg-gray-600"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {openTasks.length === 0 && <p className="text-center text-gray-600 font-medium text-sm py-8">Nenhuma tarefa por aqui</p>}
                        </div>

                        {/* Em Pausa Column */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-blue-500"></div>
                                    <h3 className="text-white font-bold">Em Pausa</h3>
                                    <span className="text-xs text-text-secondary bg-surface-highlight px-2 py-0.5 rounded-full">{pausedTasks.length}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/tasks/new?status=WAITING_CLIENT')}
                                    className="text-text-secondary hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>

                            {pausedTasks.map(task => (
                                <div key={task.id} onClick={() => navigate(`/tasks/${task.task_number}`)} className="bg-surface-highlight/50 p-4 rounded-xl border border-dashed border-white/10 opacity-75 hover:opacity-100 transition-opacity cursor-pointer relative group">
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => handleStartTask(e, task)}
                                            className="size-8 rounded-full bg-primary/20 hover:bg-primary flex items-center justify-center text-primary hover:text-background-dark transition-all shadow-lg"
                                            title="Continuar Tarefa"
                                        >
                                            <span className="material-symbols-outlined text-lg fill">play_arrow</span>
                                        </button>
                                        <TaskActionMenu
                                            task={task}
                                            onEdit={() => handleEdit(task)}
                                            onClone={handleCloneSuccess}
                                            onUpdate={handleUpdateList}
                                        />
                                    </div>
                                    <div className="flex justify-between items-start mb-3 pr-8">
                                        {(() => {
                                            const taskClientName = (task as any).client?.name;
                                            const projectClientName = (task.project as any)?.client?.name;
                                            const lookupClientName = clients.find(c => c.id === task.project?.client_id)?.name;
                                            const displayText = taskClientName || projectClientName || lookupClientName || task.project?.name;

                                            return displayText ? (
                                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 uppercase truncate max-w-[150px]">
                                                    {displayText}
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>
                                    <h4 className="text-white font-medium mb-3">{task.title}</h4>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                                            {task.due_date ? (
                                                <div className={`flex items-center gap-1.5 ${new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) ? 'text-red-500' : 'text-text-secondary'}`}>
                                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                    <span>
                                                        {(() => {
                                                            const [y, m, d] = task.due_date!.split('T')[0].split('-').map(Number);
                                                            return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                                        })()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[11px] text-text-muted" title="Tarefa Contínua">
                                                    <span className="material-symbols-outlined text-sm">all_inclusive</span>
                                                    <span>Contínua</span>
                                                </div>
                                            )}
                                        </div>
                                        {task.assignee ? (
                                            <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {task.assignee.full_name.slice(0, 2).toUpperCase()}
                                            </div>
                                        ) : <div className="size-6 rounded-full bg-gray-600"></div>}
                                        {/* Total Time Badge */}
                                        {(() => {
                                            const totalSeconds = task.time_logs?.reduce((acc, log) => acc + (log.duration_seconds || 0), 0) || 0;
                                            if (totalSeconds > 0) {
                                                return (
                                                    <div className="flex items-center gap-1 bg-surface-dark/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-text-secondary border border-white/5" title="Tempo Total">
                                                        <span className="material-symbols-outlined text-xs">schedule</span>
                                                        <span>{formatTimer(totalSeconds).h}:{formatTimer(totalSeconds).m}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            ))}

                            {pausedTasks.length === 0 && <p className="text-center text-gray-600 font-medium text-sm py-8">Nenhuma tarefa por aqui</p>}
                        </div>

                        {/* Concluído Column */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-primary"></div>
                                    <h3 className="text-white font-bold">Concluído</h3>
                                    <span className="text-xs text-text-secondary bg-surface-highlight px-2 py-0.5 rounded-full">{doneTasks.length}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/tasks/new?status=DONE')}
                                    className="text-text-secondary hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>

                            {doneTasks.map(task => (
                                <div key={task.id} onClick={() => navigate(`/tasks/${task.task_number}`)} className="bg-surface-highlight p-4 rounded-xl border-l-[6px] border-primary/20 hover:border-primary opacity-60 hover:opacity-100 transition-all cursor-pointer relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <TaskActionMenu
                                            task={task}
                                            onEdit={() => handleEdit(task)}
                                            onClone={handleCloneSuccess}
                                            onUpdate={handleUpdateList}
                                        />
                                    </div>
                                    <div className="flex justify-between items-start mb-2 pr-8">
                                        {(() => {
                                            const taskClientName = (task as any).client?.name;
                                            const projectClientName = (task.project as any)?.client?.name;
                                            const lookupClientName = clients.find(c => c.id === task.project?.client_id)?.name;
                                            const displayText = taskClientName || projectClientName || lookupClientName || task.project?.name;

                                            return displayText ? (
                                                <span className="text-primary line-through text-xs font-bold uppercase truncate max-w-[150px]">
                                                    {displayText}
                                                </span>
                                            ) : null;
                                        })()}
                                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                    </div>
                                    <h4 className="text-text-secondary line-through font-medium mb-3">{task.title}</h4>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                        <span className="text-[10px] text-text-secondary">Concluído</span>
                                        <div className="flex items-center gap-2">
                                            {/* Done Column Total Time Badge */}
                                            {(() => {
                                                const totalSeconds = task.time_logs?.reduce((acc, log) => acc + (log.duration_seconds || 0), 0) || 0;
                                                if (totalSeconds > 0) {
                                                    return (
                                                        <div className="flex items-center gap-1 bg-surface-dark/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-text-secondary border border-white/5 opacity-50" title="Tempo Total">
                                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                                            <span>{formatTimer(totalSeconds).h}:{formatTimer(totalSeconds).m}</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            <div className="size-6 rounded-full bg-gray-600 grayscale"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {doneTasks.length === 0 && <p className="text-center text-gray-600 font-medium text-sm py-8">Nenhuma tarefa por aqui</p>}
                        </div>
                    </section>
                </div >
            </div >

            {/* Edit Drawer Modal */}
            < TaskEditDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditTaskNumber(undefined);
                }
                }
                taskNumber={editTaskNumber}
                onSuccess={handleUpdateList}
            />
        </div >
    );
}
