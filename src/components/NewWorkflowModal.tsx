import { useState, useEffect } from 'react';
import ModernDropdown from './ModernDropdown';

// Types
interface Team {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
}

export interface WorkflowStep {
    id: string;
    name: string;
    responsibleType: 'team' | 'user';
    assignee: string; // ID or Name of the team/user
}

interface Board {
    id: string;
    name: string;
}

interface NewWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, steps: WorkflowStep[], boardId: string) => void;
    availableTeams: Team[];
    availableUsers: User[];
    availableBoards: Board[];
    initialData?: {
        name: string;
        description?: string;
        steps: WorkflowStep[];
        board_id?: string;
    } | null;
}

export default function NewWorkflowModal({
    isOpen,
    onClose,
    onSave,
    availableTeams,
    availableUsers,
    availableBoards,
    initialData
}: NewWorkflowModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [boardId, setBoardId] = useState('');

    // Initial State with 3 default steps as per HTML reference but dynamic
    const [steps, setSteps] = useState<WorkflowStep[]>([
        { id: '1', name: 'Backlog', responsibleType: 'team', assignee: '' },
        { id: '2', name: 'Em Desenvolvimento', responsibleType: 'team', assignee: '' },
        { id: '3', name: 'Code Review', responsibleType: 'user', assignee: '' }
    ]);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || '');
                setBoardId(initialData.board_id || '');
                setSteps(initialData.steps.length > 0 ? initialData.steps : [
                    { id: '1', name: 'Backlog', responsibleType: 'team', assignee: '' }
                ]);
            } else {
                setName('');
                setDescription('');
                setBoardId('');
                setSteps([
                    { id: '1', name: 'Backlog', responsibleType: 'team', assignee: '' },
                    { id: '2', name: 'Em Desenvolvimento', responsibleType: 'team', assignee: '' },
                    { id: '3', name: 'Code Review', responsibleType: 'user', assignee: '' }
                ]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleAddStep = () => {
        const newStep: WorkflowStep = {
            id: Date.now().toString(),
            name: '',
            responsibleType: 'team',
            assignee: ''
        };
        setSteps([...steps, newStep]);
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newSteps[targetIndex];
        newSteps[targetIndex] = newSteps[index];
        newSteps[index] = temp;
        setSteps(newSteps);
    };

    const handleUpdateStep = (index: number, field: keyof WorkflowStep, value: string) => {
        const newSteps = [...steps];
        // Create a shallow copy of the step being updated to avoid direct state mutation
        newSteps[index] = { ...newSteps[index], [field]: value };

        // If changing type, reset assignee to avoid type mismatch
        if (field === 'responsibleType') {
            newSteps[index].assignee = '';
        }

        setSteps(newSteps);
    };

    const handleSave = () => {
        if (!name.trim()) return;
        if (!boardId) {
            alert('Selecione um Quadro para este fluxo.');
            return;
        }
        onSave(name, description, steps, boardId);
        // Removed onClose() here
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/95 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="w-full h-full md:p-10 lg:p-14 max-w-[1200px] mx-auto flex flex-col gap-8 relative">

                {/* Header */}
                <section className="flex flex-col gap-2 pt-10 md:pt-0 px-6 md:px-0">
                    <nav className="flex items-center text-xs text-text-subtle mb-1 space-x-2">
                        <span>Configurações</span>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span>Geral</span>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-primary">Novo Fluxo</span>
                    </nav>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Criar Fluxo de Tarefas</h1>
                            <p className="text-text-subtle text-base font-light mt-2 max-w-2xl">
                                Defina as etapas, responsáveis e automações do seu novo processo de trabalho.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full border border-border-green text-text-subtle hover:text-white hover:bg-surface-dark transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 rounded-full bg-primary text-background-dark font-bold hover:shadow-neon hover:bg-[#34f073] transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">save</span>
                                Salvar Fluxo
                            </button>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-10 mx-6 md:mx-0 mb-10 md:mb-0">

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-border-green/50">
                        <div className="flex flex-col gap-4">
                            <label className="block">
                                <span className="text-text-subtle text-sm font-bold uppercase tracking-wider mb-2 block">Quadro Vinculado <span className="text-primary">*</span></span>
                                <ModernDropdown
                                    value={boardId}
                                    onChange={setBoardId}
                                    options={availableBoards.map(b => ({ id: b.id, name: b.name }))}
                                    placeholder="Selecione um Quadro..."
                                    icon="grid_view"
                                />
                            </label>
                            <label className="block">
                                <span className="text-text-subtle text-sm font-bold uppercase tracking-wider mb-2 block">Nome do Fluxo <span className="text-primary">*</span></span>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-background-dark border border-border-green rounded-xl px-4 py-3 text-white placeholder-text-subtle/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Ex: Desenvolvimento Web, Onboarding de Clientes..."
                                    type="text"
                                />
                            </label>
                            <label className="block">
                                <span className="text-text-subtle text-sm font-bold uppercase tracking-wider mb-2 block">Descrição (Opcional)</span>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-background-dark border border-border-green rounded-xl px-4 py-3 text-white placeholder-text-subtle/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                    placeholder="Descreva o propósito deste fluxo..."
                                    rows={3}
                                ></textarea>
                            </label>
                        </div>
                        <div className="bg-surface-dark/30 rounded-xl p-5 border border-border-green flex flex-col justify-center gap-2">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <span className="material-symbols-outlined">info</span>
                                <span>Dica do NowFlow</span>
                            </div>
                            <p className="text-text-subtle text-sm leading-relaxed">
                                Fluxos bem definidos aumentam a produtividade em até 40%. Tente manter nomes de etapas curtos e claros (ex: "Backlog", "Em Análise", "Concluído").
                            </p>
                        </div>
                    </div>

                    {/* Step Builder */}
                    <div className="flex flex-col gap-6 relative">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">alt_route</span>
                                Construtor de Etapas
                            </h2>
                            <button className="text-xs font-bold text-primary uppercase tracking-wider hover:text-white transition-colors">
                                Expandir Tudo
                            </button>
                        </div>

                        {/* Vertical Line Connector */}
                        <div className="absolute left-[27px] md:left-[27px] top-[60px] bottom-[80px] w-[2px] bg-gradient-to-b from-border-green via-primary/20 to-transparent z-0"></div>

                        {/* Steps List */}
                        <div className="flex flex-col gap-4 relative z-10">
                            {steps.map((step, index) => (
                                <div key={step.id || index} className="group flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className={`mt-4 flex-shrink-0 size-6 rounded-full bg-background-dark border flex items-center justify-center text-xs font-bold shadow-neon relative z-20 transition-colors ${step.name ? 'border-primary text-primary' : 'border-border-green text-text-subtle'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 bg-surface-dark border border-border-green hover:border-primary/40 rounded-xl p-4 md:p-5 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                                            <div className="hidden md:flex flex-col gap-1 text-border-green cursor-move py-3 hover:text-text-subtle transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-5">
                                                    <label className="text-[10px] text-text-subtle uppercase font-bold mb-1.5 block">Nome da Etapa</label>
                                                    <input
                                                        value={step.name}
                                                        onChange={(e) => handleUpdateStep(index, 'name', e.target.value)}
                                                        className="w-full bg-background-dark border border-border-green rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:ring-0 transition-colors"
                                                        type="text"
                                                        placeholder="Nome da etapa"
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="text-[10px] text-text-subtle uppercase font-bold mb-1.5 block">Tipo de Responsável</label>
                                                    <select
                                                        value={step.responsibleType}
                                                        onChange={(e) => handleUpdateStep(index, 'responsibleType', e.target.value as 'team' | 'user')}
                                                        className="w-full bg-background-dark border border-border-green rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:ring-0 transition-colors cursor-pointer appearance-none"
                                                    >
                                                        <option value="team">Equipe</option>
                                                        <option value="user">Usuário</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="text-[10px] text-text-subtle uppercase font-bold mb-1.5 block">Atribuir a</label>
                                                    <div className="relative">
                                                        <select
                                                            value={step.assignee}
                                                            onChange={(e) => handleUpdateStep(index, 'assignee', e.target.value)}
                                                            className="w-full bg-background-dark border border-border-green rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:ring-0 transition-colors cursor-pointer appearance-none"
                                                        >
                                                            <option value="" disabled>Selecione...</option>
                                                            {step.responsibleType === 'team' ? (
                                                                availableTeams.map(team => (
                                                                    <option key={team.id} value={team.name}>{team.name}</option>
                                                                ))
                                                            ) : (
                                                                availableUsers.map(user => (
                                                                    <option key={user.id} value={user.name}>{user.name}</option>
                                                                ))
                                                            )}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-subtle">
                                                            <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 self-start md:self-center md:pt-4">
                                                <button
                                                    onClick={() => handleMoveStep(index, 'up')}
                                                    disabled={index === 0}
                                                    className="size-8 flex items-center justify-center rounded-lg text-text-subtle hover:bg-background-dark hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="Subir"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                                                </button>
                                                <button
                                                    onClick={() => handleMoveStep(index, 'down')}
                                                    disabled={index === steps.length - 1}
                                                    className="size-8 flex items-center justify-center rounded-lg text-text-subtle hover:bg-background-dark hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="Descer"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                                                </button>
                                                <div className="w-[1px] h-6 bg-border-green mx-1"></div>
                                                <button
                                                    onClick={() => handleRemoveStep(index)}
                                                    className="size-8 flex items-center justify-center rounded-lg text-text-subtle hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                    title="Remover Etapa"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Button */}
                        <div className="flex items-center gap-4 mt-2">
                            <div className="size-6 rounded-full bg-background-dark border border-dashed border-text-subtle flex items-center justify-center text-xs font-bold text-text-subtle ml-[1px]">
                                <span className="material-symbols-outlined text-[14px]">add</span>
                            </div>
                            <button
                                onClick={handleAddStep}
                                className="flex-1 group flex items-center justify-center gap-2 border border-dashed border-border-green hover:border-primary bg-surface-dark/20 hover:bg-surface-dark py-4 rounded-xl transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-text-subtle group-hover:text-primary transition-colors">add_circle</span>
                                <span className="text-text-subtle group-hover:text-white font-medium">Adicionar Nova Etapa</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
