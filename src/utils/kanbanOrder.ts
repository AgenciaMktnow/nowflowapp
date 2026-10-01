export interface PositionedTask {
    id: string;
    position?: number | null;
}

export function sortTasksByPosition<T extends PositionedTask & { task_number: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const aPosition = a.position ?? Infinity;
        const bPosition = b.position ?? Infinity;
        return aPosition - bPosition || a.task_number - b.task_number;
    });
}

export function planKanbanMove<T extends PositionedTask>(
    columnTasks: T[],
    visibleTasks: T[],
    taskId: string,
    destinationIndex: number
): { orderedIds: string[]; position: number | null } {
    const full = columnTasks.filter(task => task.id !== taskId);
    const visible = visibleTasks.filter(task => task.id !== taskId);
    const next = visible[destinationIndex];
    const previous = visible[destinationIndex - 1];
    const insertionIndex = next
        ? full.findIndex(task => task.id === next.id)
        : previous
            ? full.findIndex(task => task.id === previous.id) + 1
            : full.length;
    const orderedIds = full.map(task => task.id);
    orderedIds.splice(insertionIndex, 0, taskId);

    const before = full[insertionIndex - 1]?.position;
    const after = full[insertionIndex]?.position;
    let position: number | null;
    if (full.length === 0) position = 1000;
    else if (before == null && insertionIndex === 0 && after != null) position = after - 1000;
    else if (after == null && insertionIndex === full.length && before != null) position = before + 1000;
    else if (before != null && after != null && before < after) position = before + (after - before) / 2;
    else position = null;

    if (position !== null && !Number.isFinite(position)) position = null;
    if (position !== null && before != null && position <= before) position = null;
    if (position !== null && after != null && position >= after) position = null;
    return { orderedIds, position };
}
