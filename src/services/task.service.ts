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
    created_at: string;
    // Expanded fields for UI
    project?: { name: string; client_id?: string; board_id?: string; team_id?: string; client?: { name: string } };
    client?: { name: string };
    assignee?: { full_name: string; email: string; avatar_url?: string };
    task_assignees?: { user_id: string }[];
    comments_count?: number; // Virtual field often joined
    attachments?: any[];
}

export type CreateTaskDTO = Omit<Task, 'id' | 'task_number' | 'created_at' | 'project' | 'assignee' | 'comments_count' | 'task_assignees'> & { created_by?: string; workflow_id?: string | null };
export type UpdateTaskDTO = Partial<Omit<Task, 'id' | 'task_number' | 'created_at' | 'project' | 'assignee' | 'comments_count' | 'task_assignees'>>;

// Helpers
function mapTaskError(error: Error | null): Error | null {
    if (!error) return null;
    const message = error.message.toLowerCase();

    if (message.includes('permission denied')) return new Error('Você não tem permissão para gerenciar tarefas.');
    if (message.includes('foreign key constraint')) return new Error('Projeto ou usuário associado não encontrado.');
    if (message.includes('duplicate key')) return new Error('Dados duplicados detectados.');

    return new Error(`Erro na operação: ${error.message}`);
}

export const taskService = {
    async getTasks(filters?: { assigneeId?: string; projectId?: string; teamId?: string; boardId?: string; clientId?: string }): Promise<{ data: Task[] | null; error: Error | null }> {
        let memberIds: string[] | null = null;
        let useMemberFilter = true;
        let clientProjectIds: string[] | null = null;

        // 1. Resolve Client Context (Many-to-Many via client_projects)
        // This overrides Member Context as per user request (Super Filter)
        if (filters?.clientId) {
            useMemberFilter = false;

            const { data } = await supabase
                .from('client_projects')
                .select('project_id')
                .eq('client_id', filters.clientId);

            clientProjectIds = data?.map(d => d.project_id) || [];
        }

        // 2. Resolve Scope (Board or Team) to Users
        if (useMemberFilter) {
            if (filters?.boardId) {
                const { data } = await supabase.from('board_members').select('user_id').eq('board_id', filters.boardId);
                memberIds = data?.map(d => d.user_id) || [];
            } else if (filters?.teamId) {
                const { data } = await supabase.from('user_teams').select('user_id').eq('team_id', filters.teamId);
                memberIds = data?.map(d => d.user_id) || [];
            }
        }

        // 3. Build Query
        // Use standard join for project (we filter by project_id directly if needed)
        let query = supabase
            .from('tasks')
            .select(`
                *,
                client:client_id(name),
                project:projects (
                    name,
                    client_id,
                    team_id,
                    board_id,
                    client:client_id(name),
                    board:boards(color)
                ),
                assignee:users!tasks_assignee_id_fkey(full_name, email, avatar_url)
            `)
            .order('created_at', { ascending: false });

        // 4. Apply Filters
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
        else if (memberIds !== null) {
            // Scope Filter (Board/Team) using Members
            if (memberIds.length === 0) {
                return { data: [], error: null };
            }
            query = query.or(`assignee_id.in.(${memberIds.join(',')}),created_by.in.(${memberIds.join(',')})`);
        }

        // Project Drill-down
        if (filters?.projectId) query = query.eq('project_id', filters.projectId);

        // Assignee Filter
        if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId);

        const { data, error } = await query;
        return { data: data as Task[], error: mapTaskError(error) };
    },

    async createTask(task: CreateTaskDTO): Promise<{ data: Task | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task as any) // Supabase types sometimes strict with optionals
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email)
            `)
            .single();

        return { data: data as Task, error: mapTaskError(error) };
    },

    async updateTask(id: string, updates: UpdateTaskDTO): Promise<{ data: Task | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates as any)
            .eq('id', id)
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email)
            `)
            .single();

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
                task_assignees(user_id)
            `)
            .eq('id', id)
            .single();

        return { data: data as any, error: mapTaskError(error) };
    },

    async getTaskByNumber(taskNumber: string): Promise<{ data: Task | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                project:projects(name),
                assignee:users!tasks_assignee_id_fkey(full_name, email),
                task_assignees(user_id)
            `)
            .eq('task_number', taskNumber)
            .single();

        return { data: data as any, error: mapTaskError(error) };
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
