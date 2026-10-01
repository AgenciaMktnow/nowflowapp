import { beforeEach, describe, expect, it, vi } from 'vitest';
import { taskService } from './task.service';
import { supabase } from '../lib/supabase';

const { query } = vi.hoisted(() => {
    const builder = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        then: vi.fn(),
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    builder.then.mockImplementation(resolve => resolve({ data: [], error: null }));
    return { query: builder };
});

vi.mock('../lib/supabase', () => ({ supabase: { from: vi.fn(() => query) } }));

describe('taskService.getTasks client filter', () => {
    beforeEach(() => vi.clearAllMocks());

    it('filters tasks by their own client, alongside board and project', async () => {
        await taskService.getTasks({ clientId: 'bigolin', boardId: 'neto', projectId: 'service' }, true);

        expect(query.eq).toHaveBeenCalledWith('task_boards.board_id', 'neto');
        expect(query.eq).toHaveBeenCalledWith('client_id', 'bigolin');
        expect(query.eq).toHaveBeenCalledWith('project_id', 'service');
        expect(supabase.from).not.toHaveBeenCalledWith('client_projects');
    });
});
