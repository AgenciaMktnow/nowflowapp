import { supabase } from '../lib/supabase';


// Types
export interface Project {
    id: string;
    name: string;
    client_id?: string;
    team_id?: string;
    board_id?: string;
    created_at: string;
    team?: {
        name: string;
        color?: string;
    };
    board?: {
        id: string;
        name: string;
        color: string;
    };
}

export interface Column {
    id: string;
    title: string;
    statuses: string[];
    variant: 'default' | 'progress' | 'review' | 'done';
    countColor: string;
    position: number;
    created_at?: string;
}

// Helpers
function mapProjectError(error: Error | null): Error | null {
    if (!error) return null;
    const message = error.message.toLowerCase();

    if (message.includes('duplicate key')) return new Error('Já existe um item com este nome.');
    if (message.includes('permission denied')) return new Error('Você não tem permissão para realizar esta ação.');

    return new Error('Ocorreu um erro. Tente novamente.');
}

export const projectService = {
    // --- Projects ---

    async getProjects(): Promise<{ data: Project[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                team:teams(name, color),
                board:boards(id, name, color)
            `)
            .order('created_at', { ascending: false });

        return { data: data as any, error: mapProjectError(error) };
    },

    async createProject(project: {
        name: string;
        client_id?: string;
        team_id: string;
        board_id?: string;
        description?: string;
        start_date?: string;
        end_date?: string;
        status?: string;
        priority?: string;
        manager_id?: string;
    }): Promise<{ data: Project | null; error: Error | null }> {
        // 1. Check if Project Name already exists (Service Catalog logic)
        const { data: existing } = await supabase
            .from('projects')
            .select('*')
            .eq('name', project.name)
            .single();

        if (existing) {
            // "Upsert" logic: If redundant creation attempted for same name, just link/return existing.
            // Note: We are ignoring different client_id here because projects are now Global Service Types.
            return { data: existing as unknown as Project, error: null };
        }

        // 2. Insert new if distinct
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: project.name,
                client_id: project.client_id, // Might be null for global services
                team_id: project.team_id,
                board_id: project.board_id,
                description: project.description,
                start_date: project.start_date,
                end_date: project.end_date,
                status: project.status?.toUpperCase() || 'PLANNING',
                priority: project.priority?.toUpperCase() || 'MEDIUM',
                manager_id: project.manager_id
            })
            .select()
            .single();

        return { data: data as unknown as Project, error: mapProjectError(error) };
    },

    async updateProject(id: string, name: string, boardId?: string, teamId?: string): Promise<{ error: Error | null }> {
        const updates: any = { name };
        if (boardId) updates.board_id = boardId;
        if (teamId) updates.team_id = teamId;

        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id);

        return { error: mapProjectError(error) };
    },

    async deleteProject(id: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        return { error: mapProjectError(error) };
    },

    // --- Columns ---

    // --- Columns (Dynamic per Project) ---

    async getProjectColumns(projectId: string): Promise<{ data: Column[] | null; error: Error | null }> {
        const defaultColumns: Column[] = [
            { id: 'default-1', title: 'A Fazer', variant: 'default', countColor: 'bg-background-dark text-text-muted-dark', position: 0, statuses: ['TODO', 'BACKLOG'] },
            { id: 'default-2', title: 'Em Andamento', variant: 'progress', countColor: 'bg-primary/20 text-green-300', position: 1, statuses: ['IN_PROGRESS'] },
            { id: 'default-3', title: 'Em Revisão', variant: 'review', countColor: 'bg-background-dark text-text-muted-dark', position: 2, statuses: ['WAITING_CLIENT', 'REVIEW'] },
            { id: 'default-4', title: 'Concluído', variant: 'done', countColor: 'bg-primary/10 text-primary', position: 3, statuses: ['DONE'] }
        ];

        try {
            const { data, error } = await supabase
                .from('project_columns')
                .select('*')
                .eq('project_id', projectId)
                .order('position', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedData = data.map(col => ({
                    id: col.id,
                    title: col.title,
                    position: col.position,
                    variant: col.variant,
                    countColor: col.count_color,
                    statuses: getStatusesForVariant(col.variant)
                }));
                return { data: mappedData as Column[], error: null };
            }

            // If no error but no data, return defaults (and maybe seed them in background?)
            return { data: defaultColumns, error: null };

        } catch (error) {
            console.error('Error fetching columns (using defaults):', error);
            // FAIL-SAFE: Return defaults so the UI never dies
            return { data: defaultColumns, error: null };
        }
    },

    async createProjectColumn(projectId: string, column: Omit<Column, 'id' | 'created_at' | 'statuses'>): Promise<{ data: Column | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('project_columns')
            .insert({
                project_id: projectId,
                title: column.title,
                position: column.position,
                variant: column.variant,
                count_color: column.countColor
            })
            .select()
            .single();

        if (data) {
            return {
                data: {
                    ...data,
                    countColor: data.count_color,
                    statuses: getStatusesForVariant(data.variant)
                } as Column, error: null
            };
        }
        return { data: null, error: mapProjectError(error) };
    },

    async updateProjectColumn(id: string, updates: Partial<Column>): Promise<{ error: Error | null }> {
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.position !== undefined) dbUpdates.position = updates.position;
        if (updates.variant) dbUpdates.variant = updates.variant;
        if (updates.countColor) dbUpdates.count_color = updates.countColor;

        const { error } = await supabase
            .from('project_columns')
            .update(dbUpdates)
            .eq('id', id);

        return { error: mapProjectError(error) };
    },

    async deleteProjectColumn(id: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('project_columns')
            .delete()
            .eq('id', id);

        return { error: mapProjectError(error) };
    },

    async updateProjectColumnPositions(updates: { id: string; position: number }[]): Promise<{ error: Error | null }> {
        try {
            for (const update of updates) {
                const { error } = await supabase
                    .from('project_columns')
                    .update({ position: update.position })
                    .eq('id', update.id);
                if (error) throw error;
            }
            return { error: null };
        } catch (error: any) {
            return { error: mapProjectError(error) };
        }
    },

    async seedProjectColumns(projectId: string): Promise<{ data: Column[] | null; error: Error | null }> {
        const defaultColumns = [
            { title: 'A Fazer', variant: 'default', count_color: 'bg-background-dark text-text-muted-dark', position: 0 },
            { title: 'Em Andamento', variant: 'progress', count_color: 'bg-primary/20 text-green-300', position: 1 },
            { title: 'Em Revisão', variant: 'review', count_color: 'bg-background-dark text-text-muted-dark', position: 2 },
            { title: 'Concluído', variant: 'done', count_color: 'bg-primary/10 text-primary', position: 3 }
        ];

        const inserts = defaultColumns.map(col => ({
            project_id: projectId,
            ...col
        }));

        const { data, error } = await supabase
            .from('project_columns')
            .insert(inserts)
            .select();

        if (data) {
            const mapped = data.map(col => ({
                id: col.id,
                title: col.title,
                position: col.position,
                variant: col.variant,
                countColor: col.count_color,
                statuses: getStatusesForVariant(col.variant)
            }));
            return { data: mapped as Column[], error: null };
        }

        return { data: null, error: mapProjectError(error) };
    },

    // Legacy (Global) - Keeping for fallback or removal
    async getColumns(): Promise<{ data: Column[] | null; error: Error | null }> {
        // ... (can be deprecated)
        return { data: [], error: null };
    },
    async seedDefaultColumns(): Promise<{ data: Column[] | null; error: Error | null }> {
        return { data: [], error: null };
    }
};

function getStatusesForVariant(variant: string): string[] {
    switch (variant) {
        case 'done': return ['DONE'];
        case 'review': return ['WAITING_CLIENT', 'REVIEW'];
        case 'progress': return ['IN_PROGRESS'];
        case 'default': default: return ['TODO', 'BACKLOG'];
    }
}
