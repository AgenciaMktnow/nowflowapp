
import { supabase } from '../lib/supabase';

export interface TraceabilityRow {
    taskId: string;
    taskTitle: string;
    assigneeName: string;
    assigneeAvatar?: string;
    estimatedHours: number;
    actualHours: number;
    deviation: number; // actual - estimated
    deviationPercentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
    category?: string;
}

export interface FidelityMetric {
    userId: string;
    userName: string;
    avatarUrl?: string;
    totalHours: number;
    timerHours: number;
    manualHours: number;
    manualIndex: number; // 0-100%
    weeklyCapacity: number; // Configured capacity
    utilizationPercentage: number; // total / weekly
}

export interface ClientSummary {
    clientId: string;
    clientName: string;
    totalHours: number;
}

export interface DailyActivityBlock {
    userId: string;
    taskId: string;
    taskTitle: string;
    startTime: string; // ISO
    endTime: string; // ISO
    type: 'TIMER' | 'MANUAL';
    durationSeconds: number;
}

export interface CategoryMetric {
    category: string;
    totalHours: number;
    taskCount: number;
}

export const reportService = {
    /**
     * Fetches all necessary data and aggregates it for the Advanced Report.
     * Centralizes logic to avoid UI heaviness.
     */
    async getAdvancedReport(filters: {
        teamId?: string;
        clientId?: string;
        userId?: string;
        startDate: Date;
        endDate: Date;
    }) {
        try {
            // FIX: TIMEZONE ADJUSTMENT (GMT-3)
            // Ensure we cover the full range of the selected days in Local Time.
            // Start: 00:00:00 Local -> Add buffer to ensure we catch everything
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);

            // End: 23:59:59 Local
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);

            const startIso = start.toISOString();
            const endIso = end.toISOString();

            // 0. PRE-FILTER BY TEAM (If Team Selected)
            // Fix: We must fetch users OF THAT TEAM first, then filter logs by those user_ids.
            let teamUserIds: string[] | null = null;
            if (filters.teamId) {
                const { data: teamMembers } = await supabase
                    .from('user_teams')
                    .select('user_id')
                    .eq('team_id', filters.teamId);

                if (teamMembers) {
                    teamUserIds = teamMembers.map(tm => tm.user_id);
                } else {
                    teamUserIds = []; // Empty team
                }
            }

            // 1. Fetch Users List for Hierarchy Initialization (Show 0h users)
            // We need to fetch users that match the current filters to show them even if no logs exist.
            let usersQuery = supabase
                .from('users')
                .select('id, full_name, avatar_url, weekly_capacity_hours')
                .eq('status', 'ACTIVE'); // Only active users

            if (filters.userId && filters.userId !== 'all') {
                usersQuery = usersQuery.eq('id', filters.userId);
            }
            if (teamUserIds !== null) {
                if (teamUserIds.length > 0) {
                    usersQuery = usersQuery.in('id', teamUserIds);
                } else {
                    // Force empty result behavior if team is empty
                    usersQuery = usersQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
                }
            }

            const { data: filterUsers, error: userError } = await usersQuery;
            if (userError) console.error('Error fetching users for report:', userError);


            // 2. Fetch Time Logs with Task and User details
            // We need to fetch ALL logs for the period to calculate metrics
            // Filters (Team/Client) apply to the WHERE clause
            let query = supabase
                .from('time_logs')
                .select(`
                    id,
                    start_time,
                    end_time,
                    duration_seconds,
                    is_manual,
                    description,
                    user_id,
                    user:users(id, full_name, avatar_url, weekly_capacity_hours),
                    task:tasks(
                        id, 
                        title, 
                        estimated_time, 
                        category, 
                        client_id,
                        task_number
                    )
                `)
                .gte('start_time', startIso)
                .lte('start_time', endIso);

            // Apply Filters
            if (filters.userId && filters.userId !== 'all') {
                query = query.eq('user_id', filters.userId);
            }

            // Apply Team Filter (via user_id IN list)
            if (teamUserIds !== null) {
                if (teamUserIds.length > 0) {
                    query = query.in('user_id', teamUserIds);
                } else {
                    // Team selected but empty, return empty result
                    return { hierarchy: [], timeline: [], categories: [] };
                }
            }

            // Fetch Clients for Names (Avoid nested join issues)
            const { data: clientsData } = await supabase.from('clients').select('id, name');
            const clientNameMap = new Map<string, string>();
            clientsData?.forEach((c: any) => clientNameMap.set(c.id, c.name));

            const { data: logs, error } = await query;

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            const safeLogs = logs || [];

            // Client Side Filtering for Task Properties (Client Filter)
            // We filter logs here because applying filter on nested 'task' via Supabase is complex without flatter structure
            const filteredLogs = safeLogs.filter((log: any) => {
                if (filters.clientId) {
                    // Only keep logs where task belongs to client OR logs tied to client (future feature)
                    if (log.task?.client_id !== filters.clientId) return false;
                }
                return true;
            });

            // --- Hierarchical Aggregation (User -> Client -> Task) ---
            const userMap = new Map<string, any>();

            // A. Initialize All Users (Ensure 0h users appear)
            if (filterUsers) {
                filterUsers.forEach(u => {
                    userMap.set(u.id, {
                        userId: u.id,
                        userName: u.full_name || 'Usuário Sem Nome',
                        avatarUrl: u.avatar_url,
                        weeklyCapacity: u.weekly_capacity_hours || 40,
                        totalHours: 0,
                        timerHours: 0,
                        manualHours: 0,
                        totalSeconds: 0,
                        manualSeconds: 0,
                        timerSeconds: 0,
                        clients: new Map<string, any>()
                    });
                });
            }

            // B. Populate with Logs
            filteredLogs.forEach((log: any) => {
                const userId = log.user_id;
                // Allow processing even if task is missing (orphan log)
                if (!userId) return;

                if (!userMap.has(userId)) {
                    // Should not happen if filteredUsers is correct, but safe fallback
                    userMap.set(userId, {
                        userId,
                        userName: log.user?.full_name || 'Usuário Desconhecido',
                        avatarUrl: log.user?.avatar_url,
                        weeklyCapacity: log.user?.weekly_capacity_hours || 40,
                        totalHours: 0,
                        timerHours: 0,
                        manualHours: 0,
                        totalSeconds: 0,
                        manualSeconds: 0,
                        timerSeconds: 0,
                        clients: new Map<string, any>()
                    });
                }

                const userNode = userMap.get(userId);
                const duration = Number(log.duration_seconds || 0);
                const hours = duration / 3600;

                // User Totals
                userNode.totalHours += hours;
                userNode.totalSeconds = (userNode.totalSeconds || 0) + duration;

                if (log.is_manual) {
                    userNode.manualHours += hours;
                    userNode.manualSeconds = (userNode.manualSeconds || 0) + duration;
                } else {
                    userNode.timerHours += hours;
                    userNode.timerSeconds = (userNode.timerSeconds || 0) + duration;
                }

                // Client Grouping
                // Handle Orphan Logs (Task Deleted -> Set Null)
                const clientId = log.task?.client_id || 'orphaned';
                const clientName = clientNameMap.get(clientId) || (log.task ? 'Sem Cliente' : 'Tarefas Removidas');

                if (!userNode.clients.has(clientId)) {
                    userNode.clients.set(clientId, {
                        clientId,
                        clientName,
                        totalHours: 0,
                        totalSeconds: 0,
                        tasks: new Map<string, any>()
                    });
                }

                const clientNode = userNode.clients.get(clientId);
                clientNode.totalHours += hours;
                clientNode.totalSeconds += duration;

                // Task Grouping
                const taskId = log.task?.id || 'orphan-' + (log.id || Math.random());
                const taskTitle = log.task?.title || `(Tarefa Removida) ${log.description || ''}`;
                const taskNumber = log.task?.task_number || 0;

                if (!clientNode.tasks.has(taskId)) {
                    clientNode.tasks.set(taskId, {
                        taskId,
                        taskTitle,
                        taskNumber,
                        totalHours: 0,
                        totalSeconds: 0,
                        manualSeconds: 0,
                        manualHours: 0,
                        manualReasons: []
                    });
                }
                const taskNode = clientNode.tasks.get(taskId);
                taskNode.totalHours += hours;
                taskNode.totalSeconds += duration;

                if (log.is_manual) {
                    taskNode.manualHours += hours;
                    taskNode.manualSeconds = (taskNode.manualSeconds || 0) + duration;
                    if (log.description) {
                        taskNode.manualReasons.push(log.description);
                    }
                }
            });

            // Convert Maps to Arrays and Calculate Metrics
            const hierarchy = Array.from(userMap.values()).map(user => {
                user.manualPercentage = user.totalHours > 0 ? (user.manualHours / user.totalHours) * 100 : 0;
                user.utilizationPercentage = user.weeklyCapacity > 0 ? (user.totalHours / user.weeklyCapacity) * 100 : 0;

                user.clients = Array.from(user.clients.values()).map((client: any) => {
                    client.tasks = Array.from(client.tasks.values())
                        .map((t: any) => ({
                            ...t,
                            isMostlyManual: t.manualHours > (t.totalHours * 0.5),
                            manualReason: t.manualReasons.length > 0 ? t.manualReasons.join(' | ') : null
                        }))
                        .sort((a: any, b: any) => b.totalHours - a.totalHours);
                    return client;
                }).sort((a: any, b: any) => b.totalHours - a.totalHours);

                return user;
            }).sort((a, b) => b.totalHours - a.totalHours);

            // Timeline for Heatmap
            const timeline = filteredLogs.map((log: any) => ({
                type: log.is_manual ? 'MANUAL' : 'TIMER',
                startTime: log.start_time,
                durationSeconds: log.duration_seconds || 0
            }));

            // Categories for Chart
            const categoryMap = new Map<string, any>();
            filteredLogs.forEach((log: any) => {
                const cat = log.task?.category || 'Geral';
                if (!categoryMap.has(cat)) categoryMap.set(cat, { category: cat, totalHours: 0 });
                categoryMap.get(cat).totalHours += (log.duration_seconds || 0) / 3600;
            });
            const categories = Array.from(categoryMap.values()).sort((a: any, b: any) => b.totalHours - a.totalHours);

            return {
                hierarchy,
                timeline,
                categories
            };

        } catch (err) {
            console.error('ReportService Error:', err);
            throw err;
        }
    }
};
