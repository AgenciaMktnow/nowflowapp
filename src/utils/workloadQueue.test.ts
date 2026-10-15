import { describe, expect, it } from 'vitest';
import { applyWorkloadMove, groupWorkloadTasks } from './workloadQueue';

describe('workload queues', () => {
    it('places a shared task in every active assignee queue using each personal position', () => {
        const groups = groupWorkloadTasks([{
            id: 'task-1', task_number: 1, assignee_id: 'mariah', position: 9000,
            task_assignees: [
                { user_id: 'mariah', queue_position: 8, completed_at: null },
                { user_id: 'mauricio', queue_position: 2, completed_at: null },
            ],
        }], ['mariah', 'mauricio']);

        expect(groups.mariah[0]).toMatchObject({ queue_position: 8, draggable_id: 'mariah:task-1' });
        expect(groups.mauricio[0]).toMatchObject({ queue_position: 2, draggable_id: 'mauricio:task-1' });
    });

    it('does not show a completed individual assignment as open workload', () => {
        const groups = groupWorkloadTasks([{
            id: 'task-1', task_number: 1, assignee_id: 'mariah',
            task_assignees: [
                { user_id: 'mariah', completed_at: null },
                { user_id: 'mauricio', completed_at: '2026-10-15T12:00:00Z' },
            ],
        }], ['mauricio']);

        expect(groups.mauricio).toEqual([]);
    });

    it('moves only the selected assignment and preserves other co-assignees', () => {
        const [updated] = applyWorkloadMove([{
            id: 'task-1', task_number: 1, assignee_id: 'mariah',
            task_assignees: [
                { user_id: 'mariah', queue_position: 0 },
                { user_id: 'mauricio', queue_position: 4 },
            ],
        }], 'task-1', 'mauricio', 'kelly', ['task-1']);

        expect(updated.assignee_id).toBe('mariah');
        expect(updated.task_assignees).toEqual([
            { user_id: 'mariah', queue_position: 0 },
            { user_id: 'kelly', completed_at: null, queue_position: 0 },
        ]);
    });
});
