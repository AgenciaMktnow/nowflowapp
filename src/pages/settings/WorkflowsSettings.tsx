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

import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers'

export default function WorkflowsSettings() {
    const { userProfile } = useAuth();
    const allUsers = useUsers()
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const users = allUsers.map(u => ({
        id: u.id,
        name: u.full_name || 'Usuário'
    }))
    const [dataLoading, setDataLoading] = useState(false);
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

    const { can } = usePermissions();
    const canCustomWorkflows = can('custom_workflows');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setDataLoading(true);
        await Promise.all([
            fetchWorkflows(),
            fetchBoards(),
            fetchTeams()
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
                if (!userProfile?.organization_id) throw new Error("Organização não definida.");
                const { error } = await supabase
                    .from('workflows')
                    .insert([{
                        name,
                        steps,
                        board_id: boardId,
                        organization_id: userProfile.organization_id
                    }]);

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
                        if (!canCustomWorkflows) {
                            toast.error('Recurso exclusivo PRO: Upgrade para criar fluxos personalizados.');
                            return;
                        }
                        setEditingWorkflow(null);
                        setIsWorkflowModalOpen(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors ${canCustomWorkflows ? 'bg-primary text-background-dark hover:bg-primary-light' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                >
                    <span className="material-symbols-outlined">{canCustomWorkflows ? 'add' : 'lock'}</span>
                    <span>{canCustomWorkflows ? 'Novo Fluxo' : 'Novo Fluxo (PRO)'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {workflows.map(workflow => (
                    <div
    key={workflow.id}
    className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-primary/40 via-indigo-400/20 to-transparent transition-all duration-300 hover:shadow-xl hover:shadow-primary/20"
>

    {/* background glow */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>

    <div className="relative bg-surface-highlight/85 backdrop-blur-xl rounded-2xl p-6 border border-white/5 h-full transition-all duration-300 group-hover:border-primary/40">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-5">

            <div>

                <h3 className="text-lg font-semibold text-white tracking-tight">
                    {workflow.name}
                </h3>

                {workflow.board_id && (
                    <div className="mt-1 text-xs text-text-muted flex items-center gap-2">

                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>

                        {boards.find(b => b.id === workflow.board_id)?.name || 'Desconhecido'}

                    </div>
                )}

            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">

                <button
                    onClick={() => {
                        if (!canCustomWorkflows) {
                            toast.error('Recurso exclusivo PRO');
                            return;
                        }

                        setEditingWorkflow(workflow);
                        setIsWorkflowModalOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition"
                >
                    <span className="material-symbols-outlined text-sm">
                        edit
                    </span>
                </button>

                <button
                    onClick={() => {
                        if (!canCustomWorkflows) {
                            toast.error('Recurso exclusivo PRO');
                            return;
                        }

                        handleDeleteWorkflow(workflow.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                >
                    <span className="material-symbols-outlined text-sm">
                        delete
                    </span>
                </button>

            </div>

        </div>

        {/* PIPELINE */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent">

            {workflow.steps.map((step, index) => (

                <div key={index} className="flex items-center min-w-max">

                    <div className="flex items-center justify-center gap-2 bg-background-dark/90 backdrop-blur px-4 py-2 rounded-lg border border-white/5 text-center transition-all duration-200 hover:border-primary/50">

                        <div
                            className="size-2 rounded-full"
                            style={{
                                backgroundColor: step.color || '#6366f1',
                                boxShadow: `0 0 6px ${step.color || '#6366f1'}`
                            }}
                        ></div>

                        <span className="text-xs font-medium text-text-secondary text-center">
                            {step.name}
                        </span>

                    </div>

                    {index < workflow.steps.length - 1 && (

                        <span className="material-symbols-outlined text-text-muted text-sm mx-2">
                            arrow_forward
                        </span>

                    )}

                </div>

            ))}

        </div>

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
