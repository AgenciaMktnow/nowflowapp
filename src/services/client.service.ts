import { supabase } from '../lib/supabase';

export interface Client {
    id: string;
    name: string;
    email?: string; // Inferring common fields, though not strict in DB types above, often in clients table
    status: 'ACTIVE' | 'INACTIVE';
    created_at: string;
    project_ids?: string[];
}

function mapClientError(error: Error | null): Error | null {
    if (!error) return null;
    return new Error(`Erro de cliente: ${error.message}`);
}

export const clientService = {
    async getClients(): Promise<{ data: Client[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('clients')
            .select(`
                *,
                client_projects!client_projects_client_id_fkey (project_id)
            `)
            .eq('status', 'ACTIVE')
            .order('name');

        const mappedData = data?.map((c: any) => ({
            ...c,
            project_ids: c.client_projects?.map((cp: any) => cp.project_id) || []
        }));

        return { data: mappedData as any, error: mapClientError(error) };
    },

    async createClient(client: { name: string; email?: string }): Promise<{ data: Client | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('clients')
            .insert({ ...client, status: 'ACTIVE' })
            .select()
            .single();

        return { data: data as any, error: mapClientError(error) };
    }
};
