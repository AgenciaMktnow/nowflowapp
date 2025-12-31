
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
            const startIso = filters.startDate.toISOString();
            const endIso = filters.endDate.toISOString();

            // 1. Fetch Time Logs with Task and User details
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
                        client:clients(name)
                    )
                `)
                .gte('start_time', startIso)
                .lte('start_time', endIso);

            // Apply Team Filter (requires joined table logic, or client-side filter if not relational)
            // 'users' relation above fetches user details. 
            // If filtering by team, we might need a separate filter or join on user_teams.
            // For simplicity/performance, let's fetch all (or filtered by user list passed in?)
            // The UI usually filters users first.
            // Let's assume we fetch broadly and filter in memory for complex team logic, 
            // OR use !inner join if possible. 
            // Given Supabase usage so far, filtering in memory for small teams is safer than complex PostgREST syntax guessing.

            const { data: logs, error } = await query;

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            // Removed debug log to reduce console noise in production
            // console.log('Raw Logs from Supabase:', logs?.length, logs?.[0]);

            if (!logs) return { traceability: [], fidelity: [], timeline: [], categories: [] };

            // Client Side Filtering (if needed for exact IDs)
            const filteredLogs = logs.filter((log: any) => {
                if (filters.clientId && log.task?.client_id !== filters.clientId) return false;
                if (filters.userId && log.user_id !== filters.userId) return false;
                // Team filtering would happen if we fetched users teams. 
                // We'll trust the UI passes the right context or we filter later.
                return true;
            });

            // --- Hierarchical Aggregation (User -> Client -> Task) ---
            const userMap = new Map<string, any>();

            filteredLogs.forEach((log: any) => {
                const userId = log.user_id;
                // Allow processing even if task is missing (orphan log)
                if (!userId) return;

                if (!userMap.has(userId)) {
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
                // Fallback for missing task/client
                const clientId = log.task?.client_id || 'no-client';
                const clientName = log.task?.client?.name || (log.task ? 'Sem Cliente' : 'Item Removido/Desconhecido');

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
                const taskId = log.task?.id || 'no-task-' + log.id; // unique fallback if no task
                const taskTitle = log.task?.title || 'Sem Título / Removida';
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

            // Timeline for Heatmap (Separate, optional but good to keep if user opens chart)
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
