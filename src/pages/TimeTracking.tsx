import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LiveTimerWidget from '../components/time-tracking/LiveTimerWidget';
import WeeklyTimesheet from '../components/time-tracking/WeeklyTimesheet';
import DailyTimeline from '../components/time-tracking/DailyTimeline';
import PerformancePanel from '../components/time-tracking/PerformancePanel';
import ModernDropdown from '../components/ModernDropdown';
import TeamReport from '../components/time-tracking/TeamReport';

interface UserOption {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
    team_ids?: string[];
}

interface ClientOption {
    id: string;
    name: string;
}

interface TeamOption {
    id: string;
    name: string;
}

export default function TimeTracking() {
    const { user, userProfile } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<UserOption[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [viewMode, setViewMode] = useState<'dashboard' | 'report'>('dashboard');

    // Initialize selected user default
    useEffect(() => {
        // If not admin/manager, lock to self
        if (user && userProfile && userProfile.role !== 'ADMIN' && userProfile.role !== 'MANAGER') {
            setSelectedUserId(user.id);
        }
    }, [user, userProfile]);

    // Fetch data if Admin/Manager
    useEffect(() => {
        if (userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'MANAGER')) {
            fetchData();
        }
    }, [userProfile]);

    const fetchData = async () => {
        try {
            // Fetch Users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, avatar_url, email')
                .eq('status', 'ACTIVE')
                .order('full_name');

            // Fetch User Teams
            const { data: userTeamsData } = await supabase
                .from('user_teams')
                .select('user_id, team_id');

            if (!userError && userData) {
                const mapUsers = userData.map(u => {
                    const teams = userTeamsData
                        ?.filter(ut => ut.user_id === u.id)
                        .map(ut => ut.team_id) || [];
                    return { ...u, team_ids: teams };
                });
                setTeamMembers(mapUsers);
            }

            // Fetch Clients
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('status', 'ACTIVE')
                .order('name');

            if (!clientError && clientData) {
                setClients(clientData);
            }

            // Fetch Teams
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('id, name')
                .order('name');

            if (!teamsError && teamsData) {
                setTeams(teamsData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const isAdminOrManager = userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER';

    // Determine Effective User IDs for Filtering
    let effectiveUserIds: string[] = [];

    if (selectedUserId && selectedUserId !== 'all') {
        // Specific user selected
        effectiveUserIds = [selectedUserId];
    } else if (selectedUserId === 'all' || !selectedUserId) {
        if (selectedTeam) {
            // All users in selected team
            effectiveUserIds = teamMembers
                .filter(u => u.team_ids?.includes(selectedTeam))
                .map(u => u.id);
        } else if (isAdminOrManager && selectedUserId === 'all') {
            // Admin selected "All Users" explicitly - Pass empty array to signal "really all" or handle huge list
            // Strategy: Pass undefined/null to widgets to let them fetch ALL, or pass all IDs.
            // Given the widgets logic usually expects a list for "IN" query, let's look at the constraints.
            // For safety and performance, let's limit "All" without team to "All Fetched Users" (which are active users).
            effectiveUserIds = teamMembers.map(u => u.id);
        } else {
            // Default fallback for initial load or non-admin: Just me
            if (user?.id) effectiveUserIds = [user.id];
        }
    }

    // Helper for visual feedback
    const isFiltered = (val: string | null) => val !== '' && val !== null && val !== 'all';

    // Prepare Dropdown Options
    const teamOptions = [
        { id: '', name: 'Todas Equipes' },
        ...teams.map(t => ({ id: t.id, name: t.name }))
    ];

    const clientOptions = [
        { id: '', name: 'Todos Clientes' },
        ...clients.map(c => ({ id: c.id, name: c.name }))
    ];

    const userOptions = [
        { id: 'all', name: 'Todos os Usuários' },
        { id: user?.id || 'me', name: 'Minhas Horas' },
        ...teamMembers
            .filter(m => !selectedTeam || m.team_ids?.includes(selectedTeam))
            .filter(m => m.id !== user?.id)
            .map(m => ({ id: m.id, name: m.full_name || m.email || 'Usuário Sem Nome' }))
    ];

    // Determine users object for Report props (needs object array)


    return (
        <div className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-8 animate-fade-in overflow-y-auto h-full">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Rastreamento de Tempo</h1>
                    <p className="text-gray-400 mt-1">Gerencie suas horas e impulsione sua produtividade.</p>
                </div>

                {isAdminOrManager && (
                    <div className="flex flex-wrap items-center gap-3">
                        {/* View Toggle */}
                        <div className="bg-surface-dark p-1 rounded-xl border border-gray-800 flex h-14 items-center">
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'dashboard' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setViewMode('report')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'report' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                Relatório
                            </button>
                        </div>

                        {/* Filters - Only show in Dashboard mode (Report has its own) 
                            User request: Sync state. So we should probably SHOW these in Report too? 
                            The Report component has its OWN internal filters. 
                            If we want true sync, we should pass these props TO Report and remove Report's internal filters.
                            However, per plan "Fix TeamReport state synchronization", we will keep Report's structure but init it with these values.
                            Let's keep filters here only for Dashboard for now to avoid double UI headers in Report mode.
                        */}
                        {viewMode === 'dashboard' && (
                            <>
                                {/* Team Filter */}
                                <ModernDropdown
                                    options={teamOptions}
                                    value={selectedTeam || ''}
                                    onChange={(val) => setSelectedTeam(val || null)}
                                    placeholder="Todas Equipes"
                                    icon="groups"
                                    className={`min-w-[160px] ${isFiltered(selectedTeam) ? 'border-primary/50 shadow-[0_0_10px_rgba(19,236,91,0.1)]' : ''}`}
                                />

                                {/* Client Filter */}
                                <ModernDropdown
                                    options={clientOptions}
                                    value={selectedClient || ''}
                                    onChange={(val) => setSelectedClient(val || null)}
                                    placeholder="Todos Clientes"
                                    icon="domain"
                                    className={`min-w-[160px] ${isFiltered(selectedClient) ? 'border-primary/50 shadow-[0_0_10px_rgba(19,236,91,0.1)]' : ''}`}
                                />

                                {/* User Selector */}
                                <ModernDropdown
                                    options={userOptions}
                                    value={selectedUserId || 'all'}
                                    onChange={(val) => setSelectedUserId(val)}
                                    placeholder="Selecionar Usuário"
                                    icon="person"
                                    className={`min-w-[200px] ${selectedUserId && selectedUserId !== 'all' && selectedUserId !== user?.id ? 'border-primary/50 shadow-[0_0_10px_rgba(19,236,91,0.1)]' : ''}`}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            {viewMode === 'report' ? (
                <TeamReport
                    users={teamMembers} // Pass filtered list to ensure consistency or pass all? TeamReport does its own filtering.
                    // Better to pass ALL eligible users and let TeamReport filter by its internal state which we sync.
                    // Actually, if we want sync, we should rely on TeamReport to accept "initialFilter"
                    teams={teams}
                    filterTeam={selectedTeam || undefined}
                    filterClient={selectedClient || undefined}
                />
            ) : (
                /* Dashboard View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Widgets receiving array of IDs and Client ID */}
                        <LiveTimerWidget
                            userIds={effectiveUserIds}
                            clientId={selectedClient || undefined}
                        />
                        <WeeklyTimesheet
                            userIds={effectiveUserIds}
                            clientId={selectedClient || undefined}
                        />
                        <DailyTimeline
                            userIds={effectiveUserIds}
                            clientId={selectedClient || undefined}
                        />
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="flex flex-col gap-6">
                        <PerformancePanel
                            userIds={effectiveUserIds}
                            clientId={selectedClient || undefined}
                        />
                        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5 rounded-2xl p-6 text-center">
                            <span className="material-symbols-outlined text-4xl text-white/20 mb-2">emoji_events</span>
                            <h3 className="text-white font-bold">Metas Semanais</h3>
                            <p className="text-xs text-gray-400 mt-1">Em breve você poderá definir metas de horas.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
