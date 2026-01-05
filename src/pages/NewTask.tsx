import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SimpleEditor from '../components/SimpleEditor';
import ModernDropdown from '../components/ModernDropdown';
import { useAuth } from '../contexts/AuthContext';
import { taskService, type Task } from '../services/task.service';
import { toast } from 'sonner';

import { MultiBoardSelector } from '../components/MultiBoardSelector';
import type { Board } from '../types/database.types';

type SelectOption = {
    id: string;
    name: string;
    default_team_id?: string;
};

type User = {
    id: string;
    full_name: string;
    avatar_url?: string;
};



export default function NewTask() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams(); // 'id' here is task_number based on routes
    const [searchParams] = useSearchParams();
    const cloneFrom = searchParams.get('clone_from');

    const [taskId, setTaskId] = useState<string | null>(null); // Real UUID

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isOngoing, setIsOngoing] = useState(false);
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    // Initialize status from query param or default to 'TODO'
    const [status, setStatus] = useState<string>(searchParams.get('status') || 'TODO');

    // Relationships
    const [clientId, setClientId] = useState('');
    const [projectId, setProjectId] = useState('');
    const [workflowId, setWorkflowId] = useState('');

    // Assignees State (Multiple)
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

    // UI States
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [files, setFiles] = useState<File[]>([]);


    // Multi-Board State
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowAssigneeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Data lists
    const [clients, setClients] = useState<SelectOption[]>([]);
    const [projects, setProjects] = useState<SelectOption[]>([]);
    const [workflows, setWorkflows] = useState<SelectOption[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(false);

    // Client Filtering Context
    const [clientBoardMap, setClientBoardMap] = useState<Map<string, Set<string>>>(new Map());

    useEffect(() => {
        fetchBoards();
        fetchClientsAndMap();
        fetchWorkflows();
        fetchUsers();
    }, []);

    useEffect(() => {
        const paramStatus = searchParams.get('status');
        if (paramStatus) {
            setStatus(paramStatus);
        }
    }, [searchParams]);

    useEffect(() => {
        if (id) {
            fetchTaskDetails(id);
        } else if (cloneFrom) {
            fetchTaskDetails(cloneFrom, true);
        }
    }, [id, cloneFrom]);

    useEffect(() => {
        if (clientId) {
            fetchProjectsByClient(clientId);
        } else {
            setProjects([]);
            setProjectId('');
            setTeamMemberIds(new Set());
        }
    }, [clientId]);

    useEffect(() => {
        if (projectId) {
            fetchTeamByProject(projectId);
        } else if (clientId) {
            fetchTeamFromClient(clientId);
        } else {
            setTeamMemberIds(new Set());
        }
    }, [projectId, clientId]);



    // Fetch Clients & Build Board Map for Filtering
    const fetchClientsAndMap = async () => {
        // 1. Fetch Clients
        const { data: clientsData } = await supabase.from('clients').select('id, name, default_team_id, default_board_id').eq('status', 'ACTIVE').order('name');
        if (clientsData) setClients(clientsData);

        // 2. Fetch All Project Links (Client -> Board)
        const { data: projectsData } = await supabase.from('projects').select('client_id, board_id');

        const map = new Map<string, Set<string>>();

        // Add default boards
        clientsData?.forEach(c => {
            if (!map.has(c.id)) map.set(c.id, new Set());
            if (c.default_board_id) map.get(c.id)?.add(c.default_board_id);
        });

        // Add project boards
        projectsData?.forEach(p => {
            if (p.client_id && p.board_id) {
                if (!map.has(p.client_id)) map.set(p.client_id, new Set());
                map.get(p.client_id)?.add(p.board_id);
            }
        });

        setClientBoardMap(map);
    };

    const fetchWorkflows = async () => {
        const { data } = await supabase.from('workflows').select('id, name').order('name');
        if (data) setWorkflows(data);
    };
    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('id, full_name, avatar_url').order('full_name');
        if (data) setUsers(data);
    };
    const fetchTeamFromClient = async (cliId: string) => {
        const client = clients.find(c => c.id === cliId);
        if (client?.default_team_id) {
            const { data: members } = await supabase
                .from('user_teams')
                .select('user_id')
                .eq('team_id', client.default_team_id);

            if (members) {
                setTeamMemberIds(new Set(members.map((m: any) => m.user_id)));
            } else {
                setTeamMemberIds(new Set());
            }
        } else {
            setTeamMemberIds(new Set());
        }
    };

    const fetchBoards = async () => {
        const { data } = await supabase.from('boards').select('*').order('name');
        if (data) {
            setBoards(data);
            // Pre-select from URL if creating new
            const paramBoardId = searchParams.get('boardId');
            if (paramBoardId && !id && !cloneFrom) {
                setSelectedBoardIds([paramBoardId]);
            }
        }
    };

    const fetchTeamByProject = async (projId: string) => {
        const { data: project } = await supabase
            .from('projects')
            .select('team_id')
            .eq('id', projId)
            .single();

        if (project?.team_id) {
            const { data: members } = await supabase
                .from('user_teams')
                .select('user_id')
                .eq('team_id', project.team_id);

            if (members) {
                setTeamMemberIds(new Set(members.map((m: any) => m.user_id)));
            } else {
                setTeamMemberIds(new Set());
            }
        } else if (clientId) {
            // Fallback to client team if project has no team
            fetchTeamFromClient(clientId);
        } else {
            setTeamMemberIds(new Set());
        }
    };

    const fetchProjectsByClient = async (clientId: string) => {
        const clientProjectsPromise = supabase.from('projects').select('id, name, board_id').eq('client_id', clientId).order('name');
        const globalProjectsPromise = supabase.from('projects').select('id, name, board_id').is('client_id', null).order('name');

        const [clientResult, globalResult] = await Promise.all([clientProjectsPromise, globalProjectsPromise]);
        const combinedData = [...(clientResult.data || []), ...(globalResult.data || [])];

        let uniqueProjects = Array.from(new Map(combinedData.map(item => [item.id, item])).values()).sort((a, b) => a.name.localeCompare(b.name));

        // Filter by Selected Boards if any
        if (selectedBoardIds.length > 0) {
            uniqueProjects = uniqueProjects.filter(p => !p.board_id || selectedBoardIds.includes(p.board_id));
            // Note: Global projects might not have board_id? Or they do. If they don't, keep them? 
            // Projects usually MUST have board_id in this system.
            // If p.board_id is null, maybe keep? Or exclude.
            // Assuming strict filtering if board is selected.
        }

        if (uniqueProjects.length > 0) {
            setProjects(uniqueProjects);
            if (uniqueProjects.length === 1) setProjectId(uniqueProjects[0].id);
        } else {
            setProjects([]);
        }
    };

    const fetchTaskDetails = async (taskNumber: string, isClone: boolean = false) => {
        setLoading(true);
        const { data, error } = await taskService.getTaskByNumber(taskNumber);

        if (error) {
            console.error('Error fetching task details:', error);
            toast.error(error.message);
            navigate('/dashboard');
        } else if (data) {
            if (!isClone) {
                setTaskId(data.id);
                setTitle(data.title);
                // On edit, update status from fetched data
                if (data.status) setStatus(data.status);
            } else {
                setTitle(`Cópia de ${data.title}`);
                // Cloned tasks default to TODO or kept param status, ignore source status usually? 
                // Let's keep the current behavior (likely TODO via default state unless param overrides)
            }

            setDescription(data.description || '');
            setPriority(data.priority || 'MEDIUM');
            if (data.client_id) setClientId(data.client_id);
            if (data.project_id) setProjectId(data.project_id);
            if (data.workflow_id) setWorkflowId(data.workflow_id); // Type 'string | null' is not assignable to type 'SetStateAction<string>'.

            if (data.due_date) {
                // Ensure YYYY-MM-DD format for input[type="date"] from ISO string
                setDueDate(data.due_date.split('T')[0]);
                setIsOngoing(false);
            } else {
                setIsOngoing(true);
            }

            if (data.task_assignees && data.task_assignees.length > 0) {
                setAssigneeIds(data.task_assignees.map((ta: any) => ta.user_id));
            } else if (data.assignee_id) {
                setAssigneeIds([data.assignee_id]);
            }

            // Load Boards
            if (data.board_ids && data.board_ids.length > 0) {
                setSelectedBoardIds(data.board_ids);
            } else if (data.project?.board_id) {
                // Fallback for old tasks
                setSelectedBoardIds([data.project.board_id]);
            }

            if (data.attachments) {
                console.log('Task has attachments:', data.attachments);
            }
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.warning('Por favor, digite um título para a tarefa.');
            return;
        }

        if (!clientId || !projectId || (!isOngoing && !dueDate) || assigneeIds.length === 0 || !description) {
            toast.warning('Por favor, preencha todos os campos obrigatórios (*)');
            return;
        }

        setLoading(true);

        try {
            const payload: any = { // Using any to bypass strict checks for nulls, validated by UI logic
                title,
                description,
                status: status, // Use flexible status state
                priority: priority,
                due_date: isOngoing ? null : dueDate,
                client_id: clientId,
                project_id: projectId,
                workflow_id: workflowId || null,
                assignee_id: assigneeIds[0], // Legacy/Primary assignee
                created_by: !taskId ? user?.id : undefined, // Only on create
                board_ids: selectedBoardIds // Multi-Board Link
            };

            let savedTask: Task | null = null;
            let error: Error | null = null;

            if (taskId) {
                const res = await taskService.updateTask(taskId, payload);
                savedTask = res.data;
                error = res.error;
            } else {
                const res = await taskService.createTask(payload);
                savedTask = res.data;
                error = res.error;
            }

            if (error) throw error;
            if (!savedTask) throw new Error("Task save returned no data");

            // Assignees
            if (assigneeIds.length > 0) {
                const { error: assignError } = await taskService.assignUsersToTask(savedTask.id, assigneeIds);
                if (assignError) toast.error(`Erro ao atribuir usuários: ${assignError.message}`);
            }

            // Uploads
            if (files.length > 0) {
                for (const file of files) {
                    const { error: uploadError } = await taskService.uploadAttachment(savedTask.id, file);
                    if (uploadError) toast.error(`Erro ao enviar anexo ${file.name}: ${uploadError.message}`);
                }
            }

            toast.success(taskId ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!');
            if (taskId) {
                navigate(`/tasks/${id}`);
            } else {
                navigate('/dashboard');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar tarefa');
        } finally {
            setLoading(false);
        }
    };

    const sortedUsers = [...users].sort((a, b) => {
        const aIsTeam = teamMemberIds.has(a.id);
        const bIsTeam = teamMemberIds.has(b.id);
        if (aIsTeam && !bIsTeam) return -1;
        if (!aIsTeam && bIsTeam) return 1;
        return a.full_name.localeCompare(b.full_name);
    });

    const selectedUsers = sortedUsers.filter(u => assigneeIds.includes(u.id));
    // Show ALL users in dropdown, including selected ones (so they can be toggled off)
    const filteredUsers = assigneeSearch
        ? sortedUsers.filter(u =>
            u.full_name.toLowerCase().includes(assigneeSearch.toLowerCase())
        )
        : sortedUsers;

    // Filter Clients based on Selected Boards
    const filteredClients = selectedBoardIds.length > 0
        ? clients.filter(c => {
            const clientBoards = clientBoardMap.get(c.id);
            if (!clientBoards) return false;
            // Check intersection: Does client have ANY of the selected boards?
            return selectedBoardIds.some(bid => clientBoards.has(bid));
        })
        : clients; // If no board selected, show all? Or Show None? User flow implies choosing Board first. 
    // Let's show all for flexibility if they selected nothing yet.


    // Independent editor upload logic (could be service, but simple enough here)
    const handleEditorImageUpload = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `editor-uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('task-attachments').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('task-attachments').getPublicUrl(fileName);
        return data.publicUrl;
    };



    return (
        <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10 flex flex-col gap-6 animate-fade-in pb-0 overflow-hidden h-[90vh] max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
                <div className="flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Digite o título da tarefa..."
                        className="text-3xl font-bold text-white tracking-tight bg-transparent border-none outline-none placeholder-gray-600 w-full focus:ring-0 p-0"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-surface-border">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <form className="flex-1 flex flex-col gap-6 px-1 overflow-hidden" onSubmit={handleSubmit}>
                {/* Scrollable Content Area */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Row 1: Context (3 Columns) */}
                    <div className="grid grid-cols-12 gap-5 items-end shrink-0">
                        {/* Col 1: Boards (Robust Multi-Select) */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary">view_kanban</span>
                                Quadros <span className="text-primary">*</span>
                            </label>
                            <MultiBoardSelector
                                boards={boards}
                                selectedBoardIds={selectedBoardIds}
                                onChange={setSelectedBoardIds}
                            />
                        </div>

                        {/* Col 2: Client */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">business</span>
                                Cliente <span className="text-primary">*</span>
                            </label>
                            <ModernDropdown
                                value={clientId}
                                onChange={setClientId}
                                options={filteredClients}
                                placeholder="Selecione..."
                                disabled={selectedBoardIds.length === 0}
                            />
                        </div>

                        {/* Col 3: Workflow */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">rule</span>
                                Fluxo
                            </label>
                            <ModernDropdown
                                value={workflowId}
                                onChange={setWorkflowId}
                                options={workflows.length > 0 ? workflows : [
                                    { id: 'backlog', name: '📋 Backlog' },
                                    { id: 'todo', name: '🚀 A Fazer' },
                                    { id: 'inprogress', name: '⚡ Em Progresso' },
                                    { id: 'review', name: '👀 Revisão' },
                                    { id: 'done', name: '✅ Concluído' }
                                ]}
                                placeholder="Etapa..."
                                icon="view_kanban"
                            />
                        </div>
                    </div>

                    {/* Row 2: Details (3 Columns) */}
                    <div className="grid grid-cols-12 gap-5 items-end shrink-0">
                        {/* Col 1: Project */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">folder</span>
                                Projeto <span className="text-primary">*</span>
                            </label>
                            <ModernDropdown
                                value={projectId}
                                onChange={setProjectId}
                                options={projects}
                                placeholder="Projeto..."
                            />
                        </div>

                        {/* Col 2: Due Date */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    Prazo
                                </label>
                                {/* Modern Toggle Switch */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Contínua</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsOngoing(!isOngoing)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark ${isOngoing ? 'bg-primary' : 'bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${isOngoing ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <input
                                type="date"
                                value={dueDate}
                                disabled={isOngoing}
                                onChange={(e) => setDueDate(e.target.value)}
                                className={`w-full h-12 bg-surface-dark border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium [color-scheme:dark] ${isOngoing ? 'opacity-50 cursor-not-allowed text-gray-500' : ''}`}
                            />
                        </div>

                        {/* Col 3: Assignees */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">group</span>
                                Responsáveis <span className="text-primary">*</span>
                            </label>
                            {/* Assignee Dropdown Logic */}

                            <div className="relative group w-full" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssigneeDropdown(!showAssigneeDropdown);
                                        if (!showAssigneeDropdown) {
                                            setTimeout(() => document.getElementById('assignee-search-input')?.focus(), 50);
                                        }
                                    }}
                                    className={`w-full h-12 bg-surface-dark border border-gray-700 rounded-xl px-3 flex items-center justify-between gap-2 text-white transition-all hover:border-gray-500 ${showAssigneeDropdown ? 'ring-2 ring-primary border-transparent' : ''}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        <div className="flex items-center justify-center size-5 rounded-full border border-gray-600 bg-gray-800 shrink-0">
                                            {selectedUsers.length > 0 && selectedUsers[0].avatar_url ? (
                                                <div className="size-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${selectedUsers[0].avatar_url}')` }}></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-[16px] text-gray-400">group</span>
                                            )}
                                        </div>

                                        <span className={`text-sm font-medium truncate ${selectedUsers.length > 0 ? 'text-white' : 'text-gray-500'}`}>
                                            {selectedUsers.length === 0
                                                ? "Selecionar responsáveis..."
                                                : selectedUsers.length <= 2
                                                    ? selectedUsers.map(u => u.full_name?.split(' ')[0]).join(', ')
                                                    : `${selectedUsers.length} selecionados`
                                            }
                                        </span>
                                    </div>
                                    <span className={`material-symbols-outlined text-gray-500 transition-transform duration-200 ${showAssigneeDropdown ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
                                </button>

                                {showAssigneeDropdown && (
                                    <div className="absolute top-[110%] left-0 w-full bg-surface-dark border border-gray-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[300px]">
                                        <div className="p-2 border-b border-gray-800 bg-surface-dark sticky top-0 z-10">
                                            <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700 focus-within:border-primary/50 transition-colors">
                                                <span className="material-symbols-outlined text-gray-500 text-[18px]">search</span>
                                                <input
                                                    id="assignee-search-input"
                                                    type="text"
                                                    value={assigneeSearch}
                                                    onChange={(e) => setAssigneeSearch(e.target.value)}
                                                    placeholder="Buscar usuário..."
                                                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-y-auto custom-scrollbar p-1">
                                            {filteredUsers.length > 0 ? filteredUsers.map(u => {
                                                const isSelected = assigneeIds.includes(u.id);
                                                return (
                                                    <div
                                                        key={u.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssigneeIds(prev => isSelected
                                                                ? prev.filter(id => id !== u.id)
                                                                : [...prev, u.id]
                                                            );
                                                        }}
                                                        className={`
                                                            px-3 py-2.5 mx-1 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 group/item relative overflow-hidden
                                                            ${isSelected
                                                                ? 'bg-primary/20 text-white'
                                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <div className={`w-1 h-8 absolute -left-4 rounded-r-full transition-all duration-300 ${isSelected ? 'bg-primary shadow-[0_0_10px_#00FF00]' : 'bg-transparent'}`}></div>
                                                            <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-gray-500 group-hover/item:text-gray-300'}`}>
                                                                {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                                            </span>

                                                            <div className={`size-6 rounded-full border bg-cover bg-center shrink-0 ${isSelected ? 'border-primary/50' : 'border-gray-600 bg-gray-700'}`} style={{ backgroundImage: u.avatar_url ? `url('${u.avatar_url}')` : undefined }}>
                                                                {!u.avatar_url && <span className="flex items-center justify-center h-full text-[9px] font-bold text-gray-400">{u.full_name?.charAt(0)}</span>}
                                                            </div>

                                                            <span className="text-sm font-medium">{u.full_name}</span>
                                                        </div>
                                                        {isSelected && <span className="material-symbols-outlined text-primary text-[18px] drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">check</span>}
                                                    </div>
                                                );
                                            }) : <div className="px-4 py-8 text-sm text-gray-400 text-center italic flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-[24px] opacity-50">person_off</span>
                                                Nenhum usuário encontrado
                                            </div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description - Fills Remaining Space */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden pb-0">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">description</span>
                            Descrição
                        </label>
                        <div className="flex-1 rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors flex flex-col h-full">
                            <SimpleEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="Descreva os detalhes da tarefa aqui..."
                                onImageUpload={handleEditorImageUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer: Locked to Bottom (Sticky/Fixed behavior) */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-5 mt-auto bg-transparent backdrop-blur-xl shrink-0 sticky bottom-0 z-10 w-full px-6 md:px-10 -mx-6 md:-mx-10 mb-[-24px] pb-8">
                    {/* Left: Metadata */}
                    <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                        <div className="relative group shrink-0">
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => e.target.files && setFiles([...files, ...Array.from(e.target.files)])} />
                            <div className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all cursor-pointer ${files.length > 0 ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(0,255,0,0.1)]' : 'bg-surface-dark border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'}`}>
                                <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{files.length > 0 ? `${files.length} Anexos` : 'Anexar Arquivos'}</span>
                            </div>
                        </div>

                        <div className="flex items-center bg-surface-dark border border-gray-700/50 rounded-xl p-1.5 shrink-0">
                            {['low', 'medium', 'high'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p.toUpperCase() as any)}
                                    className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${priority === p.toUpperCase()
                                        ? (p === 'low' ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : p === 'medium' ? 'bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]')
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end">
                        <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-xl text-gray-400 text-xs font-bold hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex items-center gap-3 px-10 py-3.5 bg-primary hover:bg-[#0fd650] text-[#112217] font-bold text-sm uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(19,236,91,0.4)] hover:shadow-[0_0_35px_rgba(19,236,91,0.6)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50">
                            <span>{taskId ? 'Salvar Edição' : 'Criar Tarefa'}</span>
                            <span className="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </form>

            <div className="absolute bottom-6 left-10 text-gray-500 text-[10px] hidden lg:block opacity-30 pointer-events-none">
                Pressione <kbd className="font-sans px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">Ctrl</kbd> + <kbd className="font-sans px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-300">Enter</kbd> para enviar rápido
            </div>
        </div>
    );

}
