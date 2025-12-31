import { supabase } from '../lib/supabase';
import { type UserProfile } from './auth.service';

export interface Board {
    id: string;
    name: string;
    description?: string;
    color: string;
    created_at: string;
    active_projects_count?: number;
    members?: UserProfile[];
}

export const boardService = {
    async getBoards(): Promise<{ data: Board[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('boards')
            .select(`
                *,
                members:board_members(
                    user:users(*)
                ),
                projects:projects(count)
            `)
            .order('name');

        if (error) {
            console.error('Error fetching boards:', error);
            return { data: null, error };
        }

        const formattedData = data.map((board: any) => ({
            ...board,
            members: board.members.map((m: any) => m.user),
            active_projects_count: board.projects?.[0]?.count || 0 // Assuming simple count for now, filters to be refined if needed
        }));

        return { data: formattedData, error: null };
    },

    async createBoard(board: Partial<Board>, memberIds: string[]): Promise<{ data: Board | null; error: Error | null }> {
        // 1. Create Board
        const { data, error } = await supabase
            .from('boards')
            .insert([{
                name: board.name,
                description: board.description,
                color: board.color
            }])
            .select()
            .single();

        if (error) return { data: null, error };

        // 2. Add Members
        if (memberIds.length > 0) {
            const membersData = memberIds.map(userId => ({
                board_id: data.id,
                user_id: userId
            }));
            const { error: membersError } = await supabase
                .from('board_members')
                .insert(membersData);

            if (membersError) {
                console.error('Error adding members:', membersError);
                return { data, error: membersError }; // Return error even if board created
            }
        }

        return { data, error: null };
    },

    async updateBoard(boardId: string, updates: Partial<Board>, memberIds?: string[]): Promise<{ error: Error | null }> {
        // 1. Update Board Details
        const { error } = await supabase
            .from('boards')
            .update({
                name: updates.name,
                description: updates.description,
                color: updates.color
            })
            .eq('id', boardId);

        if (error) return { error };

        // 2. Sync Members (if provided)
        if (memberIds) {
            // Delete existing
            const { error: deleteError } = await supabase
                .from('board_members')
                .delete()
                .eq('board_id', boardId);

            if (deleteError) return { error: deleteError };

            // Insert new
            if (memberIds.length > 0) {
                const membersData = memberIds.map(userId => ({
                    board_id: boardId,
                    user_id: userId
                }));
                const { error: insertError } = await supabase
                    .from('board_members')
                    .insert(membersData);

                if (insertError) return { error: insertError };
            }
        }

        return { error: null };
    },

    async deleteBoard(boardId: string): Promise<{ error: Error | null }> {
        // Validation check for projects should be done in UI or via RLS/Trigger, but service can also check.
        // For now, rely on cascade or explicit check in UI.
        const { error } = await supabase
            .from('boards')
            .delete()
            .eq('id', boardId);

        return { error };
    },

    // --- Board Columns ---

    async getBoardColumns(boardId: string): Promise<{ data: Column[] | null; error: Error | null }> {
        const defaultColumns: Column[] = [
            { id: 'def-1', title: 'A Fazer', variant: 'default', countColor: 'bg-background-dark text-text-muted-dark', position: 0, statuses: ['TODO', 'BACKLOG'] },
            { id: 'def-2', title: 'Em Andamento', variant: 'progress', countColor: 'bg-primary/20 text-green-300', position: 1, statuses: ['IN_PROGRESS'] },
            { id: 'def-3', title: 'Em Revisão', variant: 'review', countColor: 'bg-background-dark text-text-muted-dark', position: 2, statuses: ['WAITING_CLIENT', 'REVIEW'] },
            { id: 'def-4', title: 'Concluído', variant: 'done', countColor: 'bg-primary/10 text-primary', position: 3, statuses: ['DONE'] }
        ];

        try {
            const { data, error } = await supabase
                .from('board_columns')
                .select('*')
                .eq('board_id', boardId)
                .order('position', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedData = data.map((col: any) => ({
                    id: col.id,
                    title: col.title,
                    position: col.position,
                    variant: col.variant,
                    countColor: col.count_color,
                    statuses: getStatusesForVariant(col.variant)
                }));
                return { data: mappedData, error: null };
            }
            return { data: defaultColumns, error: null };
        } catch (error) {
            console.error('Error fetching board columns:', error);
            // Fallback to defaults
            return { data: defaultColumns, error: null };
        }
    },

    async createBoardColumn(boardId: string, column: Omit<Column, 'id' | 'created_at' | 'statuses'>): Promise<{ data: Column | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('board_columns')
            .insert({
                board_id: boardId,
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
                    id: data.id,
                    title: data.title,
                    position: data.position,
                    variant: data.variant,
                    countColor: data.count_color,
                    statuses: getStatusesForVariant(data.variant)
                } as Column,
                error: null
            };
        }
        return { data: null, error };
    },

    async updateBoardColumn(id: string, updates: Partial<Column>): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('board_columns')
            .update({
                title: updates.title,
                variant: updates.variant,
                count_color: updates.countColor
            })
            .eq('id', id);
        return { error };
    },

    async deleteBoardColumn(id: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('board_columns')
            .delete()
            .eq('id', id);
        return { error };
    },

    async updateBoardColumnPositions(updates: { id: string; position: number }[]): Promise<{ error: Error | null }> {
        // Simple loop update for now
        for (const update of updates) {
            await supabase.from('board_columns').update({ position: update.position }).eq('id', update.id);
        }
        return { error: null };
    }
};

export interface Column {
    id: string;
    title: string;
    statuses: string[];
    variant: 'default' | 'progress' | 'review' | 'done';
    countColor: string;
    position: number;
}

function getStatusesForVariant(variant: string): string[] {
    switch (variant) {
        case 'default': return ['TODO', 'BACKLOG'];
        case 'progress': return ['IN_PROGRESS'];
        case 'review': return ['WAITING_CLIENT', 'REVIEW'];
        case 'done': return ['DONE'];
        default: return ['TODO'];
    }
}
