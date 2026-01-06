import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export const useTaskActions = () => {
    const [loading, setLoading] = useState(false);
    const { user, userProfile } = useAuth(); // Assuming useAuth provides userProfile with role

    const deleteTask = async (taskId: string, onSuccess?: () => void) => {
        if (!taskId) return;

        // Security check (Double validation, though UI should hide it)
        if (userProfile?.role !== 'ADMIN') {
            toast.error('Apenas administradores podem excluir tarefas.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);

            if (error) throw error;

            toast.success('Tarefa excluída com sucesso');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Error deleting task:', error);
            toast.error(error.message || 'Erro ao excluir tarefa');
        } finally {
            setLoading(false);
        }
    };

    const cloneTask = async (task: any, onSuccess?: (newTask: any) => void) => {
        if (!task || !user) return;
        setLoading(true);

        try {
            // 1a. Fetch relations explicitly to ensure we have them (ListViews might not fetch deep relations)
            const { data: originalRelations } = await supabase
                .from('tasks')
                .select(`
                    id,
                    task_boards(board_id),
                    task_assignees(user_id)
                `)
                .eq('id', task.id)
                .single();

            // 1. Prepare Base Data
            const cloneData: any = {
                title: `${task.title} (Cópia)`,
                priority: task.priority,
                created_by: user.id,
                description: task.description,
                client_id: task.client?.id || task.client_id,
                project_id: task.project?.id || task.project_id,
                workflow_id: task.workflow?.id || task.workflow_id,
                status: 'BACKLOG',
                due_date: task.due_date,
                tags: task.tags
            };

            // 2. Insert New Task
            const { data: newTask, error } = await supabase
                .from('tasks')
                .insert([cloneData])
                .select()
                .single();

            if (error) throw error;
            if (!newTask) throw new Error('Falha ao criar tarefa.');

            // 3. Insert Relations

            // 3a. Boards
            // Combine DB results with task props as fallback
            const dbBoardIds = originalRelations?.task_boards?.map((tb: any) => tb.board_id) || [];
            const propBoardIds = task.board_ids || (task.project?.board_id ? [task.project.board_id] : []) || [];

            // Deduplicate
            const boardsToLink = Array.from(new Set([...dbBoardIds, ...propBoardIds]));

            if (boardsToLink.length > 0) {
                const boardRows = boardsToLink.map((bid: string) => ({
                    task_id: newTask.id,
                    board_id: bid
                }));
                const { error: boardError } = await supabase.from('task_boards').insert(boardRows);
                if (boardError) console.error('Error inserting cloned boards:', boardError);
            }

            // 3b. Assignees
            const dbAssigneeIds = originalRelations?.task_assignees?.map((ta: any) => ta.user_id) || [];
            const propAssigneeIds = task.task_assignees?.map((ta: any) => ta.user_id || ta.user?.id)
                || task.assignees?.map((a: any) => a.id)
                || (task.assignee_id ? [task.assignee_id] : [])
                || [];

            const assigneesToLink = Array.from(new Set([...dbAssigneeIds, ...propAssigneeIds])).filter(Boolean);

            if (assigneesToLink.length > 0) {
                const assigneeRows = assigneesToLink.map((uid: string) => ({
                    task_id: newTask.id,
                    user_id: uid
                }));
                const { error: assigneeError } = await supabase.from('task_assignees').insert(assigneeRows);
                if (assigneeError) console.error('Error inserting cloned assignees:', assigneeError);
            }

            // 4. System Comment
            await supabase.from('task_comments').insert([{
                task_id: newTask.id,
                user_id: user.id,
                content: `🔄 **Tarefa Clonada**\n\nEsta tarefa foi originada a partir da tarefa #${task.task_number}.`
            }]);

            toast.success('Tarefa clonada com sucesso!');
            if (onSuccess) onSuccess(newTask);

        } catch (error: any) {
            console.error('Error cloning task:', error);
            toast.error(`Erro ao clonar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return {
        deleteTask,
        cloneTask,
        loading
    };
};
