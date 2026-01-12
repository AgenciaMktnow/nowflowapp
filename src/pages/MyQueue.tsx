import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header/Header';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import Dropdown from '../components/common/Dropdown';
import TaskActionMenu from '../components/TaskActionMenu';
import TaskEditDrawer from '../components/TaskEditDrawer';
import SelectDropdown from '../components/SelectDropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import WorkloadBoard from '../components/WorkloadBoard';
import { taskService } from '../services/task.service';

type Task = {
    id: string;
    title: string;
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date: string;
    updated_at: string;
    created_at: string;
    created_by?: string;
    assignee_id?: string;
    project_id?: string;
    queue_position?: number;
    project?: {
        name: string;
        client_id?: string;
        client?: { name: string };
    };
    client?: { name: string };
    assignee?: {
        full_name: string;
        avatar_url?: string;
    };
    creator?: {
        id: string;
        full_name: string;
    };
    task_number: number;
    time_logs?: { duration_seconds: number | null }[];

    // Board logic
    board_id?: string; // Resolved effective board ID
    task_boards?: { board_id: string }[];
    column_id?: string;
    is_continuous?: boolean;
};

export default function MyQueue() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'MINE' | 'CREATED' | 'REVIEW'>('MINE');
    const [viewMode, setViewMode] = useState<'PERSONAL' | 'WORKLOAD'>('PERSONAL');

    // Workload View State
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const [activeTimerTask, setActiveTimerTask] = useState<any>(null);
    const [timerElapsedTime, setTimerElapsedTime] = useState(0);
    const [historicTime, setHistoricTime] = useState(0); // Add state for historic time
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Initial Fetch for Workload
    useEffect(() => {
        const fetchTeams = async () => {
            const { data } = await supabase.from('teams').select('*').order('name');
            if (data) setTeams(data);
        };
        fetchTeams();
    }, []);

    // Fetch Users when Team Changes
    useEffect(() => {
        setSelectedUserIds([]); // Reset user selection when team changes
        const fetchUsers = async () => {
            let query = supabase.from('users').select('id, full_name, avatar_url').order('full_name');

            if (selectedTeam) {
                // Fetch users in this team. Using a trick or separate query? 
                // Projects.tsx used 'user_teams'.
                const { data: teamMembers } = await supabase.from('user_teams').select('user_id').eq('team_id', selectedTeam);
                const memberIds = teamMembers?.map(tm => tm.user_id) || [];
                if (memberIds.length > 0) {
                    query = query.in('id', memberIds);
                } else {
                    setAvailableUsers([]);
                    return;
                }
            }

            const { data } = await query;
            if (data) setAvailableUsers(data);
        };

        fetchUsers();
    }, [selectedTeam]);

    // Quick Actions State
    const [editTaskNumber, setEditTaskNumber] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleEdit = (task: Task) => {
        setEditTaskNumber(String(task.task_number));
        setIsDrawerOpen(true);
    };

    const handleDrawerSuccess = () => {
        setIsDrawerOpen(false);
        setEditTaskNumber(null);
        fetchTasks(); // Refresh list to show changes
        checkActiveTimer(); // Refresh timer to include any manual time added
    };

    const handleCloneSuccess = (newTask: any) => {
        fetchTasks();
        if (newTask?.task_number) {
            setEditTaskNumber(String(newTask.task_number));
            setIsDrawerOpen(true);
        }
    };

    const handleUpdateList = () => {
        fetchTasks();
    };



    // Toolbar controls
    const [statusFilter, setStatusFilter] = useState<'OPEN' | 'OPEN_MY_PART_DONE' | 'DELIVERED'>('OPEN');
    const [sortOrder, setSortOrder] = useState<'PRIORITY' | 'TITLE' | 'CREATED_AT' | 'URGENCY' | 'MANUAL'>('PRIORITY');

    useEffect(() => {
        if (user) {
            fetchTasks(); checkActiveTimer();
        }
        const interval = setInterval(() => {
            if (activeTimerTask) setTimerElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [user, activeTab, activeTimerTask?.id]);

    // Anti-Freeze & Cross-Tab Sync
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('MyQueue: Tab visible - Resyncing timer...');
                checkActiveTimer();
                fetchTasks(); // Also refresh task list to reflect status changes from other tabs
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange); // Extra safety for window focus
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [user]);

    useEffect(() => {
        let filtered: Task[] = [];
        filtered = tasks.filter(task => {
            if (activeTab === 'MINE') return task.assignee_id === user?.id;
            if (activeTab === 'CREATED') return task.created_by === user?.id;
            if (activeTab === 'REVIEW') return task.status === 'REVIEW' && (task.assignee_id === user?.id || task.created_by === user?.id);
            return false;
        });



        setDisplayTasks(filtered);
    }, [tasks, activeTab, user?.id]);

    const [kanbanColumns, setKanbanColumns] = useState<Record<string, any[]>>({});

    // Helper to map variant to statuses (replicated from board.service.ts)
    const getStatusesForVariant = (variant: string): string[] => {
        switch (variant) {
            case 'default': return ['TODO', 'BACKLOG'];
            case 'progress': return ['IN_PROGRESS'];
            case 'review': return ['WAITING_CLIENT', 'REVIEW'];
            case 'done': return ['DONE'];
            default: return ['TODO'];
        }
    };

    const fetchTasks = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('tasks')
                .select(`
                    *,
                    client:client_id(name),
                    project:projects(name, client_id, board_id, client:client_id(name)),
                    assignee:users!tasks_assignee_id_fkey(full_name, avatar_url),
                    creator:users!tasks_created_by_fkey(id, full_name),
                    time_logs(duration_seconds),
                    task_boards(board_id)
                `)
                .or(`assignee_id.eq.${user.id},created_by.eq.${user.id}`)
                .neq('status', 'DONE')
                .order('position', { ascending: true });

            if (data) {
                // 1. Resolve Effective Board ID for each task
                const processedTasks = data.map((t: any) => {
                    const explicitBoardId = t.task_boards?.[0]?.board_id;
                    const projectBoardId = t.project?.board_id;
                    return {
                        ...t,
                        board_id: explicitBoardId || projectBoardId
                    };
                });

                // 2. Fetch columns for unique Board IDs
                const uniqueBoardIds = Array.from(new Set(processedTasks.map((t: any) => t.board_id).filter(Boolean))) as string[];

                if (uniqueBoardIds.length > 0) {
                    const { data: colsData } = await supabase
                        .from('board_columns')
                        .select('*')
                        .in('board_id', uniqueBoardIds)
                        .order('position', { ascending: true });

                    if (colsData) {
                        const colsMap: Record<string, any[]> = {};

                        // Group by board_id
                        colsData.forEach(col => {
                            if (!colsMap[col.board_id]) colsMap[col.board_id] = [];
                            colsMap[col.board_id].push({
                                ...col,
                                statuses: getStatusesForVariant(col.variant)
                            });
                        });
                        setKanbanColumns(colsMap);
                    }
                }

                // Fallback: Sort tasks with null position to the end
                const sortedTasks = (processedTasks || []).sort((a: any, b: any) => {
                    if (a.position === null && b.position === null) return 0;
                    if (a.position === null) return 1;
                    if (b.position === null) return -1;
                    return a.position - b.position;
                });
                setTasks(sortedTasks);
            }
        } catch (error) { console.error('Error fetching queue:', error); }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        // Auto-switch to MANUAL sort when user drags
        setSortOrder('MANUAL');

        const items = Array.from(displayTasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setDisplayTasks(items);

        try {
            const updates = items.map((task, index) => ({ id: task.id, queue_position: index }));
            for (const u of updates) {
                await supabase.from('tasks').update({ queue_position: u.queue_position }).eq('id', u.id);
            }
        } catch (e) { console.error("Could not persist order:", e); }
    };

    const checkActiveTimer = async () => {
        if (!user) return;
        const { data: activeLog } = await supabase.from('time_logs').select('*, task:tasks(*)').eq('user_id', user.id).is('end_time', null).single();

        if (activeLog && activeLog.task) {
            setActiveTimerTask(activeLog.task);
            const startTime = new Date(activeLog.start_time).getTime();
            setTimerElapsedTime(Math.floor((new Date().getTime() - startTime) / 1000));

            // FETCH HISTORIC TIME FOR THIS TASK
            const { data: historyData } = await supabase
                .from('time_logs')
                .select('duration_seconds')
                .eq('task_id', activeLog.task.id)
                .not('end_time', 'is', null);

            if (historyData) {
                const total = historyData.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
                setHistoricTime(total);
            } else {
                setHistoricTime(0);
            }

        } else {
            setActiveTimerTask(null);
            setTimerElapsedTime(0);
            setHistoricTime(0);
        }
    };

    const handleStartTask = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        // Allow starting even if activeTimerTask exists (Auto-Switch logic in service handles it)
        if (!user) return;

        try {
            await taskService.startTimer(task.id, user.id);
            setActiveTimerTask(task); fetchTasks(); checkActiveTimer();
        } catch (error) { console.error(error); }
    };

    const handlePauseTimer = async (e: React.MouseEvent) => {
        e.stopPropagation(); if (!activeTimerTask) return;
        const { data: activeLog } = await supabase.from('time_logs').select('id, start_time').eq('user_id', user?.id).is('end_time', null).single();
        if (activeLog) {
            // Calculate final duration to be safe
            const startTime = new Date(activeLog.start_time).getTime();
            const now = new Date().getTime();
            const finalDuration = Math.floor((now - startTime) / 1000);

            await supabase.from('time_logs').update({
                end_time: new Date().toISOString(),
                duration_seconds: finalDuration
            }).eq('id', activeLog.id);

            await supabase.from('tasks').update({ status: 'WAITING_CLIENT' }).eq('id', activeTimerTask.id);
            setActiveTimerTask(null); fetchTasks();
        }
    };

    const handleQuickComplete = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        try {
            const { data: doneCol } = await supabase.from('kanban_columns').select('id').eq('title', 'Done').single();
            const updates: any = { status: 'DONE' };
            if (doneCol) updates.column_id = doneCol.id;
            await supabase.from('tasks').update(updates).eq('id', task.id);
            fetchTasks();
        } catch (error) { console.error(error); }
    };

    const formatTimer = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleStatusChange = async (newStatus: Task['status'], task: Task, specificColumnId?: string) => {

        try {
            // Find appropriate column_id for the new status
            const statusColumnMap: Record<string, string> = {
                'TODO': 'TODO',
                'IN_PROGRESS': 'In Progress',
                'WAITING_CLIENT': 'Waiting Client',
                'REVIEW': 'Review',
                'DONE': 'Done'
            };

            if (specificColumnId) {
                // Option 2: Direct update with specific column ID (Robust)
                const updates: any = { status: newStatus || 'TODO', column_id: specificColumnId };
                await supabase.from('tasks').update(updates).eq('id', task.id);
            } else {
                // Fallback: Infer column from status (Fragile)
                const { data: column } = await supabase
                    .from('kanban_columns')
                    .select('id')
                    .eq('title', statusColumnMap[newStatus])
                    .single();

                const updates: any = { status: newStatus };
                if (column) updates.column_id = column.id;

                await supabase.from('tasks').update(updates).eq('id', task.id);
            }

            // Optimistic Update
            setTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { ...t, status: newStatus || 'TODO', column_id: specificColumnId || t.column_id } // Update both status and column_id
                    : t
            ));

            // Refresh tasks ensure consistency
            fetchTasks();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusConfig = (status: Task['status']) => {
        const configs = {
            'BACKLOG': { label: 'Backlog', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
            'TODO': { label: 'A Fazer', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            'IN_PROGRESS': { label: 'Em Andamento', color: 'bg-primary/10 text-primary border-primary/20' },
            'WAITING_CLIENT': { label: 'Em Pausa', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
            'REVIEW': { label: 'Revisão', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            'DONE': { label: 'Concluído', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
        };
        return configs[status] || configs['TODO'];
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <Header
                title="Minha Fila"
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">

                    {/* Header: Tabs + Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20 bg-background">
                        {/* View Mode Tabs */}
                        <div className="bg-surface-highlight/50 p-1.5 rounded-xl backdrop-blur-sm border border-white/5 flex items-center gap-1 w-fit">
                            <button
                                onClick={() => setViewMode('PERSONAL')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'PERSONAL'
                                    ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,91,0.2)]'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">list</span>
                                Minha Fila
                            </button>

                            {/* Gestão tab - Only for ADMIN and MANAGER */}
                            {(userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER') && (
                                <button
                                    onClick={() => setViewMode('WORKLOAD')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'WORKLOAD'
                                        ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,91,0.2)]'
                                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                                    Gestão
                                </button>
                            )}
                        </div>

                        {/* WORKLOAD FILTERS */}
                        {viewMode === 'WORKLOAD' && (
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <SelectDropdown
                                    options={[{ label: 'Todas as Equipes', value: '' }, ...teams.map(t => ({ label: t.name, value: t.id }))]}
                                    value={selectedTeam}
                                    onChange={setSelectedTeam}
                                    placeholder="Filtrar Equipe"
                                    className="min-w-[180px]"
                                    icon="groups"
                                />
                                <MultiSelectDropdown
                                    options={availableUsers.map(u => ({ id: u.id, name: u.full_name }))}
                                    selectedValues={selectedUserIds}
                                    onChange={setSelectedUserIds}
                                    placeholder="Selecionar Usuários"
                                    className="min-w-[240px]"
                                    icon="person_add"
                                />
                            </div>
                        )}

                        {/* PERSONAL FILTERS - Only show in Personal Mode */}
                        {viewMode === 'PERSONAL' && (
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <div className="bg-surface-highlight/50 p-1.5 rounded-xl backdrop-blur-sm border border-white/5 flex items-center gap-1 overflow-x-auto">
                                    {(['MINE', 'CREATED', 'REVIEW'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,91,0.2)]' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                                        >
                                            {tab === 'MINE' ? 'Para mim' : (tab === 'CREATED' ? 'Criei' : 'Aprovações')}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate('/tasks/new')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#0fd650] text-background-dark font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(19,236,91,0.3)] hover:scale-105 active:scale-95 whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-xl">add</span>
                                    <span>Nova Tarefa</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Toolbar - Status Filter, Counter, Sort (PERSONAL ONLY) */}
                    {viewMode === 'PERSONAL' && (
                        <div className="flex items-center justify-between bg-surface-highlight/30 px-6 py-3 rounded-xl border border-white/5">
                            {/* Status Filter - Custom Dropdown */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Exibir:</span>
                                <Dropdown
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val as any)}
                                    options={[
                                        { value: 'OPEN', label: 'Abertas' },
                                        { value: 'OPEN_MY_PART_DONE', label: 'Abertas (minha parte entregue)' },
                                        { value: 'DELIVERED', label: 'Entregues' }
                                    ]}
                                    minWidth="220px"
                                />
                            </div>

                            {/* Task Counter */}
                            <div className="flex items-center gap-2 text-text-secondary">
                                <span className="material-symbols-outlined text-lg">task_alt</span>
                                <span className="text-sm font-medium">{displayTasks.length} {displayTasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
                            </div>

                            {/* Sort Dropdown - Custom */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Ordenar:</span>
                                <Dropdown
                                    value={sortOrder}
                                    onChange={(val) => setSortOrder(val as any)}
                                    options={[
                                        { value: 'PRIORITY', label: 'Por prioridade' },
                                        { value: 'TITLE', label: 'Por título' },
                                        { value: 'CREATED_AT', label: 'Por data de criação' },
                                        { value: 'URGENCY', label: 'Por urgência' },
                                        { value: 'MANUAL', label: 'Manual (Drag & Drop)' }
                                    ]}
                                    minWidth="200px"
                                    align="right"
                                />
                            </div>
                        </div>
                    )}

                    {/* PERSONAL VIEW: Task List */}
                    {viewMode === 'PERSONAL' && (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="queue-list">
                                {(provided) => (
                                    <div
                                        className="flex flex-col gap-4"
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {displayTasks.map((task, index) => {
                                            const isTimerActive = activeTimerTask?.id === task.id;
                                            return (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            onClick={() => navigate(`/tasks/${task.task_number}`)}
                                                            className={`group flex items-center gap-5 p-6 bg-surface-highlight rounded-xl border transition-all cursor-pointer relative ${isTimerActive ? 'border-primary/50 bg-primary/5 shadow-[0_0_25px_rgba(19,236,91,0.1)]' : 'border-transparent hover:border-white/10'} ${snapshot.isDragging ? 'shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 scale-[1.02] border-primary/50' : ''} ${task.priority === 'HIGH' ? 'border-l-[5px] !border-l-orange-500' : (task.priority === 'MEDIUM' ? 'border-l-[5px] !border-l-blue-500' : '')}`}
                                                        >
                                                            {/* Drag Handle */}
                                                            <div {...provided.dragHandleProps} className="flex items-center justify-center p-2 rounded hover:bg-white/5 text-text-secondary/30 hover:text-text-secondary/60 cursor-grab active:cursor-grabbing transition-colors touch-none">
                                                                <span className="material-symbols-outlined text-lg">drag_indicator</span>
                                                            </div>

                                                            {/* Quick Actions Menu */}
                                                            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <TaskActionMenu
                                                                    task={task}
                                                                    onEdit={() => handleEdit(task)}
                                                                    onClone={handleCloneSuccess}
                                                                    onUpdate={handleUpdateList}
                                                                />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    {(() => {
                                                                        const taskClientName = (task as any).client?.name;
                                                                        const projectClientName = (task.project as any)?.client?.name;
                                                                        const displayText = taskClientName || projectClientName || task.project?.name;
                                                                        return displayText ? (
                                                                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#38bdf8]/10 text-[#38bdf8] uppercase truncate max-w-[150px]">
                                                                                {displayText}
                                                                            </span>
                                                                        ) : null;
                                                                    })()}
                                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400' : (task.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-text-muted')}`}>
                                                                        {task.priority === 'HIGH' ? 'Alta' : (task.priority === 'MEDIUM' ? 'Média' : 'Baixa')}
                                                                    </span>
                                                                </div>
                                                                <h3 className={`font-bold text-xl leading-snug transition-colors mb-1 ${isTimerActive ? 'text-primary' : 'text-white group-hover:text-primary/90'}`}>{task.title}</h3>

                                                                {/* Project / Client / Type Context */}
                                                                <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
                                                                    {(() => {
                                                                        const taskClientName = (task as any).client?.name;
                                                                        const projectClientName = (task.project as any)?.client?.name;
                                                                        const displayText = taskClientName || projectClientName || task.project?.name;
                                                                        return displayText ? (
                                                                            <>
                                                                                <span>{displayText}</span>
                                                                                <span className="size-1 rounded-full bg-white/20"></span>
                                                                            </>
                                                                        ) : null;
                                                                    })()}
                                                                    <span>Tarefa</span>
                                                                </div>

                                                                <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-base">calendar_today</span>
                                                                            <span>{new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</span>
                                                                        </div>
                                                                    )}
                                                                    {task.assignee && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                                                                {task.assignee.full_name.charAt(0)}
                                                                            </div>
                                                                            <span className="text-xs">{task.assignee.full_name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Timer Display */}
                                                            {isTimerActive && (
                                                                <div className="flex items-center gap-3 bg-background-dark/80 px-6 py-3 rounded-xl border border-primary/20 shadow-[0_0_20px_rgba(19,236,91,0.15)] backdrop-blur-md">
                                                                    <span className="material-symbols-outlined text-primary text-2xl animate-pulse">timelapse</span>
                                                                    <span className="font-mono font-bold text-primary text-2xl tracking-wider">{formatTimer(historicTime + timerElapsedTime)}</span>
                                                                </div>
                                                            )}

                                                            {/* Info Bar - Status, Due Date, Assignee, Total Time */}
                                                            {!isTimerActive && (
                                                                <div className="flex items-center gap-4 bg-surface-dark/50 px-4 py-2.5 rounded-xl border border-white/5">
                                                                    {/* Total Time Badge (Inactive) */}
                                                                    {(() => {
                                                                        const totalSeconds = task.time_logs?.reduce((acc: number, log: any) => acc + (log.duration_seconds || 0), 0) || 0;
                                                                        if (totalSeconds > 0) {
                                                                            return (
                                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 min-w-[80px] justify-center" title="Tempo Total Investido">
                                                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                                                    <span>{formatTimer(totalSeconds)}</span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}

                                                                    {/* Status Selector - Custom Dropdown */}
                                                                    <div className="relative min-w-[140px]">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenDropdownId(openDropdownId === task.id ? null : task.id);
                                                                            }}
                                                                            className={`w-full px-3 pr-8 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all hover:scale-105 bg-surface-dark flex items-center justify-between ${getStatusConfig(task.status).color}`}
                                                                        >
                                                                            <span>{(() => {
                                                                                if (task.board_id && kanbanColumns[task.board_id]) {
                                                                                    // Dynamic Label
                                                                                    // Find the column that matches current status or column_id
                                                                                    const cols = kanbanColumns[task.board_id];
                                                                                    const match = cols.find(c => task.column_id ? c.id === task.column_id : c.statuses?.includes(task.status));
                                                                                    return match ? match.title : getStatusConfig(task.status).label;
                                                                                }
                                                                                return getStatusConfig(task.status).label;
                                                                            })()}</span>
                                                                            <span className={`material-symbols-outlined text-sm transition-transform ${openDropdownId === task.id ? 'rotate-180' : ''}`}>expand_more</span>
                                                                        </button>

                                                                        {/* Dropdown Menu */}
                                                                        {openDropdownId === task.id && (
                                                                            <div className="absolute top-full left-0 mt-2 w-[180px] bg-surface-dark border border-white/10 rounded-xl shadow-xl z-[100] overflow-hidden animate-scale-in">
                                                                                <div className="p-1">
                                                                                    {(task.board_id && kanbanColumns[task.board_id] ? kanbanColumns[task.board_id] : [
                                                                                        { id: 'todo', title: 'TODO' },
                                                                                        { id: 'in_progress', title: 'IN_PROGRESS' },
                                                                                        { id: 'waiting_client', title: 'WAITING_CLIENT' },
                                                                                        { id: 'review', title: 'REVIEW' },
                                                                                        { id: 'done', title: 'DONE' }
                                                                                    ]).map((column: any) => {
                                                                                        // Map status string to display label logic or use column title
                                                                                        const isDynamic = !!(task.board_id && kanbanColumns[task.board_id]);
                                                                                        const columnTitle = column.title;
                                                                                        // For static list, we use the status string to get label from config
                                                                                        const displayLabel = isDynamic ? columnTitle : getStatusConfig(column.title as any).label;


                                                                                        // Determine if selected
                                                                                        // For dynamic: check if task.status matches the column's mapped status or if we can match by ID?
                                                                                        // Current simple check:
                                                                                        const isSelected = isDynamic
                                                                                            // Complex match: Prioritize specific column_id if available to avoid duplicate checks for columns with same variant
                                                                                            ? (task.column_id ? column.id === task.column_id : column.statuses?.includes(task.status))
                                                                                            : task.status === columnTitle;


                                                                                        return (
                                                                                            <button
                                                                                                key={column.id || column.title}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    // Logic for dynamic vs static update
                                                                                                    if (isDynamic) {
                                                                                                        // Handle dynamic column change - Option 2 logic later?
                                                                                                        // For now, prompt mentions Option 1 first (visuals) -> "se eu mudar a etapa... feita na opcao 2"
                                                                                                        // But the user said "do option 1 first (visuals/pulling), then option 2 (logic)"
                                                                                                        // So here we should probably trying to map back to a valid status if possible or just pass the column info
                                                                                                        // For now, let's keep using handleStatusChange but we might need to pass column ID if we implement Option 2 immediately or wait.
                                                                                                        // Wait, Option 1 is just "pulling according to board". Option 2 is "changing updates board".
                                                                                                        // To support "changing" correctly with dynamic columns we need Option 2 logic now or else it breaks.
                                                                                                        // Let's implement a safe handler.

                                                                                                        // Actually, if we just render the real columns, we need to pass the column ID to the update function
                                                                                                        handleStatusChange(column.statuses?.[0] || 'TODO', task, column.id);
                                                                                                    } else {
                                                                                                        handleStatusChange(column.title, task);
                                                                                                    }
                                                                                                    setOpenDropdownId(null);
                                                                                                }}
                                                                                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                                                                                            >
                                                                                                <span className={isDynamic ? "text-white" : getStatusConfig(column.title).color.split(' ')[1]}>
                                                                                                    {displayLabel}
                                                                                                </span>
                                                                                                {isSelected && <span className="material-symbols-outlined text-primary text-[16px]">check</span>}
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Due Date - Always render for alignment */}
                                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium min-w-[90px] justify-center ${task.due_date ? (new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-text-secondary border border-white/5') : (task.is_continuous ? 'bg-white/5 text-text-muted border border-white/5' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20')}`}>
                                                                        <span className="material-symbols-outlined text-sm">{task.due_date ? 'calendar_today' : (task.is_continuous ? 'all_inclusive' : 'warning')}</span>
                                                                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : (task.is_continuous ? 'Contínua' : 'Sem Prazo')}</span>
                                                                    </div>

                                                                    {/* Assignee Avatar - Always render for alignment */}
                                                                    {task.assignee ? (
                                                                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 min-w-[100px]">
                                                                            <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                                {task.assignee.full_name.charAt(0)}
                                                                            </div>
                                                                            <span className="text-xs text-text-secondary font-medium truncate">{task.assignee.full_name.split(' ')[0]}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 min-w-[100px] opacity-50">
                                                                            <div className="size-6 rounded-full bg-white/10 flex items-center justify-center">
                                                                                <span className="material-symbols-outlined text-xs text-text-muted">person</span>
                                                                            </div>
                                                                            <span className="text-xs text-text-muted">Sem atribuição</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center gap-3">
                                                                {isTimerActive ? (
                                                                    <button onClick={handlePauseTimer} className="size-14 rounded-full bg-primary hover:bg-[#0fd650] flex items-center justify-center text-background-dark shadow-[0_6px_20px_rgba(19,236,91,0.4)] transition-transform hover:scale-110 active:scale-95" title="Pausar">
                                                                        <span className="material-symbols-outlined fill text-3xl">pause</span>
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={(e) => handleStartTask(e, task)} className="size-14 rounded-full bg-surface-dark hover:bg-primary hover:text-background-dark flex items-center justify-center text-primary shadow-lg transition-all border-2 border-primary/30 hover:border-transparent active:scale-95" title="Iniciar">
                                                                        <span className="material-symbols-outlined fill text-3xl">play_arrow</span>
                                                                    </button>
                                                                )}
                                                                <button onClick={(e) => handleQuickComplete(e, task)} className="size-14 rounded-full bg-surface-dark hover:bg-green-500 hover:text-white flex items-center justify-center text-text-secondary transition-all shadow-lg border-2 border-white/10 hover:border-transparent active:scale-95 group/check" title="Concluir">
                                                                    <span className="material-symbols-outlined text-3xl group-hover/check:scale-110 transition-transform">check</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                        {displayTasks.length === 0 && (
                                            <div className="text-center py-32 text-text-secondary">
                                                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">inbox</span>
                                                <p className="text-lg font-medium">Sua fila está vazia.</p>
                                                <p className="text-sm mt-2">Crie uma nova tarefa ou aguarde atribuições.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}

                    {/* WORKLOAD VIEW */}
                    {viewMode === 'WORKLOAD' && (
                        <div className="flex-1 h-full min-h-[600px]">
                            <WorkloadBoard
                                onTaskClick={(task) => navigate(`/tasks/${task.task_number}`)}
                                users={availableUsers.filter(u => selectedUserIds.includes(u.id))}
                                teamId={selectedTeam}
                            />
                        </div>
                    )}
                </div>
            </div>

            <TaskEditDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                taskNumber={editTaskNumber || undefined}
                onSuccess={handleDrawerSuccess}
            />
        </div >
    );
}
