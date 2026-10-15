export type WorkloadAssignment = {
    user_id: string;
    queue_position?: number | null;
    completed_at?: string | null;
};

export type WorkloadTaskBase = {
    id: string;
    task_number: number;
    assignee_id?: string | null;
    position?: number | null;
    queue_position?: number | null;
    task_assignees?: WorkloadAssignment[];
};

export type WorkloadQueueItem<T extends WorkloadTaskBase = WorkloadTaskBase> = T & {
    queue_user_id: string | null;
    queue_position: number | null;
    draggable_id: string;
};

const compareQueueItems = (a: WorkloadQueueItem, b: WorkloadQueueItem) => {
    const aQueuePosition = a.queue_position ?? Number.MAX_SAFE_INTEGER;
    const bQueuePosition = b.queue_position ?? Number.MAX_SAFE_INTEGER;
    const aTaskPosition = a.position ?? Number.MAX_SAFE_INTEGER;
    const bTaskPosition = b.position ?? Number.MAX_SAFE_INTEGER;

    return aQueuePosition - bQueuePosition || aTaskPosition - bTaskPosition || a.task_number - b.task_number;
};

export const groupWorkloadTasks = <T extends WorkloadTaskBase>(tasks: T[], userIds: string[]) => {
    const groups: Record<string, WorkloadQueueItem<T>[]> = { unassigned: [] };
    userIds.forEach(userId => { groups[userId] = []; });

    tasks.forEach(task => {
        const assignments = task.task_assignees || [];
        const activeAssignments = assignments.filter(assignment => !assignment.completed_at);
        let placedInSelectedQueue = false;

        userIds.forEach(userId => {
            const assignment = activeAssignments.find(item => item.user_id === userId);
            const hasAnyAssignmentForUser = assignments.some(item => item.user_id === userId);
            const isLegacyPrimaryAssignment = task.assignee_id === userId && !hasAnyAssignmentForUser;

            if (!assignment && !isLegacyPrimaryAssignment) return;

            groups[userId].push({
                ...task,
                queue_user_id: userId,
                queue_position: assignment?.queue_position ?? task.queue_position ?? null,
                draggable_id: `${userId}:${task.id}`,
            });
            placedInSelectedQueue = true;
        });

        const isTrulyUnassigned = !task.assignee_id && activeAssignments.length === 0;
        if (!placedInSelectedQueue && isTrulyUnassigned) {
            groups.unassigned.push({
                ...task,
                queue_user_id: null,
                queue_position: task.queue_position ?? null,
                draggable_id: `unassigned:${task.id}`,
            });
        }
    });

    Object.values(groups).forEach(group => group.sort(compareQueueItems));
    return groups;
};

export const applyWorkloadMove = <T extends WorkloadTaskBase>(
    tasks: T[],
    movedTaskId: string,
    sourceUserId: string | null,
    destinationUserId: string | null,
    destinationTaskIds: string[],
) => {
    const destinationPositions = new Map(destinationTaskIds.map((taskId, index) => [taskId, index]));

    return tasks.map(task => {
        let assignments = [...(task.task_assignees || [])];
        let assigneeId = task.assignee_id;

        if (task.id === movedTaskId && sourceUserId !== destinationUserId) {
            if (sourceUserId) {
                assignments = assignments.filter(assignment => assignment.user_id !== sourceUserId);
            }

            if (destinationUserId && !assignments.some(assignment => assignment.user_id === destinationUserId)) {
                assignments.push({ user_id: destinationUserId, completed_at: null, queue_position: null });
            }

            if (assigneeId === sourceUserId || sourceUserId === null) {
                assigneeId = destinationUserId;
            }
        }

        if (destinationPositions.has(task.id)) {
            const queuePosition = destinationPositions.get(task.id)!;
            if (destinationUserId) {
                assignments = assignments.map(assignment => (
                    assignment.user_id === destinationUserId
                        ? { ...assignment, queue_position: queuePosition }
                        : assignment
                ));
            } else {
                return { ...task, assignee_id: assigneeId, task_assignees: assignments, queue_position: queuePosition };
            }
        }

        return { ...task, assignee_id: assigneeId, task_assignees: assignments };
    });
};
