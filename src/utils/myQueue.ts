export type QueueStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'REVIEW' | 'DONE';
export type QueueTab = 'MINE' | 'CREATED' | 'REVIEW';
export type QueueStatusFilter = 'OPEN' | 'OPEN_MY_PART_DONE' | 'DELIVERED';

type QueueAssignment = {
    user_id: string;
    completed_at?: string | null;
};

type QueueTask = {
    status: QueueStatus;
    assignee_id?: string;
    task_assignees?: QueueAssignment[];
};

export const getUserAssignment = (task: QueueTask, userId?: string) => (
    userId ? task.task_assignees?.find(assignment => assignment.user_id === userId) : undefined
);

export const isTaskAssignedToUser = (task: QueueTask, userId?: string) => Boolean(
    userId && (
        task.assignee_id === userId ||
        task.task_assignees?.some(assignment => assignment.user_id === userId)
    )
);

export const matchesQueueStatus = (
    task: QueueTask,
    userId: string | undefined,
    activeTab: QueueTab,
    statusFilter: QueueStatusFilter,
) => {
    const myPartIsDone = Boolean(getUserAssignment(task, userId)?.completed_at);

    if (statusFilter === 'OPEN') {
        return task.status !== 'DONE' && (activeTab !== 'MINE' || !myPartIsDone);
    }

    if (statusFilter === 'OPEN_MY_PART_DONE') {
        if (activeTab === 'MINE') return task.status !== 'DONE' && myPartIsDone;
        return task.status === 'REVIEW' || task.status === 'WAITING_CLIENT';
    }

    return task.status === 'DONE';
};
