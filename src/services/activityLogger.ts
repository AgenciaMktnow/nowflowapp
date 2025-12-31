
import { supabase } from '../lib/supabase';

export type ActivityType =
    | 'STATUS_CHANGE'
    | 'COMMENT'
    | 'TIMER_START'
    | 'TIMER_STOP'
    | 'ATTACHMENT_ADD'
    | 'ATTACHMENT_REMOVE'
    | 'ASSIGNEE_CHANGE'
    | 'CHECKLIST_COMPLETE'
    | 'CHECKLIST_UNCOMPLETE'
    | 'RETURN_TASK'
    | 'HANDOVER'
    | 'PRIORITY_CHANGE'
    | 'DUE_DATE_CHANGE'
    | 'MANUAL_TIME';

export const logActivity = async (
    taskId: string,
    userId: string,
    type: ActivityType,
    content?: string,
    metadata?: any
) => {
    try {
        const { error } = await supabase
            .from('task_activities')
            .insert({
                task_id: taskId,
                user_id: userId,
                activity_type: type,
                content: content,
                metadata: metadata || {}
            });

        if (error) {
            console.error('Error logging activity:', error);
        }
    } catch (err) {
        console.error('Exception logging activity:', err);
    }
};
