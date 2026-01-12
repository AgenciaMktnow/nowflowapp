import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { boardService } from '../../services/board.service';
import { teamService } from '../../services/team.service';
import NewWorkflowModal, { type WorkflowStep } from '../../components/NewWorkflowModal';

interface Workflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    board_id?: string;
}

interface Board {
    id: string;
    name: string;
}

export default function WorkflowsSettings() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setDataLoading(true);
        await Promise.all([
            fetchWorkflows(),
            fetchBoards(),
            fetchTeams(),
            fetchUsers()
        ]);
        setDataLoading(false);
    };

    const fetchWorkflows = async () => {
        const { data } = await supabase.from('workflows').select('*').order('created_at');
        if (data) setWorkflows(data);
    };

    const fetchBoards = async () => {
        const { data } = await boardService.getBoards();
        if (data) setBoards(data);
    };

    const fetchTeams = async () => {
        const { data } = await teamService.getTeams();
        if (data) setTeams(data);
    };

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, email')
            .order('full_name');

        if (data) {
            setUsers(data.map(u => ({
                id: u.id,
                name: u.full_name || u.email || 'Usuário sem nome'
            })));
        }
    };

    const handleSaveWorkflow = async (name: string, _description: string, steps: WorkflowStep[], boardId: string) => {
        try {
            if (editingWorkflow) {
                const { error } = await supabase
                    .from('workflows')
                    .update({ name, steps, board_id: boardId }) // description not in interface yet
                    .eq('id', editingWorkflow.id);

                if (error) throw error;
                toast.success('Fluxo atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('workflows')
                    .insert([{ name, steps, board_id: boardId }]);

                if (error) throw error;
                toast.success('Fluxo criado com sucesso!');
            }
            fetchWorkflows();
            setIsWorkflowModalOpen(false);
            setEditingWorkflow(null);
        } catch (error: any) {
            toast.error('Erro ao salvar fluxo: ' + error.message);
        }
    };

    const handleDeleteWorkflow = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;

        try {
            const { error } = await supabase.from('workflows').delete().eq('id', id);
            if (error) throw error;
            toast.success('Fluxo excluído com sucesso!');
            fetchWorkflows();
        } catch (error: any) {
            toast.error('Erro ao excluir fluxo: ' + error.message);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Fluxos de Trabalho</h2>
                    <p className="text-text-secondary">Defina as etapas e processos para seus quadros.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingWorkflow(null);
                        setIsWorkflowModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary-light transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Fluxo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workflows.map(workflow => (
                    <div key={workflow.id} className="bg-surface-highlight p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{workflow.name}</h3>
                                {workflow.board_id && (
                                    <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded">
                                        Vinculado: {boards.find(b => b.id === workflow.board_id)?.name || 'Desconhecido'}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingWorkflow(workflow);
                                        setIsWorkflowModalOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteWorkflow(workflow.id)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>

                        {/* Visual Steps Preview */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {workflow.steps.map((step, index) => (
                                <div key={index} className="flex items-center min-w-max">
                                    <div className="flex items-center gap-2 bg-background-dark px-3 py-1.5 rounded-lg border border-white/5">
                                        <div className="size-2 rounded-full" style={{ backgroundColor: (step as any).color }}></div>
                                        <span className="text-xs text-text-secondary font-medium">{step.name}</span>
                                    </div>
                                    {index < workflow.steps.length - 1 && (
                                        <span className="material-symbols-outlined text-text-muted text-sm mx-1">arrow_forward</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {workflows.length === 0 && (
                    <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl">
                        <p className="text-text-muted">Nenhum fluxo criado ainda.</p>
                    </div>
                )}
            </div>

            <NewWorkflowModal
                isOpen={isWorkflowModalOpen}
                onClose={() => {
                    setIsWorkflowModalOpen(false);
                    setEditingWorkflow(null);
                }}
                onSave={handleSaveWorkflow}
                initialData={editingWorkflow || undefined}
                availableTeams={teams}
                availableUsers={users}
                availableBoards={boards}
                isLoading={dataLoading}
            />
        </div>
    );
}
