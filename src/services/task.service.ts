import { supabase } from '../lib/supabase';

// Types
export interface Task {
    id: string;
    task_number: number;
    title: string;
    description?: string;
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date?: string;
    project_id?: string;
    client_id?: string;
    created_by?: string;
    assignee_id?: string;
    team_id?: string;
    column_id?: string;
    workflow_id?: string;
    estimated_time?: number; // Hours
    category?: string;
    tags?: string[];
    position?: number; // <--- NEW
    created_at: string;
    // Expanded fields for UI
    board_ids?: string[]; // Virtual field for Multi-Board
    project?: { name: string; client_id?: string; board_id?: string; team_id?: string; client?: { name: string } };
    client?: { name: string };
    assignee?: { full_name: string; email: string; avatar_url?: string };
    task_assignees?: { user_id: string; completed_at?: string }[];
    comments_count?: number; // Virtual field often joined
    attachments?: any[];
    is_continuous?: boolean;
}

export type CreateTaskDTO = Omit<Task, 'id' | 'task_number' | 'created_at' | 'project' | 'assignee' | 'comments_count' | 'task_assignees' | 'board_ids'> & {
    created_by?: string;
    workflow_id?: string | null;
    board_ids?: string[]; // Explicitly allow board_ids in DTO
};
export type UpdateTaskDTO = Partial<Omit<Task, 'id' | 'task_number' | 'created_at' | 'project' | 'assignee' | 'comments_count' | 'task_assignees'>>;

// Helpers
function mapTaskError(error: Error | null): Error | null {
    if (!error) return null;
    const message = error.message.toLowerCase();

    if (message.includes('permission denied')) return new Error('Você não tem permissão para gerenciar tarefas.');

    // More specific foreign key error messages
    if (message.includes('foreign key constraint')) {
        if (message.includes('created_by') || message.includes('assignee_id')) {
            return new Error('Erro: Usuário não encontrado na tabela de perfis. Por favor, faça logout e login novamente.');
        }
        if (message.includes('project_id')) {
            return new Error('Erro: Projeto selecionado não encontrado.');
        }
        if (message.includes('client_id')) {
            return new Error('Erro: Cliente selecionado não encontrado.');
        }
        return new Error('Erro: Dados associados não encontrados. Verifique os campos selecionados.');
    }

    if (message.includes('duplicate key')) return new Error('Dados duplicados detectados.');

    return new Error(`Erro na operação: ${error.message}`);
}

