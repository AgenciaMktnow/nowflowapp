import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CloneTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: any; // Using any for flexibility with joined fields, strict type would be Task
    onClone: (newTaskId: string) => void;
}

export default function CloneTaskModal({ isOpen, onClose, task, onClone }: CloneTaskModalProps) {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState({
        description: true,
        checklist: true,
        attachments: true,
        assignees: true,
        dueDate: true,
        priority: true,
        tags: true,
        comments: true
    });

    useEffect(() => {
        if (task && isOpen) {
            setTitle(`(cópia) ${task.title}`);
            // Reset options to default true on open
            setOptions({
                description: true,
                checklist: true,
                attachments: true,
                assignees: true,
                dueDate: true,
                priority: true,
                tags: true,
                comments: true
            });
        }
    }, [task, isOpen]);

    const handleClone = async () => {
        if (!title.trim()) {
            toast.error('O título é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // 1. Prepare Description & Checklist Logic
            let finalDescription = '';
            if (task.description) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(task.description, 'text/html');
                const taskLists = doc.querySelectorAll('ul[data-type="taskList"]');

                if (options.description && options.checklist) {
                    finalDescription = task.description;
                } else if (options.description && !options.checklist) {
                    taskLists.forEach(ul => ul.remove());
                    finalDescription = doc.body.innerHTML;
                } else if (!options.description && options.checklist) {
                    // Only keep task lists
                    const container = document.createElement('div');
                    taskLists.forEach(ul => container.appendChild(ul.cloneNode(true)));
                    finalDescription = container.innerHTML;
                } else {
                    finalDescription = '';
                }
            }

            // 2. Create Task Record
            const { data: newTask, error } = await supabase
                .from('tasks')
                .insert({
                    title: title,
                    description: finalDescription,
                    status: 'TODO', // Reset status
                    priority: options.priority ? task.priority : 'MEDIUM',
                    due_date: options.dueDate ? task.due_date : null,
                    project_id: task.project_id,
                    client_id: task.client_id,
                    workflow_id: task.workflow_id,
                    created_by: user.id, // Set curret user as creator
                    attachments: options.attachments ? task.attachments : [],
                    tags: options.tags ? task.tags : [],
                    task_number: undefined, // Let DB generate
                })
                .select()
                .single();

            if (error) throw error;

            // 3. Handle Assignees (Many-to-Many)
            if (options.assignees && task.task_assignees && task.task_assignees.length > 0) {
                const assigneeRecords = task.task_assignees.map((ta: any) => ({
                    task_id: newTask.id,
                    user_id: ta.user_id || ta.user.id // Handle different join structures
                }));

                const { error: assignError } = await supabase
                    .from('task_assignees')
                    .insert(assigneeRecords);

                if (assignError) console.error('Error copying assignees:', assignError);
            }

            // 4. Handle Comments (Optional)
            if (options.comments) {
                // Fetch original comments
                const { data: originalComments } = await supabase
                    .from('task_comments')
                    .select('*')
                    .eq('task_id', task.id);

                if (originalComments && originalComments.length > 0) {
                    const commentRecords = originalComments.map((c: any) => ({
                        task_id: newTask.id,
                        user_id: c.user_id,
                        content: c.content,
                        created_at: c.created_at // Preserve original timestamp or let new one? Usually preserve for history context
                    }));

                    const { error: commentError } = await supabase
                        .from('task_comments')
                        .insert(commentRecords);

                    if (commentError) console.error('Error copying comments:', commentError);
                }
            }

            toast.success('Tarefa clonada com sucesso!');
            onClone(newTask.task_number);
            onClose();

        } catch (error: any) {
            console.error('Error cloning task:', error);
            toast.error(`Erro ao clonar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-[#0a140e] border border-primary rounded-2xl shadow-[0_0_50px_-12px_rgba(19,236,91,0.3)] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">content_copy</span>
                        Clonar Tarefa
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6 overflow-y-auto">

                    {/* Title Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">Título da Nova Tarefa</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#112217] border border-primary/30 rounded-lg p-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-lg"
                            placeholder="Nome da tarefa..."
                            autoFocus
                        />
                    </div>

                    {/* Options Grid */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">O que deseja copiar?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={options.description} onChange={(c) => setOptions({ ...options, description: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Descrição (Texto)</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={options.checklist} onChange={(c) => setOptions({ ...options, checklist: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Checklist</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={options.assignees} onChange={(c) => setOptions({ ...options, assignees: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Alocados (Membros)</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={options.attachments} onChange={(c) => setOptions({ ...options, attachments: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Anexos</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={options.dueDate} onChange={(c) => setOptions({ ...options, dueDate: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Prazos / Datas</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={options.priority} onChange={(c) => setOptions({ ...options, priority: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Prioridade / Tags</span>
                            </label>

                            <label className="col-span-2 flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                <CheckBox checked={(options as any).comments} onChange={(c) => setOptions({ ...options, comments: c })} />
                                <span className="text-sm text-gray-300 group-hover:text-white">Comentários / Histórico</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-[#0d1a12]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={loading || !title.trim()}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-[#0a140e] text-sm font-bold rounded-lg shadow-[0_0_15px_-3px_rgba(19,236,91,0.4)] hover:shadow-[0_0_20px_-3px_rgba(19,236,91,0.6)] transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                Clonando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">difference</span>
                                Confirmar Clonagem
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Simple Neon Checkbox Sub-component
const CheckBox = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="relative flex items-center justify-center shrink-0">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer appearance-none size-5 border-2 border-gray-600 rounded bg-transparent checked:bg-primary checked:border-primary cursor-pointer transition-all"
        />
        <span className="material-symbols-outlined absolute text-black text-[14px] pointer-events-none opacity-0 peer-checked:opacity-100 font-bold transition-opacity">
            check
        </span>
    </div>
);
