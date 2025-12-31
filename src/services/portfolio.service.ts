
import { supabase } from '../lib/supabase';


export interface ProjectHealth {
    projectId: string;
    projectName: string;
    clientName?: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    progress: number; // 0-100
    lastActivity: string | null;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    teamName?: string;
    lead?: {
        name: string;
        avatarUrl?: string;
    };
}

export interface TeamLoad {
    teamId: string;
    teamName: string;
    memberCount: number;
    activeTasks: number;
    capacity: number; // Arbitrary for now, or based on member count
    utilization: number; // 0-100+
}

export interface PortfolioSummary {
    totalProjects: number;
    activeProjects: number; // Status != COMPLETED/ARCHIVED
    delayedProjects: number; // Status CRITICAL
    avgTeamUtilization: number;
    projects: ProjectHealth[];
    teams: TeamLoad[];
}

export const portfolioService = {
    async getPortfolioSummary(): Promise<{ data: PortfolioSummary | null; error: Error | null }> {
        try {
            // 1. Fetch Projects with metadata
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select(`
                    id, 
                    name, 
                    status,
                    created_at,
                    client:clients!projects_client_id_fkey(name),
                    team:teams!projects_team_id_fkey(id, name),
                    tasks:tasks(id, status, due_date, created_at)
                `)
                .neq('status', 'ARCHIVED');

            if (projectsError) throw projectsError;

            // 2. Fetch Teams for utilization
            const { data: teams, error: teamsError } = await supabase
                .from('teams')
                .select(`
                    id, 
                    name,
                    members:user_teams(count)
                `);

            if (teamsError) throw teamsError;

            // 3. Process Logic
            const projectHealths: ProjectHealth[] = (projects || []).map((p: any) => {
                const tasks = p.tasks || [];
                const total = tasks.length;
                const completed = tasks.filter((t: any) => t.status === 'DONE').length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                // RAG Logic
                const overdue = tasks.filter((t: any) =>
                    t.status !== 'DONE' &&
                    t.due_date &&
                    new Date(t.due_date) < new Date()
                ).length;

                // Activity check (days since last update on project or any task)
                // We'll simplistic take project update or max task update
                const lastActivity = [p.created_at, ...tasks.map((t: any) => t.created_at)]
                    .filter(Boolean)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

                const daysSinceActivity = lastActivity
                    ? (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 3600 * 24)
                    : 999;

                let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

                // Logic: 
                // CRITICAL if > 20% tasks overdue OR inactivity > 14 days
                // WARNING if > 10% tasks overdue OR inactivity > 7 days
                const overdueRatio = total > 0 ? overdue / total : 0;

                if (overdueRatio > 0.2 || daysSinceActivity > 14) {
                    status = 'CRITICAL';
                } else if (overdueRatio > 0.1 || daysSinceActivity > 7) {
                    status = 'WARNING';
                }

                return {
                    projectId: p.id,
                    projectName: p.name,
                    clientName: p.client?.name,
                    teamName: p.team?.name,
                    totalTasks: total,
                    completedTasks: completed,
                    overdueTasks: overdue,
                    progress,
                    lastActivity,
                    status
                };
            });

            // 4. Team Load Logic (simplified for now as tasks are fetched via projects, 
            // but we need global active tasks per team. 
            // The project->tasks query gives us tasks for those projects. 
            // If tasks always belong to a project, we are good.
            // Aggregating form projectHealths? No, need assignee or team count.
            // Let's rely on tasks fetched above for now (approximate).
            // Better: active tasks count per team from the tasks fetched.

            const teamLoads: TeamLoad[] = (teams || []).map((t: any) => {
                const memberCount = t.members?.[0]?.count || 0;
                // Find all tasks belonging to projects of this team (approximation)
                // Real usage: tasks have team_id. 
                // We didn't select team_id in tasks above but we can link via project team.
                // Or easier: fetch task count by team separately? 
                // Let's iterate the projects fetched.

                const teamProjects = projects?.filter((p: any) => p.team?.id === t.id) || [];
                const activeTasks = teamProjects.reduce((acc: number, p: any) => {
                    return acc + (p.tasks?.filter((task: any) => task.status !== 'DONE').length || 0);
                }, 0);

                // Capacity heuristic: 5 active tasks per member is "100%"
                const capacity = memberCount * 5;
                const utilization = capacity > 0 ? Math.round((activeTasks / capacity) * 100) : 0;

                return {
                    teamId: t.id,
                    teamName: t.name,
                    memberCount,
                    activeTasks,
                    capacity,
                    utilization
                };
            });

            // 5. Summary Stats
            const totalProjects = projectHealths.length;
            const activeProjects = projectHealths.filter(p => p.progress < 100).length; // or status based
            const delayedProjects = projectHealths.filter(p => p.status === 'CRITICAL').length;
            const avgTeamUtilization = teamLoads.length > 0
                ? Math.round(teamLoads.reduce((acc, t) => acc + t.utilization, 0) / teamLoads.length)
                : 0;

            const summary: PortfolioSummary = {
                totalProjects,
                activeProjects,
                delayedProjects,
                avgTeamUtilization,
                projects: projectHealths,
                teams: teamLoads
            };

            return { data: summary, error: null };
        } catch (error: any) {
            console.error('PortfolioService Error:', error);
            return { data: null, error };
        }
    }
};
