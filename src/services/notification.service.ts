import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    task_id?: string;
    task?: {
        task_number: number;
    };
    type: 'ASSIGNMENT' | 'MOVEMENT' | 'COMMENT' | 'MENTION';
    title: string;
    message: string;
    metadata?: any;
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async getNotifications(userId: string): Promise<{ data: Notification[] | null; error: Error | null }> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, task:tasks(task_number)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Reasonable limit for dropdown

        if (error) {
            console.error('Error fetching notifications:', error);
            return { data: null, error };
        }

        return { data: data as Notification[], error: null };
    },

    async markAsRead(notificationId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        return { error };
    },

    async markAllAsRead(userId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        return { error };
    },

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) return 0;
        return count || 0;
    },

    async clearAll(userId: string): Promise<{ error: Error | null }> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        return { error };
    }
};
