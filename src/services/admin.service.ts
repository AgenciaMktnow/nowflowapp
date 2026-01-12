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
    max_users?: number;
    max_boards?: number;
    max_storage_mb?: number;
}

export interface OrgDetails {
    org_id: string;
    owner_email: string;
    plan_type: string;
    status: string;
    created_at: string;
    trial_ends_at: string | null;
    total_users: number;
    board_count: number;
    task_count: number;
    comment_count: number;
    db_rows: number;
    storage_mb: number;
    active_users_30d: number;
    estimated_cost: number;
    plan_value: number;
    profit_margin: number;
    recent_logs: any[];
    max_users?: number;
    max_boards?: number;
    max_storage_mb?: number;
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
    async getOrgDetails(orgId: string): Promise<{ data: OrgDetails | null; error: Error | null }> {
        const { data, error } = await supabase.rpc('get_org_details', { target_org_id: orgId });
        if (error) {
            console.error('Error fetching org details:', error);
            return { data: null, error };
        }
        return { data, error: null };
    }
};
