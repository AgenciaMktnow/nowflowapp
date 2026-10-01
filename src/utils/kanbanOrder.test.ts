import { describe, expect, it } from 'vitest';
import { planKanbanMove, sortTasksByPosition } from './kanbanOrder';

const tasks = [
    { id: 'a', task_number: 1, position: 1000 },
    { id: 'b', task_number: 2, position: 2000 },
    { id: 'c', task_number: 3, position: 3000 },
];

describe('Kanban ordering', () => {
    it('moves a card upward and downward using the visible destination index', () => {
        expect(planKanbanMove(tasks, tasks, 'c', 0)).toEqual({ orderedIds: ['c', 'a', 'b'], position: 0 });
        expect(planKanbanMove(tasks, tasks, 'a', 2)).toEqual({ orderedIds: ['b', 'c', 'a'], position: 4000 });
    });

    it('preserves hidden cards when a quick filter is active', () => {
        expect(planKanbanMove(tasks, [tasks[0], tasks[2]], 'c', 0)).toEqual({
            orderedIds: ['c', 'a', 'b'], position: 0,
        });
    });

    it('inserts before the first hidden completed card at the visible boundary', () => {
        expect(planKanbanMove(tasks, tasks.slice(0, 2), 'new', 2)).toEqual({
            orderedIds: ['a', 'b', 'new', 'c'], position: 2500,
        });
    });

    it('requests a rebalance for equal or missing positions', () => {
        const tied = [{ id: 'a', position: 1 }, { id: 'b', position: 1 }];
        expect(planKanbanMove(tied, tied, 'new', 1).position).toBeNull();
        expect(planKanbanMove([{ id: 'a', position: null }, { id: 'b', position: null }],
            [{ id: 'a', position: null }, { id: 'b', position: null }], 'new', 1).position).toBeNull();
    });

    it('sorts empty positions last with a stable task-number tie break', () => {
        expect(sortTasksByPosition([
            { id: 'c', task_number: 3, position: null },
            { id: 'b', task_number: 2, position: 1 },
            { id: 'a', task_number: 1, position: 1 },
        ]).map(task => task.id)).toEqual(['a', 'b', 'c']);
    });
});
