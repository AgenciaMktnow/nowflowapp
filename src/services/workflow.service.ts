import { supabase } from '../lib/supabase';

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps?: any;
    created_at: string;
}

function mapWorkflowError(error: Error | null): Error | null {
    if (!error) return null;
    return new Error(`Erro de fluxo: ${error.message}`);
}

export const workflowService = {
    async getWorkflows(): Promise<{ data: Workflow[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('workflows')
            .select('*')
            .order('name');

        return { data: data as Workflow[], error: mapWorkflowError(error) };
    }
};
