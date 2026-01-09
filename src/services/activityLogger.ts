
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
        // Prepare details JSON
        const details = {
            ...metadata,
            content_snippet: content // Store raw content if needed for fallback
        };

        const { error } = await supabase
            .from('task_activities')
            .insert({
                task_id: taskId,
                user_id: userId,
                action_type: type, // Now using the correct new column
                details: details   // Using the JSONB details column
            });

        if (error) {
            console.error('Error logging activity:', error);
        }
    } catch (err) {
        console.error('Exception logging activity:', err);
    }
};
