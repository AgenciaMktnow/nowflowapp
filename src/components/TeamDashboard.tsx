import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { taskService } from '../services/task.service';
import { teamService, type Team } from '../services/team.service';

interface TeamDashboardProps {
    teamId: string;
}

interface MemberPerformance {
    userId: string;
    userName: string;
    avatarUrl?: string; // Optional
    email?: string;
    activeTasks: number;
    completedTasks: number;
    totalTasks: number;
    overdueTasks: number;
}

export default function TeamDashboard({ teamId }: TeamDashboardProps) {
    const [team, setTeam] = useState<Team | null>(null);
    const [performanceData, setPerformanceData] = useState<MemberPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [teamId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Team Details
            const { data: teamsData } = await teamService.getTeams(); // Assuming we filter client-side or fetch single if supported
            const currentTeam = teamsData?.find(t => t.id === teamId);
            setTeam(currentTeam || null);

            if (!currentTeam) return;

            // 2. Fetch Members & Tasks in parallel
            const [membersRes, tasksRes] = await Promise.all([
                teamService.getTeamMembers(teamId),
                taskService.getTasks({ teamId })
            ]);

            const members = membersRes.data || [];
            const tasks = tasksRes.data || [];

            // 3. Compute Stats
            const statsMap: Record<string, MemberPerformance> = {};

            // Initialize all members with 0 stats
            members.forEach(member => {
                statsMap[member.id] = {
                    userId: member.id,
                    userName: member.full_name,
                    avatarUrl: member.avatar_url,
                    email: member.email,
                    activeTasks: 0,
                    completedTasks: 0,
                    totalTasks: 0,
                    overdueTasks: 0
                };
            });

            // Aggregate task data
            const now = new Date();
            tasks.forEach(task => {
                if (task.assignee_id && statsMap[task.assignee_id]) {
                    const memberStats = statsMap[task.assignee_id];
                    memberStats.totalTasks++;

                    if (task.status === 'DONE') {
                        memberStats.completedTasks++;
                    } else {
                        memberStats.activeTasks++;
                        if (task.due_date && new Date(task.due_date) < now) {
                            memberStats.overdueTasks++;
                        }
                    }
                }
            });

            setPerformanceData(Object.values(statsMap));
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados de performance');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-subtle animate-pulse">Carregando performance da equipe...</div>;
    if (!team) return <div className="p-8 text-center text-red-500">Equipe não encontrada.</div>;

    // Chart Calculations
    const maxActiveTasks = Math.max(...performanceData.map(d => d.activeTasks), 1); // Avoid div by zero

    return (
        <div className="space-y-6 animate-fade-in p-2">
            {/* Header / Context */}
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white font-display">{team.name}</h2>
                <p className="text-text-subtle text-sm">Monitoramento de Carga e Performance</p>
            </div>

            {/* Workload Chart Section */}
            <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Carga de Trabalho (Tarefas Ativas)</h3>

                {/* Chart Container */}
                <div className="flex items-end gap-4 h-48 w-full overflow-x-auto pb-2 custom-scrollbar">
                    {performanceData.map(member => (
                        <div key={member.userId} className="flex flex-col items-center gap-2 group min-w-[60px] flex-1">
                            {/* Bar */}
                            <div className="relative w-full max-w-[40px] bg-white/5 rounded-t-lg h-full flex items-end overflow-hidden group-hover:bg-white/10 transition-colors">
                                <div
                                    className="w-full bg-primary transition-all duration-700 ease-out rounded-t-lg relative group-hover:opacity-90"
                                    style={{ height: `${(member.activeTasks / maxActiveTasks) * 100}%` }}
                                >
                                    {/* Tooltip value on hover or always visible if convenient */}
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {member.activeTasks}
                                    </span>
                                </div>
                            </div>

                            {/* Label */}
                            <div className="text-center">
                                <div className="text-xs font-medium text-text-muted-dark truncate max-w-[80px]" title={member.userName}>
                                    {member.userName.split(' ')[0]}
                                </div>
                            </div>
                        </div>
                    ))}
                    {performanceData.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-text-subtle text-xs">
                            Sem dados de carga para exibir.
                        </div>
                    )}
                </div>
            </div>

            {/* Member List Details */}
            <div className="grid grid-cols-1 gap-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-4 mb-2">Detalhamento por Membro</h3>

                {performanceData.map(member => {
                    const progress = member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0;

                    return (
                        <div key={member.userId} className="bg-surface-dark/50 hover:bg-surface-dark border border-border-dark/50 hover:border-border-dark rounded-lg p-4 flex items-center gap-4 transition-all group">
                            {/* Avatar */}
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.userName} className="size-10 rounded-full object-cover border border-white/10" />
                            ) : (
                                <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                                    {member.userName.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Info & Stats */}
                            <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                                {/* Name */}
                                <div className="col-span-4 md:col-span-3">
                                    <div className="font-bold text-white truncate">{member.userName}</div>
                                    <div className="text-xs text-text-subtle truncate">{member.email}</div>
                                </div>

                                {/* Progress Bar */}
                                <div className="col-span-8 md:col-span-6 flex flex-col justify-center gap-1.5">
                                    <div className="flex justify-between text-xs text-text-muted-dark">
                                        <span>Progresso ({member.completedTasks}/{member.totalTasks})</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-700 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Badges / Extra */}
                                <div className="col-span-12 md:col-span-3 flex justify-end gap-2 mt-2 md:mt-0">
                                    {member.overdueTasks > 0 && (
                                        <div className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-md flex items-center gap-1.5 text-xs text-red-400 font-medium" title={`${member.overdueTasks} tarefas atrasadas`}>
                                            <span className="material-symbols-outlined text-[14px]">warning</span>
                                            {member.overdueTasks} Atrasadas
                                        </div>
                                    )}
                                    {member.activeTasks === 0 && member.totalTasks > 0 && progress === 100 && (
                                        <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-md flex items-center gap-1.5 text-xs text-green-400 font-medium">
                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                            Livre
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {performanceData.length === 0 && (
                    <div className="p-8 text-center text-text-subtle text-sm bg-surface-dark/30 rounded-xl border border-border-dark border-dashed">
                        Nenhum membro encontrado nesta equipe.
                    </div>
                )}
            </div>
        </div>
    );
}
