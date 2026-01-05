import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { boardService, type Board } from '../services/board.service';
import { clientService, type Client } from '../services/client.service';
import { teamService, type Team } from '../services/team.service';
import { projectService } from '../services/project.service';
import { type UserProfile } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function CreateProject() {
    const navigate = useNavigate();
    const [boards, setBoards] = useState<Board[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [managers, setManagers] = useState<UserProfile[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(new Set());

    const [searchParams] = useSearchParams();
    const preBoardId = searchParams.get('boardId') || '';
    const preClientId = searchParams.get('clientId') || '';

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        board_id: preBoardId,
        client_id: preClientId,
        team_id: '',
        manager_id: '',
        status: 'PLANNING',
        priority: 'MEDIUM'
    });

    const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [boardsRes, clientsRes, teamsRes] = await Promise.all([
                boardService.getBoards(),
                clientService.getClients(),
                teamService.getTeams()
            ]);

            if (boardsRes.data) setBoards(boardsRes.data);
            if (clientsRes.data) setClients(clientsRes.data);
            if (teamsRes.data) setTeams(teamsRes.data);

            const { data: usersData } = await supabase
                .from('users')
                .select('*');

            if (usersData) {
                setAllUsers(usersData as UserProfile[]);
                setManagers(usersData.filter((u: any) => ['ADMIN', 'MANAGER'].includes(u.role)) as UserProfile[]);
            }
        };

        fetchData();
    }, []);

    // Effect to fetch team members when team_id changes
    useEffect(() => {
        if (formData.team_id) {
            teamService.getTeamMembers(formData.team_id).then(({ data }) => {
                if (data) {
                    setTeamMemberIds(new Set(data.map(m => m.id)));
                } else {
                    setTeamMemberIds(new Set());
                }
            });
        } else {
            setTeamMemberIds(new Set());
        }
        // Reset selected members when team changes? User might want to keep them but usually it's better to clear if team is the primary filter.
        // Actually, let's NOT clear them, maybe they want to add someone from another team.
    }, [formData.team_id]);

    const handleSave = async () => {
        if (!formData.name || !formData.client_id || !formData.team_id || !formData.board_id) {
            toast.error('Por favor, preencha todos os campos obrigatórios (Nome, Cliente, Equipe e Quadro)');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await projectService.createProject(formData);
            if (error) throw error;

            toast.success('Projeto criado com sucesso!');
            navigate('/kanban');
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar projeto');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sort users: Team members first, then others
    const sortedUsers = [...allUsers].sort((a, b) => {
        const aIsTeam = teamMemberIds.has(a.id);
        const bIsTeam = teamMemberIds.has(b.id);
        if (aIsTeam && !bIsTeam) return -1;
        if (!aIsTeam && bIsTeam) return 1;
        return a.full_name.localeCompare(b.full_name);
    }).filter(u => !selectedMembers.find(sm => sm.id === u.id));

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            <header className="h-16 border-b border-[#23482f] bg-background-dark/95 backdrop-blur-sm flex items-center justify-between px-6 lg:px-10 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button className="md:hidden text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="hidden md:flex items-center text-white gap-2">
                        <span className="material-symbols-outlined text-primary">add_circle</span>
                        <h2 className="text-lg font-bold tracking-tight">Novo Projeto</h2>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-background-dark p-6 lg:p-10 scroll-smooth">
                <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
                    <nav className="flex items-center text-sm font-medium">
                        <Link className="text-text-muted hover:text-primary transition-colors" to="/">Home</Link>
                        <span className="mx-2 text-text-muted/50">/</span>
                        <Link className="text-text-muted hover:text-primary transition-colors" to="/kanban">Projetos</Link>
                        <span className="mx-2 text-text-muted/50">/</span>
                        <span className="text-primary">Novo Projeto</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Cadastro de Projeto</h1>
                            <p className="text-text-muted max-w-2xl">O fluxo segue a hierarquia: Quadro &gt; Cliente &gt; Projeto &gt; Equipe &gt; Usuário.</p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-surface-dark border border-[#23482f] overflow-hidden shadow-xl shadow-black/20">
                        <div className="px-6 py-4 border-b border-[#23482f] bg-[#1a3024]">
                            <h3 className="text-white text-base font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">info</span>
                                Informações do Projeto
                            </h3>
                        </div>

                        <div className="p-6 md:p-8">
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">Nome do Projeto *</label>
                                    <input
                                        className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                                        placeholder="Ex: Redesign do E-commerce"
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">grid_view</span>
                                        Quadro *
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            value={formData.board_id}
                                            onChange={e => setFormData({ ...formData, board_id: e.target.value })}
                                        >
                                            <option value="">Selecione um quadro</option>
                                            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">business</span>
                                        Cliente *
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            value={formData.client_id}
                                            onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                        >
                                            <option value="">Selecione um cliente</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">groups</span>
                                        Equipe Resp. (Núcleo) *
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            value={formData.team_id}
                                            onChange={e => setFormData({ ...formData, team_id: e.target.value })}
                                        >
                                            <option value="">Selecione um núcleo</option>
                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                                        Gerente do Projeto
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            value={formData.manager_id}
                                            onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                                        >
                                            <option value="">Selecione um gerente</option>
                                            {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">Descrição</label>
                                    <textarea
                                        className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary h-24 resize-none transition-all"
                                        placeholder="Breve descrição do escopo..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        Data de Início
                                    </label>
                                    <input
                                        className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark] transition-all"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">event_available</span>
                                        Prazo Final
                                    </label>
                                    <input
                                        className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark] transition-all"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">person_add</span>
                                        Equipe do Projeto (Usuários Escalados)
                                    </label>
                                    <div className="w-full bg-input-dark border-transparent rounded-lg p-3 min-h-[56px] flex flex-wrap items-center gap-2">
                                        {!formData.team_id && (
                                            <p className="text-text-muted text-xs italic">Selecione um núcleo para escalar profissionais.</p>
                                        )}
                                        {selectedMembers.map(member => (
                                            <div key={member.id} className="flex items-center gap-2 bg-[#1a3024] border border-[#23482f] rounded-full pl-1 pr-3 py-1 animate-in fade-in zoom-in duration-300">
                                                <div className="size-6 rounded-full bg-slate-700 bg-cover bg-center" style={{ backgroundImage: member.avatar_url ? `url(${member.avatar_url})` : 'none' }}></div>
                                                <span className="text-xs text-white font-medium">{member.full_name}</span>
                                                <button onClick={() => setSelectedMembers(selectedMembers.filter(m => m.id !== member.id))} className="text-text-muted hover:text-white ml-1" type="button">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                                </button>
                                            </div>
                                        ))}
                                        {formData.team_id && (
                                            <div className="relative group">
                                                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-text-muted border border-dashed border-[#92c9a4]/30 hover:bg-[#2d5c3c] hover:text-white transition-colors text-xs font-medium" type="button">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                                    Escalar Profissional
                                                </button>
                                                <div className="absolute top-full left-0 mt-2 w-72 bg-surface-dark border border-[#23482f] rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
                                                    {sortedUsers.length === 0 ? (
                                                        <p className="p-4 text-xs text-text-muted text-center tracking-tight">Nenhum profissional disponível.</p>
                                                    ) : (
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {sortedUsers.map(u => {
                                                                const isTeam = teamMemberIds.has(u.id);
                                                                return (
                                                                    <button
                                                                        key={u.id}
                                                                        onClick={() => setSelectedMembers([...selectedMembers, u])}
                                                                        type="button"
                                                                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between border-b border-[#23482f] last:border-0"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-700" style={{ backgroundImage: u.avatar_url ? `url(${u.avatar_url})` : 'none', backgroundSize: 'cover' }}>
                                                                                {!u.avatar_url && u.full_name.charAt(0)}
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{u.full_name}</span>
                                                                                <span className="text-[10px] text-text-muted">{u.email}</span>
                                                                            </div>
                                                                        </div>
                                                                        {isTeam && (
                                                                            <span className="text-[9px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 shrink-0">TIME</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-5 bg-[#13261a] border-t border-[#23482f] flex flex-col-reverse md:flex-row items-center justify-end gap-4">
                            <button className="w-full md:w-auto px-6 py-2.5 rounded-lg text-white font-medium hover:bg-white/5 transition-colors" onClick={() => navigate('/kanban')} type="button">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-2.5 rounded-lg bg-primary text-[#0d1f14] font-bold hover:bg-[#3bfd7b] shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{isSubmitting ? 'sync' : 'save'}</span>
                                {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
