import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LiveTimerWidget from '../components/time-tracking/LiveTimerWidget';
import WeeklyTimesheet from '../components/time-tracking/WeeklyTimesheet';
import DailyTimeline from '../components/time-tracking/DailyTimeline';
import PerformancePanel from '../components/time-tracking/PerformancePanel';
// import ModernDropdown from '../components/ModernDropdown';
import TeamReport from '../components/time-tracking/TeamReport';
import TimeFilters from '../components/TimeFilters';

interface UserOption {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
    team_ids: string[];
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
    
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const [teamMembers, setTeamMembers] = useState<UserOption[]>([]);

    const [clients, setClients] = useState<ClientOption[]>([]);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [viewMode, setViewMode] = useState<'dashboard' | 'report'>('dashboard');
    const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null)
    const [openInsights, setOpenInsights] = useState(false)

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const [startDate, setStartDate] = useState<Date>(sevenDaysAgo);
    const [endDate, setEndDate] = useState<Date>(today);

    // Initialize selected user default
    useEffect(() => {
        // If not admin/manager, lock to self
        // if (user && userProfile && userProfile.role !== 'ADMIN' && userProfile.role !== 'MANAGER') {
        if (user) {
            setSelectedUserId(user.id);
        }
    }, [user, userProfile]);

    useEffect(() => {
        if (selectedTeamId) {
            setSelectedUserId('');
        }
    }, [selectedTeamId]);

    // Fetch data if Admin/Manager
    // useEffect(() => {
    //     if (userProfile && (userProfile.role === 'ADMIN' || userProfile.role === 'MANAGER')) {
    //         fetchData();
    //     }
    // }, [userProfile]);
    useEffect(() => {
        if (userProfile) {
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
            
                console.log("USER_TEAMS:", userTeamsData);

            if (!userError && userData) {
                const mapUsers = userData.map(u => {
                    const teams = userTeamsData
                        ?.filter(ut => ut.user_id === u.id)
                        .map(ut => ut.team_id) || [];

                    console.log("USUÁRIO E EQUIPES:", u.full_name, teams);

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

    

    // const isAdminOrManager = userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER';
    const isAdminOrManager = true;

    // Determine Effective User IDs for Filtering
    const effectiveUserIds = selectedUserId
        ? [selectedUserId]
        : selectedTeamId
            ? teamMembers
                .filter(u => (u.team_ids || []).includes(selectedTeamId))
                .map(u => u.id)
            : teamMembers.map(u => u.id);

    // Prepare Dropdown Options
    const teamOptions = [
        { id: '', name: 'Todas as Equipes' },
        ...teams.map(t => ({
            id: t.id,
            name: t.name
        }))
    ];

    const clientOptions = [
        { id: '', name: 'Todos os Clientes' },
        ...clients.map(c => ({
            id: c.id,
            name: c.name
        }))
    ];

    const filteredUsers = selectedTeamId
        ? teamMembers.filter(u => (u.team_ids || []).includes(selectedTeamId))
        : teamMembers;

    const userOptions = [
        { id: '', name: 'Todos os usuários' },
        ...filteredUsers.map(u => ({
            id: u.id,
            name: u.full_name || u.email || 'Usuário'
        }))
    ];

    const canAdvancedReports = true;
    const [showExportMenu, setShowExportMenu] = useState(false);

    // const handleExportPDF = () => {};
    // const handleExportCSV = () => {};


    

    const [showInsights, setShowInsights] = useState(false);

console.log("FILTROS ATUAIS:", {
    selectedTeamId,
    selectedUserId,
    selectedClientId
});
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

                    </div>
                )}
            </div>
            
            <TimeFilters
                teams={teams}
                clients={clients}
                users={teamMembers}

                selectedTeamId={selectedTeamId}
                selectedClientId={selectedClientId}
                selectedUserId={selectedUserId}

                setSelectedTeamId={setSelectedTeamId}
                setSelectedClientId={setSelectedClientId}
                setSelectedUserId={setSelectedUserId}

                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}

                canAdvancedReports={canAdvancedReports}

                showExportMenu={showExportMenu}
                setShowExportMenu={setShowExportMenu}

                handleExportPDF={() => {
                    setExportType('pdf')
                    setViewMode('report')
                }}

                handleExportCSV={() => {
                    setExportType('csv')
                    setViewMode('report')
                }}

                onInsightsClick={() => {
                    setOpenInsights(true)
                    setViewMode('report')
                }}
            />

            {viewMode === 'report' ? (
                <TeamReport
                    users={teamMembers}
                    teams={teams}
                    filterTeam={selectedTeamId}
                    filterClient={selectedClientId}
                    filterUser={selectedUserId}
                    exportType={exportType}
                    setExportType={setExportType}
                    openInsights={openInsights}
                    setOpenInsights={setOpenInsights}
                />
            ) : (
                /* Dashboard View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Widgets receiving array of IDs and Client ID */}
                        <LiveTimerWidget
                            userIds={effectiveUserIds}
                            clientId={selectedClientId || undefined}
                        />
                        <WeeklyTimesheet
                            userIds={effectiveUserIds}
                            clientId={selectedClientId || undefined}
                            startDate={startDate}
                            endDate={endDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                        />
                        <DailyTimeline
                            userIds={effectiveUserIds}
                            clientId={selectedClientId || undefined}
                        />
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="flex flex-col gap-6 sticky top-1 h-fit">
                        <PerformancePanel
                            userIds={effectiveUserIds}
                            clientId={selectedClientId || undefined}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
