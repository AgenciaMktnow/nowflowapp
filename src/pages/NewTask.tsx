import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SimpleEditor from '../components/SimpleEditor';
import ModernDropdown from '../components/ModernDropdown';
import { useAuth } from '../contexts/AuthContext';
import { taskService, type Task } from '../services/task.service';
import { toast } from 'sonner';

type SelectOption = {
    id: string;
    name: string;
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

    // Data lists
    const [clients, setClients] = useState<SelectOption[]>([]);
    const [projects, setProjects] = useState<SelectOption[]>([]);
    const [workflows, setWorkflows] = useState<SelectOption[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClients();
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
        }
    }, [clientId]);

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name').eq('status', 'ACTIVE').order('name');
        if (data) setClients(data);
    };
    const fetchWorkflows = async () => {
        const { data } = await supabase.from('workflows').select('id, name').order('name');
        if (data) setWorkflows(data);
    };
    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('id, full_name, avatar_url').order('full_name');
        if (data) setUsers(data);
    };
    const fetchProjectsByClient = async (clientId: string) => {
        const clientProjectsPromise = supabase.from('projects').select('id, name').eq('client_id', clientId).order('name');
        const globalProjectsPromise = supabase.from('projects').select('id, name').is('client_id', null).order('name');

        const [clientResult, globalResult] = await Promise.all([clientProjectsPromise, globalProjectsPromise]);
        const combinedData = [...(clientResult.data || []), ...(globalResult.data || [])];
        const uniqueProjects = Array.from(new Map(combinedData.map(item => [item.id, item])).values()).sort((a, b) => a.name.localeCompare(b.name));

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
                setDueDate(data.due_date);
                setIsOngoing(false);
            } else {
                setIsOngoing(true);
            }

            if (data.task_assignees && data.task_assignees.length > 0) {
                setAssigneeIds(data.task_assignees.map((ta: any) => ta.user_id));
            } else if (data.assignee_id) {
                setAssigneeIds([data.assignee_id]);
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
                created_by: !taskId ? user?.id : undefined // Only on create
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

    const selectedUsers = users.filter(u => assigneeIds.includes(u.id));
    const filteredUsers = assigneeSearch
        ? users.filter(u =>
            u.full_name.toLowerCase().includes(assigneeSearch.toLowerCase()) &&
            !assigneeIds.includes(u.id)
        )
        : [];

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
        <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10 flex flex-col gap-6 animate-fade-in pb-10 overflow-y-auto h-full">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Digite o título da tarefa..."
                        className="text-3xl font-bold text-white tracking-tight bg-transparent border-none outline-none placeholder-gray-600 w-full focus:ring-0 p-0"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 text-xs font-bold text-gray-300 hover:bg-surface-border transition-colors hover:text-primary" type="button">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        Clonar Tarefa
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-surface-border">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                {/* Editor, Fields, same layout logic... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
                            Cliente <span className="text-primary">*</span>
                        </label>
                        <div className="relative group">
                            <ModernDropdown
                                value={clientId}
                                onChange={setClientId}
                                options={clients}
                                placeholder="Selecione o cliente..."
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
                            Projeto <span className="text-primary">*</span>
                        </label>
                        <div className="relative group">
                            <ModernDropdown
                                value={projectId}
                                onChange={setProjectId}
                                options={projects}
                                placeholder="Selecione o projeto..."
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
                            Fluxo da Tarefa
                        </label>
                        <div className="relative group">
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
                                placeholder="Selecione a etapa..."
                                icon="view_kanban"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
                                Prazo {!isOngoing && <span className="text-primary">*</span>}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={isOngoing}
                                        onChange={(e) => setIsOngoing(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium group-hover:text-primary transition-colors">Tarefa Contínua</span>
                            </label>
                        </div>
                        <div className="relative group">
                            <input
                                type="date"
                                value={dueDate}
                                disabled={isOngoing}
                                onChange={(e) => setDueDate(e.target.value)}
                                className={`w-full h-14 bg-surface-dark border border-gray-700 rounded-xl px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium [color-scheme:dark] ${isOngoing ? 'opacity-50 cursor-not-allowed text-gray-500' : ''}`}
                                placeholder="DD/MM/AAAA"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
                            Atribuir para (Múltiplos) <span className="text-primary">*</span>
                        </label>
                        <div className="relative group w-full min-h-[56px] bg-surface-dark border border-gray-700 rounded-xl px-3 py-2 text-white focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all cursor-text hover:border-gray-500 flex flex-wrap items-center gap-2">
                            {selectedUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-2 bg-gray-800 pl-1 pr-2 py-1 rounded-lg border border-gray-700 select-none">
                                    <div className="size-6 rounded-full bg-cover bg-center" style={{ backgroundImage: user.avatar_url ? `url('${user.avatar_url}')` : undefined, backgroundColor: '#cbd5e1' }}></div>
                                    <span className="text-xs font-bold text-gray-200">{user.full_name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setAssigneeIds(prev => prev.filter(id => id !== user.id))}
                                        className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </div>
                            ))}
                            <input
                                type="text"
                                value={assigneeSearch}
                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                className="bg-transparent border-none outline-none focus:ring-0 p-1 text-sm text-white placeholder-gray-400 flex-1 min-w-[150px]"
                                placeholder={assigneeIds.length === 0 ? "Adicionar pessoas ou times..." : "Adicionar mais..."}
                            />
                            {assigneeSearch && (
                                <div className="absolute top-full left-0 w-full bg-surface-dark border border-gray-700 rounded-xl mt-1 py-1 shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                setAssigneeIds(prev => [...prev, u.id]);
                                                setAssigneeSearch('');
                                            }}
                                            className="px-4 py-2 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                                        >
                                            <div className="size-6 rounded-full bg-gray-300"></div>
                                            <span className="text-sm text-white">{u.full_name}</span>
                                        </div>
                                    )) : (
                                        <div className="px-4 py-2 text-sm text-gray-400">Nenhum usuário encontrado</div>
                                    )}
                                </div>
                            )}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-200 flex items-center gap-1">
                        Descrição da Tarefa <span className="text-primary">*</span>
                    </label>
                    <SimpleEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Descreva os detalhes da tarefa aqui..."
                        onImageUpload={handleEditorImageUpload}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-200">
                        Anexos
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer bg-surface-dark hover:border-primary hover:bg-surface-border/30 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary mb-2 transition-colors">cloud_upload</span>
                            <p className="text-sm text-gray-400"><span className="font-semibold text-primary">Clique para fazer upload</span> ou arraste e solte</p>
                            <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG ou PDF (max. 10MB)</p>
                        </div>
                        <input type="file" multiple className="hidden" onChange={(e) => e.target.files && setFiles([...files, ...Array.from(e.target.files)])} />
                    </label>
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {files.map((f, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-surface-dark border border-gray-700 px-2 py-1 rounded text-xs text-white">
                                    <span className="material-symbols-outlined text-[14px]">description</span>
                                    {f.name}
                                    <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-200">Prioridade</label>
                    <div className="flex items-center gap-3">
                        {['low', 'medium', 'high'].map(p => (
                            <label key={p} className="cursor-pointer">
                                <input type="radio" name="priority" value={p.toUpperCase()} checked={priority === p.toUpperCase()} onChange={() => setPriority(p.toUpperCase() as any)} className="peer sr-only" />
                                <div className={`px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm font-medium transition-all hover:bg-surface-border capitalize
                                    ${p === 'low' ? 'peer-checked:bg-blue-500/20 peer-checked:border-blue-500 peer-checked:text-blue-500' : ''}
                                    ${p === 'medium' ? 'peer-checked:bg-yellow-500/20 peer-checked:border-yellow-500 peer-checked:text-yellow-500' : ''}
                                    ${p === 'high' ? 'peer-checked:bg-red-500/20 peer-checked:border-red-500 peer-checked:text-red-500' : ''}
                                `}>
                                    {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-gray-800">
                    <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-full text-gray-300 font-bold text-sm hover:bg-surface-border transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-[#0fd650] text-[#112217] font-bold text-sm rounded-full shadow-[0_0_15px_rgba(19,236,91,0.3)] hover:shadow-[0_0_25px_rgba(19,236,91,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50">
                        <span>{taskId ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
                        <span className="material-symbols-outlined text-[18px] font-bold">{taskId ? 'save' : 'arrow_forward'}</span>
                    </button>
                </div>
            </form>
            <div className="absolute bottom-6 text-gray-400 text-xs hidden md:block opacity-50">
                Pressione <kbd className="font-sans px-1 py-0.5 bg-surface-border rounded text-[10px]">Ctrl</kbd> + <kbd className="font-sans px-1 py-0.5 bg-surface-border rounded text-[10px]">Enter</kbd> para enviar
            </div>
        </div>
    );
}
