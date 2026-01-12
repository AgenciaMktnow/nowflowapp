import { supabase } from '../lib/supabase';

// Types mimicking the RPC return
export interface SaasMetric {
    org_id: string;
    org_name: string;
    plan_type: string;
    status: string;
    created_at: string;
    trial_ends_at: string | null;
    owner_email: string;
    user_count: number;
    board_count: number;
    task_count: number;
    tasks_last_7d: number;
    storage_size_mb: number;
}

export const adminService = {
    // 1. Get All SaaS Metrics
    async getSaasMetrics(): Promise<{ data: SaasMetric[] | null; error: Error | null }> {
        const { data, error } = await supabase.rpc('get_saas_metrics');

        if (error) {
            console.error('Error fetching SaaS metrics:', error);
            return { data: null, error };
        }

        return { data: data as SaasMetric[], error: null };
    },

    // 2. Update Plan / Status
    async updateOrgPlan(orgId: string, newPlan: string, newStatus: string): Promise<{ error: Error | null }> {
        const { error } = await supabase.rpc('admin_update_org_plan', {
            target_org_id: orgId,
            new_plan: newPlan,
            new_status: newStatus
        });

        if (error) {
            console.error('Error updating org plan:', error);
            return { error };
        }

        return { error: null };
    },

    // 3. Get Org Details (X-Ray)
    async getOrgDetails(orgId: string): Promise<{ data: any | null; error: Error | null }> {
        const { data, error } = await supabase.rpc('get_org_details', { target_org_id: orgId });
        if (error) {
            console.error('Error fetching org details:', error);
            return { data: null, error };
        }
        return { data, error: null };
    }
};
