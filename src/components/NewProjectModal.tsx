import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { projectService, type Project } from '../services/project.service';
import { teamService, type Team } from '../services/team.service';
import { boardService, type Board } from '../services/board.service';
import ModernDropdown from './ModernDropdown';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Project | null;
}

export default function NewProjectModal({ isOpen, onClose, onSuccess, initialData }: NewProjectModalProps) {
    const [name, setName] = useState('');
    const [teamId, setTeamId] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);

    // Board Selection
    const [boardId, setBoardId] = useState('');
    const [boards, setBoards] = useState<Board[]>([]);

    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTeams();
            fetchBoards();
            if (initialData) {
                setName(initialData.name);
                setTeamId(initialData.team_id || '');
                setBoardId(initialData.board_id || '');
            } else {
                setName('');
                setTeamId('');
                setBoardId('');
            }
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen, initialData]);

    const fetchTeams = async () => {
        const { data } = await teamService.getTeams();
        if (data) setTeams(data);
    };

    const fetchBoards = async () => {
        const { data } = await boardService.getBoards();
        if (data) setBoards(data);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (!initialData && !teamId) {
            toast.warning('Por favor, selecione uma equipe.');
            return;
        }

        setLoading(true);
        try {
            if (initialData) {
                // Edit existing project
                const { error } = await projectService.updateProject(initialData.id, name, boardId, teamId);
                if (error) throw error;
                toast.success('Projeto atualizado com sucesso!');
            } else {
                // Create new project
                const { error } = await projectService.createProject(name, teamId, boardId);
                if (error) throw error;
                toast.success('Projeto criado com sucesso!');
            }

            onSuccess();
            onClose();
            if (!initialData) {
                setName('');
                setTeamId('');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar projeto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl border border-border-green/50 bg-[#162E20]/90 backdrop-blur-md p-8 shadow-2xl transition-all shadow-black/50">

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white font-display">
                        {initialData ? 'Editar Projeto' : 'Novo Projeto'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-text-subtle hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label
                            className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-2"
                            htmlFor="project-name"
                        >
                            Nome do Projeto
                        </label>
                        <input
                            ref={inputRef}
                            id="project-name"
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Website Redesign..."
                            className="w-full rounded-xl border border-border-green bg-background-dark px-4 py-3 text-white placeholder-text-subtle/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                        />
                    </div>



                    <div className="mb-6">
                        <label
                            className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-2"
                            htmlFor="project-board"
                        >
                            Quadro (Núcleo)
                        </label>
                        <ModernDropdown
                            value={boardId}
                            onChange={setBoardId}
                            options={boards.map(b => ({ id: b.id, name: b.name }))}
                            placeholder="Selecione um Quadro..."
                            icon="grid_view"
                        />
                    </div>

                    {!initialData && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-subtle">
                                    Equipe Responsável
                                </label>
                                {teams.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const name = prompt("Nome da nova equipe:");
                                            if (name) {
                                                teamService.createTeam({ name }).then(res => {
                                                    if (res.data) {
                                                        setTeams(prev => [...prev, res.data!]);
                                                        setTeamId(res.data!.id);
                                                        toast.success("Equipe criada e selecionada!");
                                                    }
                                                });
                                            }
                                        }}
                                        className="text-primary text-xs font-bold hover:underline cursor-pointer"
                                    >
                                        + Criar Equipe Rápida
                                    </button>
                                )}
                            </div>

                            {teams.length === 0 ? (
                                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
                                    <p className="text-sm text-text-muted-dark mb-2">Nenhuma equipe encontrada.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const name = prompt("Nome da nova equipe:");
                                            if (name) {
                                                teamService.createTeam({ name }).then(res => {
                                                    if (res.data) {
                                                        setTeams(prev => [...prev, res.data!]);
                                                        setTeamId(res.data!.id);
                                                        toast.success("Equipe criada e selecionada!");
                                                    }
                                                });
                                            }
                                        }}
                                        className="text-sm font-bold text-primary hover:text-green-400 transition-colors"
                                    >
                                        Clique aqui para criar uma
                                    </button>
                                </div>
                            ) : (
                                <ModernDropdown
                                    value={teamId}
                                    onChange={setTeamId}
                                    options={teams.map(t => ({ id: t.id, name: t.name }))}
                                    placeholder="Selecione a equipe..."
                                    icon="group"
                                />
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-text-subtle hover:text-white transition-colors rounded-xl hover:bg-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || (!initialData && !teamId) || loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-background-dark shadow-neon hover:shadow-[0_0_20px_rgba(19,236,91,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-display"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            ) : (
                                initialData ? 'Salvar' : 'Criar Projeto'
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
