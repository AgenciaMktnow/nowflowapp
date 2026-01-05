import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { teamService, type Team } from '../../services/team.service';

export default function TeamsSettings() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Partial<Team>>({ color: '#10B981', text_color: '#FFFFFF' });

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        const { data, error } = await teamService.getTeams();
        if (error) {
            toast.error(error.message);
        } else if (data) {
            setTeams(data);
        }
        setLoading(false);
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingTeam({ color: '#10B981', text_color: '#FFFFFF' });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingTeam.name) {
            toast.warning('O nome da equipe é obrigatório');
            return;
        }

        try {
            let error;
            if (editingTeam.id) {
                const res = await teamService.updateTeam(editingTeam.id, editingTeam);
                error = res.error;
            } else {
                const res = await teamService.createTeam(editingTeam as any);
                error = res.error;
            }

            if (error) throw error;

            toast.success(editingTeam.id ? 'Equipe atualizada com sucesso!' : 'Equipe criada com sucesso!');
            setIsModalOpen(false);
            fetchTeams();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao salvar equipe.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;

        const { error } = await teamService.deleteTeam(id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Equipe excluída com sucesso!');
            fetchTeams();
        }
    };

    const colorOptions = [
        { color: '#10B981', label: 'Verde' },
        { color: '#3B82F6', label: 'Azul' },
        { color: '#8B5CF6', label: 'Roxo' },
        { color: '#EF4444', label: 'Vermelho' },
        { color: '#F59E0B', label: 'Laranja' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Gerenciar Equipes (Núcleos)</h2>
                    <p className="text-text-muted text-sm mt-1">Defina os departamentos e núcleos da sua agência.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background-dark font-bold hover:bg-[#3bfd7b] transition-colors shadow-lg"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Nova Equipe
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-text-muted border border-dashed border-[#23482f] rounded-xl bg-[#13261a]/30">Carregando equipes...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <div key={team.id} className="relative bg-[#13261a] border border-[#23482f] rounded-xl p-5 hover:border-primary/50 transition-all shadow-lg group">
                            <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: team.color }}></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="size-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ backgroundColor: team.color, color: team.text_color }}>
                                    {team.initials || team.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(team)} className="p-1.5 text-text-muted hover:text-white rounded-md hover:bg-white/10">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(team.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-white font-bold text-lg">{team.name}</h3>
                            <p className="text-text-muted text-xs mt-1">Criada em {new Date(team.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-[#162e21] border border-[#23482f] rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#23482f] flex justify-between items-center bg-[#0d1f14]">
                            <h2 className="text-lg font-bold text-white">{editingTeam.id ? 'Editar Equipe' : 'Nova Equipe'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase">Nome da Equipe</label>
                                <input
                                    className="w-full bg-[#0d1f14] border border-[#23482f] rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-all"
                                    placeholder="Ex: Marketing"
                                    value={editingTeam.name || ''}
                                    onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase">Sigla</label>
                                    <input
                                        className="w-full bg-[#0d1f14] border border-[#23482f] rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-all uppercase"
                                        placeholder="Ex: MK"
                                        maxLength={3}
                                        value={editingTeam.initials || ''}
                                        onChange={e => setEditingTeam({ ...editingTeam, initials: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase">Cor</label>
                                    <div className="flex gap-2 items-center h-[42px]">
                                        {colorOptions.map(opt => (
                                            <button
                                                key={opt.color}
                                                onClick={() => setEditingTeam({ ...editingTeam, color: opt.color })}
                                                className={`size-6 rounded-full border transition-all ${editingTeam.color === opt.color ? 'border-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: opt.color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#23482f] bg-[#0d1f14] flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-muted hover:text-white text-sm font-medium">Cancelar</button>
                            <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-primary text-background-dark font-bold hover:bg-[#3bfd7b] text-sm transition-all">Salvar Equipe</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
