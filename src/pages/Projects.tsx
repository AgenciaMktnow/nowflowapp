import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import NewColumnModal from '../components/NewColumnModal';
import ColumnMenu from '../components/ColumnMenu';
import SelectDropdown from '../components/SelectDropdown';
import Header from '../components/layout/Header/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { clientService, type Client } from '../services/client.service';
import { projectService, type Project } from '../services/project.service';
import { taskService, type Task } from '../services/task.service';
import { boardService, type Board, type Column } from '../services/board.service';
import { teamService, type Team } from '../services/team.service';
import { extractChecklistFromHtml } from '../utils/checklist';

export default function Projects() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);

    // Filters
    const [selectedBoard, setSelectedBoard] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');

    const [filterMine, setFilterMine] = useState(false);
    const [filterUrgent, setFilterUrgent] = useState(false);
    const [filterOverdue, setFilterOverdue] = useState(false);

    // Data
    const [boards, setBoards] = useState<Board[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [allUsers, setAllUsers] = useState<{ id: string, full_name: string, team_ids: string[] }[]>([]);
    const [availableUsers, setAvailableUsers] = useState<{ id: string, full_name: string }[]>([]);

    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [availableClients, setAvailableClients] = useState<Client[]>([]);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);


    const [columns, setColumns] = useState<Column[]>([]);

    const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);
    const [activeTeamLogs, setActiveTeamLogs] = useState<Record<string, { user_name: string }>>({});

    const [searchParams] = useSearchParams();
    const queryProjectId = searchParams.get('projectId');

    // Load initial data
    useEffect(() => {
        loadBoards();
        loadProjects();
        loadClients();
        loadTeams();
        loadUsers();
        checkActiveTeamLogs();
        const interval = setInterval(checkActiveTeamLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    // Initial URL param handling
    useEffect(() => {
        if (queryProjectId && projects.length > 0) {
            setSelectedProject(queryProjectId);
            // Also find board for this project
            const proj = projects.find(p => p.id === queryProjectId);
            if (proj) {
                if (proj.board_id) setSelectedBoard(proj.board_id);
                if (proj.client_id) setSelectedClient(proj.client_id);
                if (proj.team_id) setSelectedTeam(proj.team_id);
            }
        }
    }, [queryProjectId, projects]);

    // Cascade Logic: Update available Filters (Dependent Dropdowns)
    useEffect(() => {
        let relevantProjects = projects;

        // 1. Filter Projects by Parent Contexts (Board)
        if (selectedBoard) {
            relevantProjects = relevantProjects.filter(p => p.board_id === selectedBoard);
        }

        // 2. Filter Projects by Peer Contexts (Team / Client) if selected
        // Note: For dropdown generation, we want "Options Available given the OTHER selections".
        // But for "availableProjects", it should be the intersection of ALL selections.

        let projectsForDropdown = relevantProjects;
        if (selectedTeam) {
            projectsForDropdown = projectsForDropdown.filter(p => p.team_id === selectedTeam);
        }
        if (selectedClient) {
            const client = clients.find(c => c.id === selectedClient);
            if (client?.project_ids) {
                projectsForDropdown = projectsForDropdown.filter(p => client.project_ids!.includes(p.id));
            }
        }
        setAvailableProjects(projectsForDropdown);

        // 3. Filter Clients (Show only clients linked to Relevant Projects)
        // If Team is selected, show clients that have projects with that Team.
        // If Board is selected, show clients that have projects in that Board.
        let projectsForClientCheck = relevantProjects;
        if (selectedTeam) projectsForClientCheck = projectsForClientCheck.filter(p => p.team_id === selectedTeam);

        const validClientIds = new Set<string>();
        clients.forEach(c => {
            if (c.project_ids?.some(pid => projectsForClientCheck.some(p => p.id === pid))) {
                validClientIds.add(c.id);
            }
        });
        setAvailableClients(clients.filter(c => validClientIds.has(c.id)));

        // 4. Filter Teams (Show only teams linked to Relevant Projects)
        // If Client is selected, show teams that have projects with that Client.
        let projectsForTeamCheck = relevantProjects;
        if (selectedClient) {
            const client = clients.find(c => c.id === selectedClient);
            if (client?.project_ids) {
                projectsForTeamCheck = projectsForTeamCheck.filter(p => client.project_ids!.includes(p.id));
            }
        }

        const validTeamIds = new Set(projectsForTeamCheck.map(p => p.team_id).filter(Boolean));
        setAvailableTeams(teams.filter(t => validTeamIds.has(t.id)));

        // 5. Update Available Users based on Team (Priority)
        let sortedUsers = [...allUsers];
        if (selectedTeam) {
            sortedUsers.sort((a, b) => {
                const aIsTeam = a.team_ids.includes(selectedTeam);
                const bIsTeam = b.team_ids.includes(selectedTeam);
                if (aIsTeam && !bIsTeam) return -1;
                if (!aIsTeam && bIsTeam) return 1;
                return a.full_name.localeCompare(b.full_name);
            });
        }
        setAvailableUsers(sortedUsers.map(u => ({ id: u.id, full_name: u.full_name })));

        // Validation: Clear downstream if invalid
        if (selectedProject && !projectsForDropdown.find(p => p.id === selectedProject)) {
            setSelectedProject('');
        }

    }, [selectedBoard, selectedTeam, selectedClient, projects, clients, teams, allUsers, selectedProject]);

    // Trigger Fetch on Filter Change
    useEffect(() => {
        // Debounce could be added here if needed, but for now direct call
        console.log('--- Fetching Tasks with Filters ---');
        console.log('Board:', selectedBoard);
        console.log('Team:', selectedTeam);
        console.log('Client:', selectedClient);
        console.log('Project:', selectedProject);
        fetchTasks();
    }, [selectedBoard, selectedClient, selectedTeam, selectedProject, filterMine, filterUrgent, filterOverdue]);

    // Helper Functions
    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'HIGH': return <span className="material-symbols-outlined text-red-500 text-sm font-bold" title="Alta Prioridade">flag</span>;
            case 'MEDIUM': return <span className="material-symbols-outlined text-orange-400 text-sm" title="Média Prioridade">flag</span>;
            case 'LOW': return <span className="material-symbols-outlined text-blue-400 text-sm" title="Baixa Prioridade">flag</span>;
            default: return null;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return '#ef4444'; // red-500
            case 'MEDIUM': return '#fb923c'; // orange-400
            case 'LOW': return '#60a5fa'; // blue-400
            default: return '#10B981'; // default green
        }
    };

    const loadBoards = async () => {
        const { data } = await boardService.getBoards();
        if (data) setBoards(data);
    };

    const loadProjects = async () => {
        const { data } = await projectService.getProjects();
        if (data) setProjects(data);
    };

    const loadClients = async () => {
        const { data } = await clientService.getClients();
        if (data) setClients(data);
    };

    const loadTeams = async () => {
        const { data } = await teamService.getTeams();
        if (data) setTeams(data);
    }

    const loadUsers = async () => {
        const { data: usersData } = await supabase.from('users').select('id, full_name');
        const { data: userTeamsData } = await supabase.from('user_teams').select('user_id, team_id');

        if (usersData && userTeamsData) {
            const usersWithTeams = usersData.map((u: any) => ({
                id: u.id,
                full_name: u.full_name,
                team_ids: userTeamsData.filter((ut: any) => ut.user_id === u.id).map((ut: any) => ut.team_id)
            }));
            setAllUsers(usersWithTeams);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [user, selectedProject, selectedBoard, selectedClient, selectedTeam, selectedUser]); // Re-fetch on any filter change

    const fetchTasks = async () => {
        const filters: any = {};

        if (selectedProject) filters.projectId = selectedProject;
        if (selectedBoard) filters.boardId = selectedBoard; // Now supported by service
        if (selectedClient) filters.clientId = selectedClient; // Now supported by service
        if (selectedTeam) filters.teamId = selectedTeam; // Now supported by service
        if (selectedUser) filters.assigneeId = selectedUser;

        const { data, error } = await taskService.getTasks(filters);

        if (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Erro ao carregar tarefas');
        } else if (data) {
            setTasks(data);
        }
    };

    // Filter Tasks (Client Side - Double Check / Search / Quick Filters)
    const filteredTasks = tasks.filter(task => {
        // const taskProject = projects.find(p => p.id === task.project_id);

        // 1. Strict Logic Checks
        // Note: Backend handles Board/Team member logic (User-Centric) AND Client Many-to-Many logic.
        // We trust the backend for Client/Board/Team filtering. Only Project ID drills down strictly on task.
        if (selectedProject && task.project_id !== selectedProject) return false;



        // 3. Quick Filters
        if (filterMine && user && task.assignee_id !== user.id) return false;
        if (filterUrgent && task.priority !== 'HIGH') return false;
        if (filterOverdue && task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE') return false;

        return true;
    });

    const checkActiveTeamLogs = async () => {
        try {
            const { data: logs } = await supabase
                .from('time_logs')
                .select(`task_id, user:users(full_name)`)
                .is('end_time', null);

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
            console.error('Error checking active logs:', error);
        }
    };

    // Columns Logic
    const DEFAULT_COLUMNS: Column[] = [
        { id: 'def-1', title: 'A Fazer', variant: 'default', countColor: 'bg-background-dark text-text-muted-dark', position: 0, statuses: ['TODO', 'BACKLOG'] },
        { id: 'def-2', title: 'Em Andamento', variant: 'progress', countColor: 'bg-primary/20 text-green-300', position: 1, statuses: ['IN_PROGRESS'] },
        { id: 'def-3', title: 'Em Revisão', variant: 'review', countColor: 'bg-background-dark text-text-muted-dark', position: 2, statuses: ['WAITING_CLIENT', 'REVIEW'] },
        { id: 'def-4', title: 'Concluído', variant: 'done', countColor: 'bg-primary/10 text-primary', position: 3, statuses: ['DONE'] }
    ];

    useEffect(() => {
        if (selectedBoard) {
            loadColumns(selectedBoard);
        } else {
            setColumns(DEFAULT_COLUMNS);
        }
    }, [selectedBoard]);

    const loadColumns = async (boardId: string) => {
        const { data } = await boardService.getBoardColumns(boardId);
        if (data && data.length > 0) {
            setColumns(data);
        } else {
            // No seeding needed? Service handles defaults fallback, but if we want to PERSIST defaults for new board:
            // But boardService.getBoardColumns returns defaults if empty.
            // Ideally we should seed DB. But service doesn't have seed method yet.
            // I'll leave as is (memory defaults) for now or update service later.
            // Actually, service.createBoardColumn is available.
            setColumns(data || DEFAULT_COLUMNS);
        }
    };

    const handleAddColumn = async (title: string, countColor: string) => {
        if (!selectedBoard) return toast.error('Selecione um Quadro para criar colunas.');

        const newColumn = { title, variant: 'default' as const, countColor, position: columns.length };
        const { data, error } = await boardService.createBoardColumn(selectedBoard, newColumn);

        if (error) {
            toast.error(error.message);
        } else if (data) {
            setColumns(prev => [...prev, data]);
            toast.success('Coluna criada!');
        }
    };

    const handleDeleteColumnSuccess = (columnId: string) => {
        setColumns(prev => prev.filter(c => c.id !== columnId));
    };

    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

    const handleRenameColumn = async (columnId: string, newTitle: string) => {
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, title: newTitle } : c));
        setEditingColumnId(null);
        await boardService.updateBoardColumn(columnId, { title: newTitle });
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, type, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'COLUMN') {
            const newColumns = Array.from(columns);
            const [removed] = newColumns.splice(source.index, 1);
            newColumns.splice(destination.index, 0, removed);
            setColumns(newColumns);

            const updates = newColumns.map((col, index) => ({ id: col.id, position: index }));
            await boardService.updateBoardColumnPositions(updates);
            return;
        }

        if (type === 'TASK') {
            const destColumnId = destination.droppableId;
            const destColumn = columns.find(c => c.id === destColumnId);

            if (destColumn && destColumnId !== source.droppableId) {
                let newStatus = destColumn.statuses[0];
                const isLastColumn = columns[columns.length - 1].id === destColumnId;
                if (isLastColumn || destColumn.variant === 'done') {
                    newStatus = 'DONE';
                }

                setTasks(prevTasks => prevTasks.map(t =>
                    t.id === draggableId ? { ...t, status: newStatus as any, column_id: destColumnId } : t
                ));

                const updates: any = { status: newStatus };
                // Always update column_id to persist Board Column placement
                if (!destColumn.id.startsWith('def-')) {
                    updates.column_id = destColumnId;
                }

                const { error } = await supabase.from('tasks').update(updates).eq('id', draggableId);

                if (error) {
                    toast.error('Erro ao mover tarefa');
                    fetchTasks();
                }
            }
        }
    };





    // Column Intelligence
    const calculateColumnTotalTime = (tasksInColumn: Task[]) => {
        const totalMinutes = tasksInColumn.reduce((acc, t) => acc + (t.estimated_time || 0) * 60, 0);
        if (totalMinutes === 0) return null;
        const h = Math.floor(totalMinutes / 60);
        const m = Math.round(totalMinutes % 60);
        return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    };

    // UI Components
    const QuickFilterChip = ({ label, active, onClick, icon }: any) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${active
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-surface-dark text-text-muted border-border-dark hover:border-text-muted'
                }`}
        >
            {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden bg-black/20">
            {/* Header */}
            <Header
                title="Projetos"
            />

            {/* Toolbar */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-border-light dark:border-border-dark bg-background-dark min-h-[64px] flex items-center justify-between gap-4 overflow-hidden">

                {/* Left Side: Filters (Scrollable) */}
                <div className="flex items-center gap-3 flex-1 overflow-x-auto no-scrollbar pb-1 mask-gradient-right">
                    <SelectDropdown
                        value={selectedBoard}
                        onChange={(val) => {
                            setSelectedBoard(val);
                            setSelectedTeam('');
                            setSelectedClient('');
                            setSelectedProject('');
                        }}
                        options={[
                            { label: 'Todos os Quadros', value: '' },
                            ...boards.map(b => ({ label: b.name, value: b.id }))
                        ]}
                        placeholder="Todos os Quadros"
                        icon="dashboard"
                        className="min-w-[180px] flex-shrink-0"
                    />

                    <SelectDropdown
                        value={selectedTeam}
                        onChange={(val) => {
                            setSelectedTeam(val);
                            setSelectedProject('');
                        }}
                        options={[
                            { label: 'Todas as Equipes', value: '' },
                            ...availableTeams.map(t => ({ label: t.name, value: t.id }))
                        ]}
                        placeholder="Todas as Equipes"
                        icon="group"
                        className="min-w-[180px] flex-shrink-0"
                    />

                    <SelectDropdown
                        value={selectedClient}
                        onChange={(val) => {
                            setSelectedClient(val);
                            setSelectedProject('');
                        }}
                        options={[
                            { label: 'Todos os Clientes', value: '' },
                            ...availableClients.map(c => ({ label: c.name, value: c.id }))
                        ]}
                        placeholder="Todos os Clientes"
                        icon="business"
                        className="min-w-[180px] flex-shrink-0"
                    />

                    <SelectDropdown
                        value={selectedUser}
                        onChange={setSelectedUser}
                        options={[
                            { label: 'Todos os Responsáveis', value: '' },
                            ...availableUsers.map(u => ({ label: u.full_name, value: u.id }))
                        ]}
                        placeholder="Responsável"
                        icon="person"
                        className="min-w-[180px] flex-shrink-0"
                    />

                    <SelectDropdown
                        value={selectedProject}
                        onChange={setSelectedProject}
                        options={[
                            { label: 'Todos os Projetos', value: '' },
                            ...availableProjects.map(p => ({ label: p.name, value: p.id }))
                        ]}
                        placeholder="Selecione um Projeto"
                        icon="folder"
                        className="min-w-[200px] flex-shrink-0"
                    />

                    <div className="h-6 w-px bg-border-dark mx-1 flex-shrink-0 hidden xl:block"></div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <QuickFilterChip
                            label="Minhas"
                            active={filterMine}
                            onClick={() => setFilterMine(!filterMine)}
                            icon="person"
                        />
                        <QuickFilterChip
                            label="Urgentes"
                            active={filterUrgent}
                            onClick={() => setFilterUrgent(!filterUrgent)}
                            icon="priority_high"
                        />
                        <QuickFilterChip
                            label="Atrasadas"
                            active={filterOverdue}
                            onClick={() => setFilterOverdue(!filterOverdue)}
                            icon="event_busy"
                        />
                    </div>
                </div>

                {/* Right Side: Actions (Fixed) */}
                <div className="flex items-center gap-3 flex-shrink-0 pl-2 border-l border-border-dark bg-background-dark z-10">
                    <button
                        onClick={() => navigate(selectedProject ? `/tasks/new?projectId=${selectedProject}` : '/tasks/new')}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-green-400 text-black font-bold py-1.5 px-3 rounded-lg transition-all shadow-lg shadow-primary/20 whitespace-nowrap text-sm flex-shrink-0">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tarefa
                    </button>

                    <button
                        onClick={() => {
                            if (!selectedBoard) {
                                toast.warning('Selecione um Quadro para criar colunas personalizadas.');
                                return;
                            }
                            setIsNewColumnModalOpen(true);
                        }}
                        title={!selectedBoard ? "Selecione um Quadro" : "Adicionar nova coluna"}
                        className={`flex items-center justify-center gap-2 border text-xs font-bold py-1.5 px-3 rounded-lg transition-all whitespace-nowrap flex-shrink-0 min-w-fit shadow-lg shadow-primary/5 ${!selectedBoard
                            ? 'bg-surface-dark/50 border-border-dark/50 text-text-muted cursor-not-allowed'
                            : 'bg-surface-dark border-primary/30 text-primary hover:bg-primary hover:text-black hover:shadow-primary/20'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">view_column</span>
                        Coluna
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-2 md:p-6">
                    <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                        {(provided) => (
                            <div
                                className="inline-flex h-full items-start gap-5 pb-2 snap-x snap-mandatory px-4 md:px-0"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {columns.map((column, index) => {
                                    const columnTasks = filteredTasks.filter(t => {
                                        // If the column is a default (virtual) column, use status matching.
                                        // Virtual columns are unique by status, so duplication isn't an issue.
                                        if (column.id.startsWith('def-')) {
                                            return column.statuses.includes(t.status);
                                        }

                                        // Otherwise, if we are in a specific project with custom columns, match by column_id
                                        if (t.column_id === column.id) return true;

                                        // Fallback for tasks without column_id (legacy or status-based)
                                        // CRITICAL: prevents duplication by only showing in the FIRST matching column 
                                        if (!t.column_id && column.statuses.includes(t.status)) {
                                            const primaryColumn = columns.find(c => c.statuses.includes(t.status));
                                            return primaryColumn?.id === column.id;
                                        }
                                        return false;
                                    });

                                    const totalTime = calculateColumnTotalTime(columnTasks);

                                    return (
                                        <Draggable key={column.id} draggableId={column.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="w-[85vw] md:w-[300px] flex-shrink-0 flex flex-col max-h-full bg-surface-dark rounded-xl border border-border-dark snap-center"
                                                >
                                                    {/* Column Header */}
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="p-3 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10 border-b border-border-dark"
                                                    >
                                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                {editingColumnId === column.id ? (
                                                                    <input
                                                                        autoFocus
                                                                        defaultValue={column.title}
                                                                        onBlur={(e) => handleRenameColumn(column.id, e.target.value)}
                                                                        className="bg-black/20 text-white text-xs font-bold px-1 rounded outline-none w-full"
                                                                    />
                                                                ) : (
                                                                    <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider truncate" title={column.title}>{column.title}</h3>
                                                                )}
                                                                <span className="bg-white/5 text-text-muted px-1.5 py-0.5 rounded text-[10px] font-bold">{columnTasks.length}</span>
                                                            </div>

                                                            {/* Column Intelligence */}
                                                            {totalTime && (
                                                                <div className="text-[10px] text-text-subtle flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                                    {totalTime} estimados
                                                                </div>
                                                            )}
                                                        </div>
                                                        <ColumnMenu
                                                            columnId={column.id}
                                                            onDeleteSuccess={() => handleDeleteColumnSuccess(column.id)}
                                                            onEdit={() => setEditingColumnId(column.id)}
                                                        />
                                                    </div>

                                                    {/* Scrollable Tasks Area */}
                                                    <Droppable droppableId={column.id} type="TASK">
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
                                                            >
                                                                {columnTasks.map((task, index) => {
                                                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';
                                                                    const boardColor = (task as any).project?.board?.color || '#23482f';
                                                                    // unused check
                                                                    console.log(boardColor);
                                                                    const attachmentCount = task.attachments?.length || 0;

                                                                    // Basic check for checklist in description (not perfect count, but indication)
                                                                    const hasChecklist = task.description?.includes('ul data-type="taskList"');
                                                                    const checklistStats = extractChecklistFromHtml(task.description || '');
                                                                    const checklistProgress = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;
                                                                    // const attachmentCount = task.attachments?.length || 0; // Already declared above
                                                                    // const activeTeamLogs = {}; // This would override the state variable, not intended.
                                                                    // const boardColor = task.project?.board?.color || '#3B82F6'; // Already declared above

                                                                    return (
                                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                                            {(provided) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    {...provided.dragHandleProps}
                                                                                    onClick={() => navigate(`/tasks/${task.task_number}`)}
                                                                                    className={`group relative bg-surface-dark p-4 rounded-lg shadow-sm border cursor-grab hover:shadow-md transition-all
                                                                                        ${isOverdue ? 'border-red-500/50' : 'border-input-border/30 hover:border-primary/50'}
                                                                                        ${column.variant === 'done' ? 'opacity-60 hover:opacity-100' : ''}
                                                                                    `}
                                                                                    style={{ ...provided.draggableProps.style }}
                                                                                >
                                                                                    {/* Priority Color Strip (Left) */}
                                                                                    <div
                                                                                        className="absolute top-2 bottom-2 left-0 w-1 rounded-r-md"
                                                                                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                                                    ></div>

                                                                                    <div className="pl-3 flex flex-col gap-2">
                                                                                        {/* Header: ID & Client/Project */}
                                                                                        <div className="flex items-center justify-between mb-0.5">
                                                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                                                <span className="text-[10px] font-mono text-text-muted">#{task.task_number}</span>
                                                                                                {/* Client Name Lookup */}
                                                                                                {(() => {
                                                                                                    // Hierarchy: Task Client > Project Client (Joined) > Project Client (Lookup) > Project Name
                                                                                                    const taskClientName = task.client?.name;
                                                                                                    const projectClientName = task.project?.client?.name;
                                                                                                    const lookupClientName = clients.find(c => c.id === task.project?.client_id)?.name;

                                                                                                    const displayText = taskClientName || projectClientName || lookupClientName || task.project?.name;

                                                                                                    return displayText && (
                                                                                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 text-text-secondary truncate max-w-[150px]">
                                                                                                            {displayText}
                                                                                                        </span>
                                                                                                    );
                                                                                                })()}
                                                                                            </div>
                                                                                            {getPriorityIcon(task.priority)}
                                                                                        </div>

                                                                                        {/* Title */}
                                                                                        <h4 className={`text-[15px] font-semibold text-text-primary leading-snug mt-1 mb-2 ${column.variant === 'done' ? 'line-through text-text-muted' : ''}`}>
                                                                                            {task.title}
                                                                                        </h4>

                                                                                        {/* Metadata Footer */}
                                                                                        <div className="flex items-end justify-between mt-auto">
                                                                                            {/* Left: Date / Continuous */}
                                                                                            <div className="flex items-center gap-2">
                                                                                                {task.due_date ? (
                                                                                                    <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue || new Date(task.due_date).toDateString() === new Date().toDateString() ? 'text-red-500' : 'text-text-secondary'}`}>
                                                                                                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                                                                                        <span>
                                                                                                            {(() => {
                                                                                                                const [y, m, d] = task.due_date!.split('T')[0].split('-').map(Number);
                                                                                                                return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                                                                                            })()}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="flex items-center gap-1 text-[11px] text-text-muted" title="Tarefa Contínua">
                                                                                                        <span className="material-symbols-outlined text-[14px]">all_inclusive</span>
                                                                                                        <span>Contínua</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Right: Icons */}
                                                                                            <div className="flex items-center gap-2 text-text-muted">
                                                                                                {(hasChecklist || attachmentCount > 0) && (
                                                                                                    <div className="flex items-center gap-2 text-text-muted">
                                                                                                        {hasChecklist && (
                                                                                                            <span className="material-symbols-outlined text-[14px]" title="Contém Checklist">check_box</span>
                                                                                                        )}
                                                                                                        {attachmentCount > 0 && (
                                                                                                            <div className="flex items-center gap-0.5" title={`${attachmentCount} Anexos`}>
                                                                                                                <span className="material-symbols-outlined text-[14px] -rotate-45">attach_file</span>
                                                                                                                <span className="text-[10px] font-bold">{attachmentCount}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Checklist Bar */}
                                                                                            {checklistStats.total > 0 && (
                                                                                                <div className="w-full mt-2 mb-1">
                                                                                                    <div className="flex justify-between items-center mb-0.5">
                                                                                                        <span className="text-[9px] text-text-muted font-bold">Checklist</span>
                                                                                                        <span className="text-[9px] text-text-secondary">{checklistStats.completed}/{checklistStats.total}</span>
                                                                                                    </div>
                                                                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                                                        <div
                                                                                                            className="h-full bg-[#00FF00] transition-all duration-300 shadow-[0_0_8px_rgba(0,255,0,0.4)]"
                                                                                                            style={{ width: `${checklistProgress}%` }}
                                                                                                        ></div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Avatar */}
                                                                                            <div className="relative">
                                                                                                {activeTeamLogs[task.id] && (
                                                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                                                                                                )}
                                                                                                {task.assignee ? (
                                                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border border-[#333] ${activeTeamLogs[task.id] ? 'bg-primary text-black' : 'bg-surface-border text-text-subtle'}`} title={task.assignee.full_name}>
                                                                                                        <img src={task.assignee.avatar_url} className="rounded-full w-full h-full object-cover" />
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="w-5 h-5 rounded-full bg-white/5 border border-dashed border-text-muted/30 flex items-center justify-center">
                                                                                                        <span className="text-[10px] text-text-muted">?</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    );
                                                                })}
                                                                {provided.placeholder}

                                                                {columnTasks.length === 0 && (
                                                                    <div className="h-20 flex items-center justify-center text-text-muted/20 border-2 border-dashed border-white/5 rounded-lg text-xs">
                                                                        Vazio
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                        }
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>

            <NewColumnModal
                isOpen={isNewColumnModalOpen}
                onClose={() => setIsNewColumnModalOpen(false)}
                onAdd={handleAddColumn}
            />
        </div>
    );
}
