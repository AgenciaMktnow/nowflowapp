import { supabase } from '../lib/supabase';

export interface Team {
    id: string;
    name: string;
    initials?: string;
    color?: string;
    text_color?: string;
    created_at: string;
}

function mapTeamError(error: Error | null): Error | null {
    if (!error) return null;
    const message = error.message.toLowerCase();

    if (message.includes('permission denied')) return new Error('Permissão negada para gerenciar equipes.');
    if (message.includes('duplicate key')) return new Error('Já existe uma equipe com este nome.');

    return new Error('Erro ao processar operação da equipe.');
}

export const teamService = {
    async getTeams(): Promise<{ data: Team[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('name');

        return { data: data as Team[], error: mapTeamError(error) };
    },

    async createTeam(team: Omit<Team, 'id' | 'created_at'>): Promise<{ data: Team | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('teams')
            .insert(team as any)
            .select()
            .single();

        return { data: data as Team, error: mapTeamError(error) };
    },

    async updateTeam(id: string, updates: Partial<Team>): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('teams')
            .update(updates as any)
            .eq('id', id);

        return { error: mapTeamError(error) };
    },

    async getTeamMembers(teamId: string): Promise<{ data: any[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('user_teams')
            .select('user:users(*)')
            .eq('team_id', teamId);

        if (error) return { data: null, error: mapTeamError(error) };
        const members = data.map((d: any) => d.user);
        return { data: members, error: null };
    },

    async addMember(teamId: string, userId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('user_teams')
            .insert({ team_id: teamId, user_id: userId });
        return { error: mapTeamError(error) };
    },

    async removeMember(teamId: string, userId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('user_teams')
            .delete()
            .match({ team_id: teamId, user_id: userId });
        return { error: mapTeamError(error) };
    },

    async deleteTeam(id: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', id);

        return { error: mapTeamError(error) };
    },

    async getTeamHealth(teamId: string): Promise<{ health: { completionRate: number; overdueCount: number; totalTasks: number } | null; error: Error | null }> {
        try {
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('status, due_date')
                .eq('team_id', teamId);

            if (error) throw error;
            if (!tasks) return { health: { completionRate: 0, overdueCount: 0, totalTasks: 0 }, error: null };

            const total = tasks.length;
            if (total === 0) return { health: { completionRate: 100, overdueCount: 0, totalTasks: 0 }, error: null };

            const done = tasks.filter(t => t.status === 'DONE').length;
            const now = new Date();
            const overdue = tasks.filter(t => t.status !== 'DONE' && t.due_date && new Date(t.due_date) < now).length;

            return {
                health: {
                    completionRate: Math.round((done / total) * 100),
                    overdueCount: overdue,
                    totalTasks: total
                },
                error: null
            };
        } catch (error: any) {
            return { health: null, error: mapTeamError(error) };
        }
    },

    // Duplicate method removed

};
