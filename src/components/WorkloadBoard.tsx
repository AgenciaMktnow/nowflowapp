import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';
import WorkloadColumn from './WorkloadColumn';
import { toast } from 'sonner';
import {
    applyWorkloadMove,
    groupWorkloadTasks,
    type WorkloadAssignment,
    type WorkloadTaskBase,
} from '../utils/workloadQueue';

interface WorkloadBoardProps {
    users: { id: string; full_name: string; avatar_url?: string }[];
    teamId?: string;
    onTaskClick: (task: WorkloadTask) => void;
}

type WorkloadTask = WorkloadTaskBase & {
    title: string;
    status: string;
    priority: string;
    due_date?: string | null;
    estimated_time?: number | null;
    is_continuous?: boolean;
    project?: { name: string; client?: { name: string } | null } | null;
    client?: { name: string } | null;
    task_assignees?: WorkloadAssignment[];
};

const activeStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW'];
const taskSelect = `
    id, task_number, title, status, priority, due_date, estimated_time,
    is_continuous, assignee_id, position, queue_position,
    project:projects(name, client:clients(name)),
    task_assignees(user_id, queue_position, completed_at)
`;

export default function WorkloadBoard({ users, teamId, onTaskClick }: WorkloadBoardProps) {
    const [allTasks, setAllTasks] = useState<WorkloadTask[]>([]);
    const [loading, setLoading] = useState(true);
    const userIdsKey = users.map(user => user.id).sort().join(',');

    const loadTasks = useCallback(async () => {
        const userIds = userIdsKey ? userIdsKey.split(',') : [];
        setLoading(true);

        try {
            if (!teamId && userIds.length === 0) {
                setAllTasks([]);
                return;
            }

            const rawTasks: WorkloadTask[] = [];

            if (teamId) {
                const { data, error } = await supabase
                    .from('tasks')
                    .select(`${taskSelect}, project_filter:projects!inner(team_id)`)
                    .in('status', activeStatuses)
                    .eq('project_filter.team_id', teamId);

                if (error) throw error;
                rawTasks.push(...((data || []) as unknown as WorkloadTask[]));
            }

            if (userIds.length > 0) {
                const { data: assignmentRows, error: assignmentError } = await supabase
                    .from('task_assignees')
                    .select('task_id')
                    .in('user_id', userIds)
                    .is('completed_at', null);

                if (assignmentError) throw assignmentError;

                const assignedTaskIds = [...new Set((assignmentRows || []).map(row => row.task_id))];
                const filters = [`assignee_id.in.(${userIds.join(',')})`];
                if (assignedTaskIds.length > 0) filters.push(`id.in.(${assignedTaskIds.join(',')})`);

                const { data, error } = await supabase
                    .from('tasks')
                    .select(taskSelect)
                    .in('status', activeStatuses)
                    .or(filters.join(','));

                if (error) throw error;
                rawTasks.push(...((data || []) as unknown as WorkloadTask[]));
            }

            setAllTasks(Array.from(new Map(rawTasks.map(task => [task.id, task])).values()));
        } catch (error) {
            console.error('Error loading workload tasks:', error);
            toast.error('Erro ao carregar tarefas');
        } finally {
            setLoading(false);
        }
    }, [teamId, userIdsKey]);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const groupedTasks = useMemo(
        () => groupWorkloadTasks(allTasks, users.map(user => user.id)),
        [allTasks, users],
    );

    const onDragEnd = async ({ destination, source, draggableId }: DropResult) => {
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceUserId = source.droppableId === 'unassigned' ? null : source.droppableId;
        const destinationUserId = destination.droppableId === 'unassigned' ? null : destination.droppableId;
        const sourceTasks = [...(groupedTasks[source.droppableId] || [])];
        const [movedTask] = sourceTasks.splice(source.index, 1);

        if (!movedTask || movedTask.draggable_id !== draggableId) return;

        const destinationTasks = source.droppableId === destination.droppableId
            ? sourceTasks
            : [...(groupedTasks[destination.droppableId] || [])];

        if (destinationTasks.some(task => task.id === movedTask.id)) {
            toast.error('Esta tarefa já está atribuída a esse responsável');
            return;
        }

        destinationTasks.splice(destination.index, 0, {
            ...movedTask,
            queue_user_id: destinationUserId,
            draggable_id: `${destinationUserId || 'unassigned'}:${movedTask.id}`,
        });

        const destinationTaskIds = destinationTasks.map(task => task.id);
        setAllTasks(currentTasks => applyWorkloadMove(
            currentTasks,
            movedTask.id,
            sourceUserId,
            destinationUserId,
            destinationTaskIds,
        ));

        try {
            const { error } = await supabase.rpc('reorder_workload_queue_v2', {
                p_assignee_id: destinationUserId,
                p_source_assignee_id: sourceUserId,
                p_task_ids: destinationTaskIds,
                p_moved_task_id: movedTask.id,
            });

            if (error) throw error;
            await loadTasks();
        } catch (error) {
            console.error('Error reordering workload queue:', error);
            toast.error('Erro ao reordenar tarefa');
            await loadTasks();
        }
    };

    if (loading && allTasks.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-text-muted">
                <span className="animate-pulse">Carregando Tarefas...</span>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col bg-background">
            {users.length === 0 && (
                <div className="m-6 flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/5 text-text-muted opacity-50">
                    <span className="material-symbols-outlined mb-2 text-4xl">group_add</span>
                    <p>Selecione membros da equipe para visualizar a carga de trabalho.</p>
                </div>
            )}

            {users.length > 0 && (
                <div className="custom-scrollbar flex-1 overflow-x-auto overflow-y-hidden">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex h-full min-w-min select-none items-start justify-start gap-4 px-4 pt-2 pb-6">
                            {groupedTasks.unassigned?.length > 0 && (
                                <WorkloadColumn
                                    key="unassigned"
                                    userId="unassigned"
                                    tasks={groupedTasks.unassigned}
                                    onTaskClick={onTaskClick}
                                />
                            )}

                            {users.map(user => (
                                <WorkloadColumn
                                    key={user.id}
                                    userId={user.id}
                                    user={user}
                                    tasks={groupedTasks[user.id] || []}
                                    onTaskClick={onTaskClick}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                </div>
            )}
        </div>
    );
}
