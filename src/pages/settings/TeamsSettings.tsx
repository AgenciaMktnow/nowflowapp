import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { teamService, type Team } from '../../services/team.service';

interface User {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

export default function TeamsSettings() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [teamName, setTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [memberSearch, setMemberSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: teamsData, error: tError } = await teamService.getTeams();
            if (tError) throw tError;

            const { data: usersData, error: uError } = await supabase.from('users').select('id, full_name, email, avatar_url').order('full_name');
            if (uError) throw uError;

            const teamsWithMembers = await Promise.all((teamsData || []).map(async (team) => {
                const { data: members } = await teamService.getTeamMembers(team.id);
                return { ...team, members: members || [] };
            }));

            setTeams(teamsWithMembers);
            setUsers(usersData || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar equipes.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (team?: Team) => {
        if (team) {
            setEditingTeam(team);
            setTeamName(team.name);
            setSelectedMembers((team as any).members?.map((m: any) => m.id) || []);
        } else {
            setEditingTeam(null);
            setTeamName('');
            setSelectedMembers([]);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!teamName.trim()) {
            toast.warning('Nome da equipe é obrigatório.');
            return;
        }

        try {
            let savedTeamId = editingTeam?.id;

            if (editingTeam) {
                const { error } = await teamService.updateTeam(editingTeam.id, { name: teamName });
                if (error) throw error;
                toast.success('Equipe atualizada!');
            } else {
                const { data, error } = await teamService.createTeam({ name: teamName });
                if (error) throw error;
                savedTeamId = data?.id;
                toast.success('Equipe criada!');
            }

            if (savedTeamId) {
                const { data: currentMembers } = await teamService.getTeamMembers(savedTeamId);
                const currentIds = currentMembers?.map((u: any) => u.id) || [];

                const toAdd = selectedMembers.filter(id => !currentIds.includes(id));
                const toRemove = currentIds.filter((id: string) => !selectedMembers.includes(id));

                for (const uid of toAdd) await teamService.addMember(savedTeamId, uid);
                for (const uid of toRemove) await teamService.removeMember(savedTeamId, uid);
            }

            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar.');
        }
    };

    const handleDelete = async (team: Team) => {
        if (!confirm(`Excluir a equipe "${team.name}"?`)) return;

        const { error } = await supabase.from('teams').delete().eq('id', team.id);
        if (error) {
            toast.error('Erro ao excluir (verifique se há projetos vinculados).');
        } else {
            toast.success('Equipe excluída.');
            loadData();
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Equipes</h2>
                    <p className="text-text-muted text-sm">Gerencie suas equipes e membros.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Nova Equipe
                </button>
            </div>

            {loading ? (
                <div className="text-white">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-10">
                    {teams.map(team => (
                        <div key={team.id} className="bg-surface-dark border border-border-dark p-5 rounded-xl flex flex-col gap-4 relative group hover:border-primary/50 transition-all">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-white">{team.name}</h3>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(team)}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team)}
                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-400"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Membros</div>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {(team as any).members?.slice(0, 5).map((member: User) => (
                                        <div key={member.id} className="relative group/avatar">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.full_name} className="w-8 h-8 rounded-full border-2 border-surface-dark bg-surface-light object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full border-2 border-surface-dark bg-primary flex items-center justify-center text-[10px] font-bold text-black">
                                                    {member.full_name?.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/avatar:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                                {member.full_name}
                                            </div>
                                        </div>
                                    ))}
                                    {((team as any).members?.length || 0) > 5 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-surface-dark bg-surface-light flex items-center justify-center text-xs text-white">
                                            +{(team as any).members.length - 5}
                                        </div>
                                    )}
                                    {((team as any).members?.length || 0) === 0 && (
                                        <span className="text-sm text-text-muted italic">Sem membros</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-surface-dark border border-border-dark w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border-dark flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">{editingTeam ? 'Editar Equipe' : 'Nova Equipe'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">Nome da Equipe</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                    placeholder="Ex: Desenvolvimento"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Membros</label>
                                <div className="bg-background-dark border border-border-dark rounded-lg overflow-hidden flex flex-col max-h-[300px]">
                                    <div className="p-3 border-b border-border-dark sticky top-0 bg-background-dark z-10">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-2 text-text-muted text-[20px]">search</span>
                                            <input
                                                type="text"
                                                value={memberSearch}
                                                onChange={e => setMemberSearch(e.target.value)}
                                                className="w-full bg-surface-dark border-none rounded-md pl-10 pr-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-primary"
                                                placeholder="Buscar membro..."
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                        {filteredUsers.map(user => {
                                            const isSelected = selectedMembers.includes(user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => {
                                                        if (isSelected) setSelectedMembers(prev => prev.filter(id => id !== user.id));
                                                        else setSelectedMembers(prev => [...prev, user.id]);
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-text-muted'}`}>
                                                        {isSelected && <span className="material-symbols-outlined text-black text-[16px]">check</span>}
                                                    </div>

                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-white">
                                                            {user.full_name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-white'}`}>{user.full_name}</span>
                                                        <span className="text-xs text-text-muted">{user.email}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-dark flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-muted hover:text-white font-medium">Cancelar</button>
                            <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-black font-bold py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