export const taskService = {
    async getTasks(filters?: { assigneeId?: string; projectId?: string; teamId?: string; boardId?: string; clientId?: string }): Promise<{ data: Task[] | null; error: Error | null }> {
        let clientProjectIds: string[] | null = null;

        // 1. Resolve Client Context (Many-to-Many via client_projects)
        // This overrides Member Context as per user request (Super Filter)
        if (filters?.clientId) {

            const { data } = await supabase
                .from('client_projects')
                .select('project_id')
                .eq('client_id', filters.clientId);

            clientProjectIds = data?.map(d => d.project_id) || [];
        }

        // 2. Resolve Scope (Board or Team) to Users
        // REMOVED: Member-based filtering is unreliable for strict segregation.
        // We now filter strictly by Project-Board relationship.

        // 3. Build Query - FIXED
        // Used 'project:projects(name, team_id)' instead of !inner to avoid excluding tasks without projects if getting all
        let query = supabase
            .from('tasks')
            .select(`
                *,
                client_id,
                project:projects(name, team_id),
                assignee:users!tasks_assignee_id_fkey(full_name, email, avatar_url),
                task_assignees(user_id, completed_at),
                task_boards(board_id)
            `)
            .order('position', { ascending: true });

        // 4. Apply Filters

        // STRICT BOARD FILTER (Golden Rule)
        if (filters?.boardId) {
            query = supabase
                .from('tasks')
                .select(`
                    *,
                    client_id,
                    project:projects(name, team_id),
                    assignee:users!tasks_assignee_id_fkey(full_name, email, avatar_url),
                    task_assignees(user_id, completed_at),
                    task_boards!inner(board_id) 
                `)
                .eq('task_boards.board_id', filters.boardId)
                .order('position', { ascending: true });
        }

        // STRICT TEAM FILTER
        if (filters?.teamId) {
            // Check if task is assigned directly to team OR via project logic?
            // User requested: "Task selects Team". If task.team_id exists (it does in schema line 16), filter by it.
            // If task.team_id is null, maybe fallback to project.team_id? 
            // For now, let's assume filtering by the task's explicitly set team if the column exists, 
            // BUT wait, looking at schema in comments (line 16: team_id?). 
            // If the column exists on task, use strict equality.
            query = query.eq('team_id', filters.teamId);
        }

        if (filters?.clientId) {
            if (clientProjectIds && clientProjectIds.length > 0) {
                // If specific project not selected, show all tasks from client's projects
                if (!filters.projectId) {
                    query = query.in('project_id', clientProjectIds);
                }
            } else {
                // Client has no projects linked -> Show no tasks
                if (!filters.projectId) return { data: [], error: null };
            }
        }

        // Project Drill-down
        if (filters?.projectId) query = query.eq('project_id', filters.projectId);

        // Assignee Filter
        if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId);

        const { data, error } = await query;
        if (error) return { data: [], error: mapTaskError(error) };

        // DEBUG: Check Client Data - ENHANCED
        // if (data && data.length > 0) {
        //     console.log("=== KANBAN DEBUG: First Task ===");
        //     console.log("Full Task Object:", JSON.stringify(data[0], null, 2));
        // }

        const tasks = data?.map((t: any) => ({
            ...t,
            board_ids: t.task_boards?.map((tb: any) => tb.board_id) || []
        })) || [];

        return { data: tasks as Task[], error: null };
    },

    async createTask(task: CreateTaskDTO & { board_ids?: string[] }): Promise<{ data: Task | null; error: Error | null }> {
        // Separate board_ids from the rest of the task data
        const { board_ids, ...taskData } = task;

        // Auto-assign position just in case (though DB default or specific logic might better)
        // For now relying on DB to handle null or client to send it if needed. 
        // Or we can query max position? Nah, let's keep it simple. DB migration filled existing.
        // New tasks could be 0 or Max. Ideally 'top' implies min or max.
        // Let's assume frontend sets it or backend default.

        const { data, error } = await supabase
            .from('tasks')
            .insert(taskData as any)
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email),
                task_assignees(user_id, completed_at)
            `)
            .single();

        if (data && board_ids && board_ids.length > 0) {
            const boardLinks = board_ids.map(bid => ({
                task_id: data.id,
                board_id: bid
            }));
            const { error: linkError } = await supabase.from('task_boards').insert(boardLinks);
            if (linkError) console.error('Error linking boards:', linkError);
        }

        return { data: data as Task, error: mapTaskError(error) };
    },

    async updateTask(id: string, updates: UpdateTaskDTO & { board_ids?: string[] }): Promise<{ data: Task | null; error: Error | null }> {
        // Separate board_ids from the rest
        const { board_ids, ...taskUpdates } = updates;

        const { data, error } = await supabase
            .from('tasks')
            .update(taskUpdates as any)
            .eq('id', id)
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email),
                task_assignees(user_id, completed_at)
            `)
            .single();

        // Handle Board updates if present
        if (!error && board_ids) {
            // 1. Delete existing
            await supabase.from('task_boards').delete().eq('task_id', id);
            // 2. Insert new
            if (board_ids.length > 0) {
                const links = board_ids.map(bid => ({ task_id: id, board_id: bid }));
                await supabase.from('task_boards').insert(links);
            }
        }

        return { data: data as Task, error: mapTaskError(error) };
    },

    async deleteTask(id: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        return { error: mapTaskError(error) };
    },

    // Batch update for Drag & Drop (Status changes primarily, but structure allows position if DB supports)
    async updateTasksBatch(updates: { id: string; status?: string; position?: number }[]): Promise<{ error: Error | null }> {
        try {
            const promises = updates.map(u => {
                const patch: any = {};
                if (u.status) patch.status = u.status;
                if (u.position !== undefined) patch.position = u.position; // <--- NEW: Support position update

                if (Object.keys(patch).length === 0) return Promise.resolve({ error: null });

                return supabase
                    .from('tasks')
                    .update(patch)
                    .eq('id', u.id);
            });

            const results = await Promise.all(promises);
            const error = results.find(r => r.error)?.error;

            if (error) throw error;

            return { error: null };
        } catch (error: any) {
            return { error: mapTaskError(error) };
        }
    },

    async getTaskById(id: string): Promise<{ data: Task | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email),
                task_assignees(user_id, completed_at)
            `)
            .eq('id', id)
            .single();

        // Get Boards
        const { data: boardLinks } = await supabase
            .from('task_boards')
            .select('board_id')
            .eq('task_id', id);

        const taskWithBoards = data ? {
            ...data,
            board_ids: boardLinks?.map(b => b.board_id) || []
        } : null;

        return { data: taskWithBoards as any, error: mapTaskError(error) };
    },

    async getTaskByNumber(taskNumber: string): Promise<{ data: Task | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email),
                task_assignees(user_id, completed_at)
            `)
            .eq('task_number', taskNumber)
            .single();

        if (!data) return { data: null, error: mapTaskError(error) };

        const { data: boardsData } = await supabase.from('task_boards').select('board_id').eq('task_id', data.id);

        return {
            data: { ...data, board_ids: boardsData?.map(b => b.board_id) || [] } as any,
            error: null
        };
    },

    async assignUsersToTask(taskId: string, userIds: string[]): Promise<{ error: Error | null }> {
        try {
            // First, clear existing (simple strategy)
            const { error: deleteError } = await supabase
                .from('task_assignees')
                .delete()
                .eq('task_id', taskId);

            if (deleteError) throw deleteError;

            if (userIds.length > 0) {
                const records = userIds.map(userId => ({
                    task_id: taskId,
                    user_id: userId
                }));

                const { error: insertError } = await supabase
                    .from('task_assignees')
                    .insert(records);

                if (insertError) throw insertError;
            }

            return { error: null };
        } catch (error: any) {
            return { error: mapTaskError(error) };
        }
    },

    async startTimer(taskId: string, userId: string): Promise<{ data: any | null; error: Error | null }> {
        try {
            const now = new Date().toISOString();

            // 1. Check/Stop active timer (Atomic-like Auto-Switch)
            const { data: activeLogs } = await supabase
                .from('time_logs')
                .select('id')
                .eq('user_id', userId)
                .is('end_time', null)
                .limit(1);

            const activeLog = activeLogs && activeLogs.length > 0 ? activeLogs[0] : null;

            if (activeLog) {
                const { error: stopError } = await supabase
                    .from('time_logs')
                    .update({ end_time: now })
                    .eq('id', activeLog.id);

                if (stopError) throw stopError;
            }

            // 2. Start new timer
            const { data: newLog, error: startError } = await supabase
                .from('time_logs')
                .insert({
                    user_id: userId,
                    task_id: taskId,
                    start_time: now
                })
                .select()
                .single();

            if (startError) throw startError;

            // 3. Update task status to IN_PROGRESS
            await supabase.from('tasks').update({ status: 'IN_PROGRESS' }).eq('id', taskId);

            return { data: newLog, error: null };
        } catch (error: any) {
            return { data: null, error: mapTaskError(error) };
        }
    },

    async stopTimer(userId: string): Promise<{ error: Error | null }> {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('time_logs')
                .update({ end_time: now })
                .eq('user_id', userId)
                .is('end_time', null);

            return { error: mapTaskError(error) };
        } catch (error: any) {
            return { error: mapTaskError(error) };
        }
    },

    async uploadAttachment(taskId: string, file: File): Promise<{ data: any | null; error: Error | null }> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicData } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(fileName);

            const attachment = {
                id: crypto.randomUUID(),
                name: file.name,
                path: fileName,
                url: publicData.publicUrl,
                type: file.type,
                size: file.size,
                uploaded_at: new Date().toISOString()
            };

            // Fetch current attachments to append
            const { data: task, error: fetchError } = await supabase
                .from('tasks')
                .select('attachments')
                .eq('id', taskId)
                .single();

            if (fetchError) throw fetchError;

            const currentAttachments = (task?.attachments as any[]) || [];
            const newAttachments = [...currentAttachments, attachment];

            const { error: updateError } = await supabase
                .from('tasks')
                .update({ attachments: newAttachments } as any)
                .eq('id', taskId);

            if (updateError) throw updateError;

            return { data: attachment, error: null };
        } catch (error: any) {
            return { data: null, error: mapTaskError(error) };
        }
    }
};
