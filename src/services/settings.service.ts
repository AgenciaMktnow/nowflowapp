import { supabase } from '../lib/supabase';

export interface SystemSettings {
    id?: string;
    company_name: string;
    logo_dark_url: string;
    logo_light_url: string;
    business_hours_start: string;
    business_hours_end: string;
    work_days: string[];
    first_day_of_week: 'SUNDAY' | 'MONDAY';
    timezone: string;
    focus_goal_hours: number;
    daily_journey_hours: number;
    weekly_workload_hours?: number;
    theme_preference: 'DARK' | 'LIGHT';
    favicon_url?: string;
    // Auto-Pause Settings
    timer_auto_pause_enabled?: boolean;
    timer_max_hours?: number;
    timer_action?: 'PAUSE_AND_NOTIFY' | 'NOTIFY_ADMIN';
}

export const settingsService = {
    async getSettings() {
        // Since we expect a singleton, we fetch the first row.
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Error fetching settings:', error);
            return null;
        }

        return data as SystemSettings | null;
    },

    async updateSettings(settings: Partial<SystemSettings>) {
        // Try to update the existing row
        const { data: existing } = await supabase
            .from('system_settings')
            .select('id')
            .limit(1)
            .single();

        if (existing) {
            const { data, error } = await supabase
                .from('system_settings')
                .update(settings)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // First time setup - insert
            const { data, error } = await supabase
                .from('system_settings')
                .insert([settings])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    async uploadAsset(file: File, type: 'logo-dark' | 'logo-light' | 'favicon') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}-${Date.now()}.${fileExt}`;
        const filePath = `company-assets/${fileName}`; // Changed folder to better reflect usage

        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(filePath, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('public-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
