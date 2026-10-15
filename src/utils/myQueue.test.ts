import { describe, expect, it } from 'vitest';
import { isTaskAssignedToUser, matchesQueueStatus, mergeUserAssignment } from './myQueue';

const userId = 'mauricio';

describe('My Queue filters', () => {
    it('hides an open task after the current user delivers their part', () => {
        const task = {
            status: 'IN_PROGRESS' as const,
            assignee_id: 'mariah',
            task_assignees: [
                { user_id: 'mariah', completed_at: null },
                { user_id: userId, completed_at: '2026-10-13T12:00:00Z' },
            ],
        };

        expect(isTaskAssignedToUser(task, userId)).toBe(true);
        expect(matchesQueueStatus(task, userId, 'MINE', 'OPEN')).toBe(false);
        expect(matchesQueueStatus(task, userId, 'MINE', 'OPEN_MY_PART_DONE')).toBe(true);
    });

    it('keeps an unfinished shared task in the open queue', () => {
        const task = {
            status: 'WAITING_CLIENT' as const,
            assignee_id: 'mariah',
            task_assignees: [
                { user_id: 'mariah', completed_at: null },
                { user_id: userId, completed_at: null },
            ],
        };

        expect(matchesQueueStatus(task, userId, 'MINE', 'OPEN')).toBe(true);
        expect(matchesQueueStatus(task, userId, 'MINE', 'OPEN_MY_PART_DONE')).toBe(false);
    });

    it('preserves legacy primary assignments without a junction row', () => {
        const task = { status: 'TODO' as const, assignee_id: userId };

        expect(isTaskAssignedToUser(task, userId)).toBe(true);
        expect(matchesQueueStatus(task, userId, 'MINE', 'OPEN')).toBe(true);
    });

    it('keeps the previous review semantics outside the personal assignment tab', () => {
        const task = { status: 'REVIEW' as const, assignee_id: userId };

        expect(matchesQueueStatus(task, userId, 'CREATED', 'OPEN_MY_PART_DONE')).toBe(true);
    });

    it('uses the directly loaded assignment as the source of the personal queue position', () => {
        const assignments = [
            { user_id: userId, queue_position: 7, completed_at: null, user: { full_name: 'Maurício' } },
            { user_id: 'kelly', queue_position: 2, completed_at: null },
        ];
        const directAssignment = { user_id: userId, queue_position: 1, completed_at: null };

        expect(mergeUserAssignment(assignments, directAssignment)).toEqual([
            { user_id: 'kelly', queue_position: 2, completed_at: null },
            { ...directAssignment, user: { full_name: 'Maurício' } },
        ]);
    });
});
