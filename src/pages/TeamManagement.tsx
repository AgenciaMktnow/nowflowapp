import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { toast } from 'sonner';

type User = {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'manager' | 'operational';
    last_access?: string;
    is_active: boolean;
    avatar_url?: string;
    user_id: string;
    team_ids: string[]; // Support multiple teams
};

type TeamOption = {
    id: string;
    name: string;
};

export default function TeamManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

    const fetchTeams = async () => {
        const { data } = await supabase.from('teams').select('id, name').order('name');
        if (data) {
            setTeams(data);
        }
    };

    const fetchUsers = async () => {
        try {
            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Fetch user_teams
            const { data: userTeamsData, error: userTeamsError } = await supabase
                .from('user_teams')
                .select('user_id, team_id');

            if (userTeamsError) throw userTeamsError;

            // Map users data
            const mappedUsers = (usersData || []).map(user => {
                // Find all teams for this user
                const userTeams = userTeamsData
                    ?.filter(ut => ut.user_id === user.id)
                    .map(ut => ut.team_id) || [];

                return {
                    id: user.id,
                    full_name: user.full_name || '',
                    email: user.email,
                    role: user.role?.toLowerCase() || 'member',
                    last_access: undefined,
                    is_active: true,
                    avatar_url: user.avatar_url,
                    user_id: user.id,
                    team_ids: userTeams
                };
            });

            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            admin: 'bg-primary/20 text-primary border-primary/20',
            manager: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
            operational: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
        };
        const labels = {
            admin: 'Admin',
            manager: 'Gestor',
            operational: 'Operacional',
        };
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${styles[role as keyof typeof styles]}`}>
                {labels[role as keyof typeof labels]}
            </span>
        );
    };

    const filteredUsers = users.filter(user => {
        // Search filter
        const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Role filter
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        // Status filter
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleSaveUser = async () => {
        if (!selectedUser) return;

        try {
            if (selectedUser.id === 'new') {
                // Generate a temporary random password
                const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

                console.log('Creating auth account for:', selectedUser.email);

                // Create authentication account and send confirmation email
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: selectedUser.email,
                    password: tempPassword,
                    options: {
                        data: {
                            full_name: selectedUser.full_name,
                            role: selectedUser.role.toUpperCase()
                        },
                        emailRedirectTo: 'https://www.nowflow.it/reset-password'
                    }
                });

                console.log('Auth signup result:', { authData, authError });

                if (authError) {
                    console.error('Auth error:', authError);
                    throw new Error(`Erro ao criar conta de autenticação: ${authError.message}`);
                }

                if (!authData.user) {
                    throw new Error('Conta de autenticação não foi criada. Verifique se o email já existe.');
                }

                console.log('Auth user created:', authData.user.id);

                // Wait a bit for the auth user to be created
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Use RPC function to create user profile (bypasses RLS)
                const { data, error } = await supabase
                    .rpc('ensure_user_profile', {
                        user_id: authData.user.id,
                        user_email: selectedUser.email,
                        user_full_name: selectedUser.full_name,
                        user_role: selectedUser.role.toUpperCase()
                    });

                if (error) throw error;

                if (data) {
                    const userId = data.id; // RPC returns JSON object, not array

                    // Save Teams
                    if (selectedUser.team_ids && selectedUser.team_ids.length > 0) {
                        const teamInserts = selectedUser.team_ids.map(teamId => ({
                            user_id: userId,
                            team_id: teamId
                        }));
                        await supabase.from('user_teams').insert(teamInserts);
                    }

                    const newUser = {
                        id: userId,
                        full_name: selectedUser.full_name || '',
                        email: selectedUser.email,
                        role: selectedUser.role?.toLowerCase() as 'admin' | 'manager' | 'operational' || 'operational',
                        last_access: undefined,
                        is_active: true,
                        avatar_url: selectedUser.avatar_url,
                        user_id: userId,
                        team_ids: selectedUser.team_ids || []
                    };
                    setUsers([...users, newUser]);
                    alert(`✅ Usuário criado com sucesso!\n\n📧 Um email de confirmação foi enviado para ${selectedUser.email}\n\nO usuário deve:\n1. Verificar a caixa de entrada (e spam)\n2. Clicar no link de confirmação\n3. Fazer login e redefinir a senha`);
                }
            } else {
                // Update existing user
                const { error } = await supabase
                    .from('users')
                    .update({
                        email: selectedUser.email,
                        full_name: selectedUser.full_name,
                        role: selectedUser.role.toUpperCase(),
                        avatar_url: selectedUser.avatar_url
                    })
                    .eq('id', selectedUser.id);

                if (error) throw error;

                // Update Teams: Delete all and re-insert
                await supabase.from('user_teams').delete().eq('user_id', selectedUser.id);

                if (selectedUser.team_ids && selectedUser.team_ids.length > 0) {
                    const teamInserts = selectedUser.team_ids.map(teamId => ({
                        user_id: selectedUser.id,
                        team_id: teamId
                    }));
                    await supabase.from('user_teams').insert(teamInserts);
                }

                // Update local state
                setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));

                // IF editing current user, sync auth metadata
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.id === selectedUser.user_id) { // user_id in table matches auth.uid
                    const { error: updateError } = await supabase.auth.updateUser({
                        data: {
                            avatar_url: selectedUser.avatar_url,
                            full_name: selectedUser.full_name
                        }
                    });
                    if (!updateError) {
                        // Force reload to update Header
                        window.location.reload();
                    }
                }
            }

            setSelectedUser(null);
            fetchUsers(); // Refresh list to assume consistency
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(`Erro ao salvar usuário: ${error?.message || 'Tente novamente.'}`);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || selectedUser.id === 'new') return;

        const confirmDelete = window.confirm(`Tem certeza que deseja excluir o usuário "${selectedUser.full_name}"? Esta ação não pode ser desfeita.`);
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', selectedUser.id);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Erro ao excluir usuário: ${error?.message || 'Tente novamente.'}`);
        }
    };


    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Header */}
            <header className="flex-none pb-6">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-black tracking-tight">Cadastro de Usuários</h2>
                        <p className="text-[#92c9a4] text-base font-normal">Gerencie o acesso e as permissões dos membros da equipe.</p>
                    </div>
                    <button
                        onClick={() => setSelectedUser({
                            id: 'new',
                            full_name: '',
                            email: '',
                            role: 'operational',
                            is_active: true,
                            user_id: '',
                            team_ids: []
                        })}
                        className="hidden md:flex cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary-dark text-background-dark text-sm font-bold shadow-[0_0_15px_rgba(19,236,91,0.3)] transition-all transform active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Novo Usuário</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
                {/* Users Table */}
                <div className="flex-1 flex flex-col bg-surface-dark rounded-xl border border-[#23482f] overflow-hidden shadow-xl">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-[#23482f] bg-[#14261d]">
                        <label className="flex-1 w-full">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-[#92c9a4] group-focus-within:text-primary transition-colors">search</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2.5 bg-[#1a3524] border border-[#2a4e38] rounded-lg text-white placeholder-[#5d856b] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                                    placeholder="Buscar por nome ou e-mail..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 sm:flex-none">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full appearance-none flex items-center gap-2 px-3 py-2.5 pr-8 rounded-lg bg-[#23482f] hover:bg-[#2c5a3b] border border-transparent hover:border-primary/30 transition-all text-white text-sm font-medium cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="all">Função: Todos</option>
                                    <option value="admin">Função: Administrador</option>
                                    <option value="manager">Função: Gestor</option>
                                    <option value="operational">Função: Operacional</option>
                                </select>
                                <span className="material-symbols-outlined text-sm text-[#92c9a4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                            </div>
                            <div className="relative flex-1 sm:flex-none">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none flex items-center gap-2 px-3 py-2.5 pr-8 rounded-lg bg-[#23482f] hover:bg-[#2c5a3b] border border-transparent hover:border-primary/30 transition-all text-white text-sm font-medium cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="all">Status: Todos</option>
                                    <option value="active">Status: Ativo</option>
                                    <option value="inactive">Status: Inativo</option>
                                </select>
                                <span className="material-symbols-outlined text-sm text-[#92c9a4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#112217] sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#92c9a4]">Usuário</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#92c9a4]">Função</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#92c9a4] hidden xl:table-cell">Último Acesso</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#92c9a4]">Status</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#92c9a4] text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#23482f]">
                                {filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className={`group hover:bg-white/5 transition-colors cursor-pointer border-l-2 ${index === 0 ? 'border-primary bg-white/[0.02]' : 'border-transparent'}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <div className="size-9 rounded-full bg-slate-700 bg-cover bg-center border border-slate-600" style={{ backgroundImage: `url("${user.avatar_url}")` }}></div>
                                                ) : (
                                                    <div className="flex items-center justify-center size-9 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                                                        {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-medium">{user.full_name}</span>
                                                    <span className="text-slate-400 text-xs">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="py-3 px-4 hidden xl:table-cell">
                                            <span className="text-slate-300 text-sm">{user.last_access || 'Nunca'}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`size-2 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                                <span className="text-white text-sm">{user.is_active ? 'Ativo' : 'Inativo'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-3 border-t border-[#23482f] flex justify-between items-center bg-[#14261d]">
                        <span className="text-xs text-slate-400">
                            Mostrando <span className="text-white font-medium">1-{filteredUsers.length}</span> de <span className="text-white font-medium">{users.length}</span>
                        </span>
                        <div className="flex gap-2">
                            <button className="p-1 rounded bg-[#23482f] text-slate-400 hover:text-white disabled:opacity-50">
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            <button className="p-1 rounded bg-[#23482f] text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit Panel */}
                {selectedUser && (
                    <div className="w-[380px] hidden md:flex flex-col bg-surface-dark rounded-xl border border-[#23482f] shadow-2xl relative">
                        <div className="p-5 border-b border-[#23482f] flex justify-between items-center bg-[#14261d] rounded-t-xl">
                            <h3 className="text-white font-bold text-lg">Editar Usuário</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                    <div className="size-24 rounded-full bg-slate-700 bg-cover bg-center ring-4 ring-[#23482f] group-hover:ring-primary/50 transition-all" style={{ backgroundImage: selectedUser.avatar_url ? `url("${selectedUser.avatar_url}")` : 'none' }}></div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white">camera_alt</span>
                                    </div>
                                </div>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                            const toastId = toast.loading('Enviando foto...');

                                            // 1. Prepare path
                                            const fileExt = file.name.split('.').pop();
                                            // Use a temp ID if new user, or actual ID
                                            const userIdPath = selectedUser.id === 'new' ? 'temp' : selectedUser.id;
                                            const fileName = `${userIdPath}/${Math.random().toString(36).slice(2)}.${fileExt}`;

                                            // 2. Upload
                                            const { error: uploadError } = await supabase.storage
                                                .from('avatars')
                                                .upload(fileName, file, { upsert: true });

                                            if (uploadError) throw uploadError;

                                            // 3. Get URL
                                            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

                                            setSelectedUser({ ...selectedUser, avatar_url: data.publicUrl });
                                            toast.success('Foto enviada com sucesso!', { id: toastId });

                                        } catch (error: any) {
                                            console.error('Upload error:', error);
                                            toast.error('Erro ao enviar foto. Tente novamente.');
                                        }
                                    }}
                                />
                                <span
                                    className="text-primary text-xs font-bold cursor-pointer hover:underline p-2"
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                >
                                    Alterar foto
                                </span>
                            </div>

                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs uppercase tracking-wider text-[#92c9a4] font-bold mb-2">Informações Pessoais</h4>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300">Nome Completo</label>
                                    <input
                                        className="w-full bg-[#1a3524] border border-[#2a4e38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        type="text"
                                        value={selectedUser.full_name}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300">E-mail</label>
                                    <input
                                        className="w-full bg-[#1a3524] border border-[#2a4e38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        type="email"
                                        value={selectedUser.email}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Team Selection */}
                            <div className="space-y-4">
                                <MultiSelectDropdown
                                    label="EQUIPES"
                                    placeholder="Selecione as equipes..."
                                    options={teams}
                                    selectedValues={selectedUser.team_ids || []}
                                    onChange={(newValues) => setSelectedUser({ ...selectedUser, team_ids: newValues })}
                                    icon="groups"
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-3">
                                <h4 className="text-xs uppercase tracking-wider text-[#92c9a4] font-bold">Definição de Acesso</h4>

                                {/* Admin */}
                                <label className={`relative flex items-start p-3 rounded-lg cursor-pointer transition-all ${selectedUser.role === 'admin' ? 'bg-[#23482f]/50 border-2 border-primary' : 'bg-[#1a2c20] border border-[#2a4e38] hover:border-slate-500'}`}>
                                    <input
                                        className="hidden"
                                        name="role"
                                        type="radio"
                                        checked={selectedUser.role === 'admin'}
                                        onChange={() => setSelectedUser({ ...selectedUser, role: 'admin' })}
                                    />
                                    {selectedUser.role === 'admin' && (
                                        <div className="absolute top-3 right-3">
                                            <span className="material-symbols-outlined text-primary text-xl icon-filled">check_circle</span>
                                        </div>
                                    )}
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-white">Administrador</span>
                                        <span className="block text-xs text-slate-400 mt-1">Acesso total ao sistema, configurações e gestão de usuários.</span>
                                    </div>
                                </label>

                                {/* Manager */}
                                <label className={`relative flex items-start p-3 rounded-lg cursor-pointer transition-all ${selectedUser.role === 'manager' ? 'bg-[#23482f]/50 border-2 border-primary' : 'bg-[#1a2c20] border border-[#2a4e38] hover:border-slate-500'}`}>
                                    <input
                                        className="hidden"
                                        name="role"
                                        type="radio"
                                        checked={selectedUser.role === 'manager'}
                                        onChange={() => setSelectedUser({ ...selectedUser, role: 'manager' })}
                                    />
                                    {selectedUser.role === 'manager' && (
                                        <div className="absolute top-3 right-3">
                                            <span className="material-symbols-outlined text-primary text-xl icon-filled">check_circle</span>
                                        </div>
                                    )}
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="size-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <span className="material-symbols-outlined text-lg">manage_accounts</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-slate-200">Gestor</span>
                                        <span className="block text-xs text-slate-500 mt-1">Gerenciamento de projetos, equipes e relatórios.</span>
                                    </div>
                                </label>

                                {/* Operational */}
                                <label className={`relative flex items-start p-3 rounded-lg cursor-pointer transition-all ${selectedUser.role === 'operational' ? 'bg-[#23482f]/50 border-2 border-primary' : 'bg-[#1a2c20] border border-[#2a4e38] hover:border-slate-500'}`}>
                                    <input
                                        className="hidden"
                                        name="role"
                                        type="radio"
                                        checked={selectedUser.role === 'operational'}
                                        onChange={() => setSelectedUser({ ...selectedUser, role: 'operational' })}
                                    />
                                    {selectedUser.role === 'operational' && (
                                        <div className="absolute top-3 right-3">
                                            <span className="material-symbols-outlined text-primary text-xl icon-filled">check_circle</span>
                                        </div>
                                    )}
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="size-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <span className="material-symbols-outlined text-lg">person</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-slate-200">Operacional</span>
                                        <span className="block text-xs text-slate-500 mt-1">Visualização de tarefas e execução de atividades.</span>
                                    </div>
                                </label>
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-medium text-white">Status do Usuário</span>
                                <button
                                    onClick={() => setSelectedUser({ ...selectedUser, is_active: !selectedUser.is_active })}
                                    className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#102216] focus:ring-primary ${selectedUser.is_active ? 'bg-primary' : 'bg-gray-600'}`}
                                >
                                    <span className={`block w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform ${selectedUser.is_active ? 'left-6' : 'left-1'}`}></span>
                                </button>
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#23482f] bg-[#14261d] rounded-b-xl flex items-center justify-between gap-3">
                            {selectedUser.id !== 'new' && (
                                <button
                                    onClick={handleDeleteUser}
                                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Excluir Usuário
                                </button>
                            )}
                            <div className="flex items-center gap-3 ml-auto">
                                <button onClick={() => setSelectedUser(null)} className="px-4 py-2 border border-[#2a4e38] rounded-lg text-slate-300 font-bold text-sm hover:bg-[#23482f] transition-colors">Cancelar</button>
                                <button onClick={handleSaveUser} className="px-4 py-2 bg-primary hover:bg-primary-dark text-background-dark rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-colors">Salvar Alterações</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
