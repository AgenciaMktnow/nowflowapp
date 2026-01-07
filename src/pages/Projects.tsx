import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import NewColumnModal from '../components/NewColumnModal';
import ColumnMenu from '../components/ColumnMenu';
import SelectDropdown from '../components/SelectDropdown';
import TaskEditDrawer from '../components/TaskEditDrawer';
import TaskCard from '../components/TaskCard';
import Header from '../components/layout/Header/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { clientService, type Client } from '../services/client.service';
import { projectService, type Project } from '../services/project.service';
import { taskService, type Task } from '../services/task.service';
import { boardService, type Board, type Column } from '../services/board.service';
import { teamService, type Team } from '../services/team.service';

export default function Projects() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

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

    // Edit Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editTaskNumber, setEditTaskNumber] = useState<string | undefined>(undefined);

    const [activeTeamLogs, setActiveTeamLogs] = useState<Record<string, { user_name: string }>>({});

    const [searchParams] = useSearchParams();
    const queryProjectId = searchParams.get('projectId');
    const queryBoardId = searchParams.get('boardId'); // <--- NEW

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

    // DEBUG: Monitor Clients and Tasks State
    useEffect(() => {
        console.log('KANBAN BOARD MOUNTED - VERSION CLEAN 2.0');
    }, []);
    // DEBUG: Monitor Clients and Tasks State - REMOVED


    // Initial URL param handling
    useEffect(() => {
        if (queryProjectId && projects.length > 0) {
            setSelectedProject(queryProjectId);
            const proj = projects.find(p => p.id === queryProjectId);
            if (proj) {
                if (proj.board_id) setSelectedBoard(proj.board_id);
                if (proj.client_id) setSelectedClient(proj.client_id);
                if (proj.team_id) setSelectedTeam(proj.team_id);
            }
        } else if (queryBoardId) {
            // Direct Board Link
            setSelectedBoard(queryBoardId);
        }
    }, [queryProjectId, queryBoardId, projects]);

    // Update URL on Board Change (PERSISTENCE)
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (selectedBoard) {
            newParams.set('boardId', selectedBoard);
        } else {
            newParams.delete('boardId');
        }

        // Only navigate if actually changed to avoid heavy loops, 
        // though setSearchParams usually handles this well.
        // We use { replace: true } to not clutter history too much? 
        // Or false if they want back button support. Let's start with default (push).
        if (newParams.toString() !== searchParams.toString()) {
            navigate(`?${newParams.toString()}`, { replace: true });
        }
    }, [selectedBoard, navigate, searchParams]);

    // Cascade Logic: Update available Filters (Dependent Dropdowns)
    useEffect(() => {
        // Global Projects: They don't have board_id anymore.
        // So we don't filter 'projects' by board_id strictly at the source.
        // Instead, we determine availability via Relations.

        // 1. Available Clients (Filtered by Board Association)
        const validClientIdsForBoard = new Set<string>();

        if (selectedBoard) {
            // Strategy A: From Board-Specific Links (Service Catalog)
            clients.forEach(c => {
                if (c.client_projects?.some(cp => cp.board_id === selectedBoard)) {
                    validClientIdsForBoard.add(c.id);
                }
                // Legacy Fallback: Check if client has projects physically on this board
                // (Useful during migration or mixed state)
                if (c.project_ids?.some(pid => projects.find(p => p.id === pid && p.board_id === selectedBoard))) {
                    validClientIdsForBoard.add(c.id);
                }
            });

            // Strategy B: From Actual Tasks (Hydration Fallback)
            if (tasks.length > 0) {
                tasks.forEach(t => {
                    // Filter tasks that belong to this board (via column or direct board_id logic)
                    // We assume tasks are currently fetched filtering by boardId (which service does)
                    // But here 'tasks' state might contain mixed data if not careful? 
                    // No, fetchTasks filters. So 'tasks' are relevant.
                    if (t.client_id) validClientIdsForBoard.add(t.client_id);
                    if (t.project?.client_id) validClientIdsForBoard.add(t.project.client_id);
                });
            }
        } else {
            // No board selected, all clients valid
            clients.forEach(c => validClientIdsForBoard.add(c.id));
        }

        // Strategy C: If no board selected, show all
        if (!selectedBoard) {
            setAvailableClients(clients);
        } else {
            // If board selected but no clients found via Projects or Tasks, 
            // it might be empty OR data not loaded yet.
            // But showing NOTHING is bad UX. 
            // If we found valid IDs, filter. If not, initially maybe show all?
            // User requested "Filtered", so we stick to validClientIds IF populated.
            if (validClientIdsForBoard.size > 0) {
                setAvailableClients(clients.filter(c => validClientIdsForBoard.has(c.id)));
            } else if (projects.length === 0 && tasks.length === 0) {
                // Nothing loaded for this board, empty list
                setAvailableClients([]);
            } else {
                // Board has stuff but logic missed it? Unlikely with Strategy B.
                // Fallback to empty to avoid showing wrong clients.
                setAvailableClients([]);
            }
        }

        // 2. Available Projects (Dynamic Catalog Filter)
        let filteredProjects = projects;

        const currentClient = selectedClient ? clients.find(c => c.id === selectedClient) : null;

        if (currentClient && selectedBoard) {
            // Strict: Logic "Service X active on Board Y for Client Z"
            if (currentClient.client_projects) {
                const activeProjectIds = new Set(
                    currentClient.client_projects
                        .filter(cp => cp.board_id === selectedBoard)
                        .map(cp => cp.project_id)
                );
                filteredProjects = filteredProjects.filter(p => activeProjectIds.has(p.id));
            }
        } else if (currentClient) {
            // Relaxed: All services for this client
            if (currentClient.client_projects) {
                const activeProjectIds = new Set(currentClient.client_projects.map(cp => cp.project_id));
                filteredProjects = filteredProjects.filter(p => activeProjectIds.has(p.id));
            }
        }

        // Final set
        setAvailableProjects(filteredProjects);

        // 3. Available Teams (ALWAYS ALL - Requested by User)
        setAvailableTeams(teams);

        // 4. Update Available Users based on Team (Priority)
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
        if (selectedProject && !filteredProjects.find(p => p.id === selectedProject)) {
            setSelectedProject('');
        }
    }, [selectedBoard, selectedTeam, selectedClient, projects, clients, teams, allUsers, selectedProject, tasks]); // Added 'tasks' dependency

    // Trigger Fetch on Filter Change
    useEffect(() => {
        // Debounce could be added here if needed, but for now direct call
        fetchTasks();
    }, [selectedBoard, selectedClient, selectedTeam, selectedProject, filterMine, filterUrgent, filterOverdue]);

    // Helper Functions
    // Helper functions moved to TaskCard

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
        if (data) {
            console.log('Clientes carregados:', data.length);
            setClients(data);
        }
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

    const fetchTasks = async () => {
        setLoadingTasks(true);
        const filters: any = {};

        if (selectedProject) filters.projectId = selectedProject;
        if (selectedBoard) filters.boardId = selectedBoard; // Now supported by service
        if (selectedClient) filters.clientId = selectedClient; // Now supported by service
        if (selectedTeam) filters.teamId = selectedTeam; // Now supported by service
        if (selectedUser) filters.assigneeId = selectedUser;

        const { data, error } = await taskService.getTasks(filters);

        if (error) {
            console.error('Error fetching tasks:', error);
            toast.error(`Erro ao carregar tarefas: ${error.message || (error as any).details || (error as any).hint || 'Erro desconhecido'}`);
        } else if (data) {
            setTasks(data);
        }
        setLoadingTasks(false);
    };

    // Real-time Sync
    useEffect(() => {
        const channel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                // Simple re-fetch strategy for now to ensure consistency
                // Advanced: Optimistic updates based on payload
                console.log('Real-time update:', payload);
                fetchTasks();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_boards' }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedProject, selectedBoard, selectedClient, selectedTeam, selectedUser]);

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
        console.log('onDragEnd Triggered:', result);
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
            const sourceColumnId = source.droppableId;
            const destColumnId = destination.droppableId;
            const destIndex = destination.index;

            // 1. Find the tasks in the destination column purely for calculation
            // CRITICAL: We must use the EXACT same filtering logic as the render method to ensure 'destIndex' matches the filtered array.

            const destColumn = columns.find(c => c.id === destColumnId);

            const destColumnTasks = tasks
                .filter(t => {
                    // Exclude self from the "existing neighbors" list
                    if (t.id === draggableId) return false;

                    // Logic matching the Render Method:
                    if (destColumnId.startsWith('def-')) {
                        // Default columns: match by status
                        return destColumn?.statuses?.includes(t.status);
                    }

                    // Custom columns
                    if (t.column_id === destColumnId) return true;

                    // Fallback for tasks without column_id matching status (if applicable)
                    if (!t.column_id && destColumn?.statuses?.includes(t.status)) {
                        const primaryColumn = columns.find(c => c.statuses.includes(t.status));
                        return primaryColumn?.id === destColumnId;
                    }
                    return false;
                })
                .sort((a, b) => (a.position || 0) - (b.position || 0)); // Ensure sorted by position

            // 2. Calculate New Position (Standard Fractional Indexing)
            let newPosition = 0;

            if (destColumnTasks.length === 0) {
                newPosition = 1000;
            } else if (destIndex === 0) {
                // Top
                newPosition = (destColumnTasks[0].position || 0) / 2;
                if (newPosition < 1) newPosition = 1;
            } else if (destIndex >= destColumnTasks.length) {
                // Bottom
                const last = destColumnTasks[destColumnTasks.length - 1];
                newPosition = (last.position || 0) + 1000;
            } else {
                // Middle
                const prev = destColumnTasks[destIndex - 1];
                const next = destColumnTasks[destIndex];
                newPosition = ((prev.position || 0) + (next.position || 0)) / 2;
            }

            // 3. Determine New Status (Visual Only for now, backend triggers/logic might override status but position is key)

            let newStatus = tasks.find(t => t.id === draggableId)?.status || 'TODO';

            if (destColumn && destColumnId !== sourceColumnId) {
                newStatus = destColumn.statuses[0] as any;
                const isLastColumn = columns[columns.length - 1].id === destColumnId;
                if (isLastColumn || destColumn.variant === 'done') {
                    newStatus = 'DONE';
                }
            }

            // 4. Update State Optimistically
            // Use map to return new array, ensuring sorting holds visually? 
            // Actually, DND library handles the visual 'gap'. We just need to update the data so next render puts it there.
            // But since our Sort is by 'position', updating the position is crucial for the list to remain stable after re-render / fetch.
            setTasks(prevTasks => {
                const updated = prevTasks.map(t =>
                    t.id === draggableId
                        ? { ...t, status: newStatus as any, column_id: destColumnId, position: newPosition }
                        : t
                );
                // We must re-sort the state immediately to match the new positions, 
                // otherwise the UI might jump if the DND library relinquishes control and React renders unsorted data.
                return updated.sort((a, b) => (a.position || 0) - (b.position || 0));
            });

            // 5. Persist to Backend
            const updates: any = { status: newStatus as any, position: newPosition };
            if (destColumn && !destColumn.id.startsWith('def-')) {
                updates.column_id = destColumnId;
            }

            console.log('Moving Task:', { draggableId, newPosition, newStatus, destIndex, neighbors: destColumnTasks.map(t => t.position) });

            try {
                // Use taskService for batch or direct update? 
                // Direct Supabase call is fine here as per existing pattern
                const { error } = await supabase.from('tasks').update(updates).eq('id', draggableId);
                if (error) throw error;
            } catch (error) {
                console.error('Error moving task:', error);
                toast.error('Erro ao mover tarefa');
                fetchTasks(); // Revert on error
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
            <div className="flex-shrink-0 px-6 py-3 border-b border-border-light dark:border-border-dark bg-background-dark min-h-[64px] flex items-center justify-between gap-4">

                {/* Left Side: Filters (Scrollable) */}
                <div className="flex items-center gap-3 flex-1 overflow-x-auto no-scrollbar pb-1 mask-gradient-right">
                    <SelectDropdown
                        value={selectedBoard}
                        onChange={(val) => {
                            setSelectedBoard(val);
                            setSelectedClient('');
                            setSelectedProject('');
                            // Team is global, keep it selected for better UX across boards
                            setSelectedUser('');
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
                        value={selectedClient}
                        onChange={(val) => {
                            setSelectedClient(val);
                            setSelectedProject('');
                            setSelectedTeam('');
                            setSelectedUser('');
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
                        value={selectedProject}
                        onChange={(val) => {
                            setSelectedProject(val);
                            setSelectedTeam('');
                            setSelectedUser('');
                        }}
                        options={[
                            { label: 'Todos os Projetos', value: '' },
                            ...availableProjects.map(p => ({ label: p.name, value: p.id }))
                        ]}
                        placeholder="Selecione um Projeto"
                        icon="folder"
                        className="min-w-[200px] flex-shrink-0"
                    />

                    <SelectDropdown
                        value={selectedTeam}
                        onChange={(val) => {
                            setSelectedTeam(val);
                            setSelectedUser('');
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
            {loadingTasks ? (
                <div className="flex gap-4 p-6 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="min-w-[300px] h-[70vh] bg-surface-dark/30 rounded-xl p-4 space-y-4 border border-white/5 animate-pulse">
                            <div className="flex justify-between items-center">
                                <div className="h-6 bg-white/5 rounded w-1/3"></div>
                                <div className="h-5 w-8 bg-white/5 rounded"></div>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="h-32 bg-background-dark/50 rounded-lg"></div>
                                <div className="h-24 bg-background-dark/50 rounded-lg"></div>
                                <div className="h-40 bg-background-dark/50 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-1 overflow-x-auto p-2 md:p-6">
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
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    className={`flex-1 overflow-y-auto p-2 custom-scrollbar transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                                                                >
                                                                    {columnTasks.map((task, index) => {
                                                                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';

                                                                        return (
                                                                            <TaskCard
                                                                                key={task.id}
                                                                                task={task as any}
                                                                                index={index}
                                                                                columnVariant={column.variant}
                                                                                isOverdue={!!isOverdue}
                                                                                clientsList={clients}
                                                                                activeTeamLog={!!activeTeamLogs[task.id]}
                                                                                onEdit={() => handleEdit(task)}
                                                                                onClone={handleCloneSuccess}
                                                                                onUpdate={handleUpdateList}
                                                                            />
                                                                        );
                                                                    })}
                                                                    {provided.placeholder}

                                                                    {columnTasks.length === 0 && (
                                                                        <div className="h-20 flex items-center justify-center text-text-muted/20 border-2 border-dashed border-white/5 rounded-lg text-xs">
                                                                            Vazio
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
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
            )}

            <NewColumnModal
                isOpen={isNewColumnModalOpen}
                onClose={() => setIsNewColumnModalOpen(false)}
                onAdd={handleAddColumn}
            />

            {/* Edit Drawer Modal */}
            <TaskEditDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditTaskNumber(undefined);
                }}
                taskNumber={editTaskNumber || undefined}
                onSuccess={handleUpdateList}
            />
        </div>
    );
}
