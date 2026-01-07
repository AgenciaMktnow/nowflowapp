import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';
import WorkloadColumn from './WorkloadColumn';
import { toast } from 'sonner';

interface WorkloadBoardProps {
    users: { id: string; full_name: string; avatar_url?: string }[];
    teamId?: string;
    onTaskClick: (task: any) => void;
}

export default function WorkloadBoard({ users, teamId, onTaskClick }: WorkloadBoardProps) {
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Load & Reload on Team or Users Change
    useEffect(() => {
        loadTasks();
    }, [teamId, users.length]); // Reload if team changes or user count changes (significant filter change)
    // Note: We avoid reloading on every user selection if we want to be purely client side, 
    // but to fetch "User Specific Tasks" that might not be in the Team Project, we need to fetch when users change.
    // However, if we fetch "Selected Users" tasks, we need to re-fetch when the list of selected users grows. 
    // If it shrinks, we could filter locally, but re-fetching is safer for consistency.

    const loadTasks = async () => {
        console.log('🚀 WorkloadBoard: loadTasks called with:', { teamId, usersCount: users.length });

        setLoading(true);
        try {
            const activeStatuses = ['TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW'];
            const promises = [];

            // 1. Fetch Tasks for the selected Team's Projects (Base Workload)
            if (teamId) {
                console.log('📋 WorkloadBoard: Fetching team tasks for teamId:', teamId);
                const teamQuery = supabase
                    .from('tasks')
                    .select(`
                        id, task_number, title, status, priority, due_date, estimated_time, assignee_id, position,
                        project:projects!inner(name, client:clients(name), team_id)
                    `)
                    .in('status', activeStatuses)
                    .eq('project.team_id', teamId)
                    .order('position', { ascending: true });

                promises.push(teamQuery);
            } else {
                console.log('⚠️ WorkloadBoard: No team selected');
                if (users.length === 0) {
                    console.log('⚠️ WorkloadBoard: No users selected either, returning empty');
                    setAllTasks([]);
                    setLoading(false);
                    return;
                }
            }

            // 2. Fetch Tasks for the Selected Users (Cross-project Workload)
            if (users.length > 0) {
                const userIds = users.map(u => u.id);
                console.log('👥 WorkloadBoard: Fetching user tasks for userIds:', userIds);
                const userQuery = supabase
                    .from('tasks')
                    .select(`
                        id, task_number, title, status, priority, due_date, estimated_time, assignee_id, position,
                        project:projects(name, client:clients(name))
                    `)
                    .in('status', activeStatuses)
                    .in('assignee_id', userIds)
                    .order('position', { ascending: true });

                promises.push(userQuery);
            }

            if (promises.length === 0) {
                console.log('⚠️ WorkloadBoard: No queries to execute');
                setAllTasks([]);
                setLoading(false);
                return;
            }

            console.log(`🔄 WorkloadBoard: Executing ${promises.length} queries...`);
            const results = await Promise.all(promises);

            console.log('📊 WorkloadBoard: Query results:', results.map((r, i) => ({
                queryIndex: i,
                success: !r.error,
                count: r.data?.length || 0,
                error: r.error?.message
            })));

            // Merge and Deduplicate
            const rawTasks: any[] = [];
            results.forEach(res => {
                if (res.data) rawTasks.push(...res.data);
                if (res.error) console.error('❌ Query error:', res.error);
            });

            // Remove duplicates by ID
            const uniqueTasks = Array.from(new Map(rawTasks.map(item => [item.id, item])).values());

            // Sort by position (with fallback to priority if position is null)
            uniqueTasks.sort((a, b) => {
                const posA = a.position ?? 999999;
                const posB = b.position ?? 999999;

                if (posA !== posB) return posA - posB;

                // Fallback: sort by priority if positions are equal
                const priorityMap: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
            });

            console.log('🔍 WorkloadBoard: Tasks loaded:', {
                totalTasks: uniqueTasks.length,
                tasks: uniqueTasks.map(t => ({ id: t.id, title: t.title, assignee_id: t.assignee_id, position: t.position }))
            });

            setAllTasks(uniqueTasks);

        } catch (error) {
            console.error('Error loading workload tasks:', error);
            toast.error('Erro ao carregar tarefas');
        } finally {
            setLoading(false);
        }
    };

    // Grouping Logic (Memoized)
    const groupedTasks = useMemo(() => {
        const groups: Record<string, any[]> = { unassigned: [] };

        // Initialize groups for SELECTED users only
        users.forEach(u => groups[u.id] = []);

        console.log('🔍 WorkloadBoard: Grouping tasks:', {
            totalTasks: allTasks.length,
            selectedUsers: users.map(u => ({ id: u.id, name: u.full_name }))
        });

        const discardedTasks: any[] = [];

        // Distribute tasks
        allTasks.forEach(task => {
            const assignee = task.assignee_id;

            if (!assignee) {
                // Unassigned tasks go to "Sem Responsável" column
                groups['unassigned'].push(task);
            } else if (groups[assignee]) {
                // Task belongs to one of the selected users
                groups[assignee].push(task);
            } else {
                // Task is assigned to someone NOT in the selected users list
                // CHANGED: Instead of hiding, put in unassigned for visibility
                // This allows managers to see ALL team tasks and reassign them
                groups['unassigned'].push(task);
                discardedTasks.push({ id: task.id, title: task.title, assignee_id: assignee });
            }
        });

        console.log('🔍 WorkloadBoard: Grouped tasks:', {
            unassigned: groups['unassigned'].length,
            byUser: Object.keys(groups).filter(k => k !== 'unassigned').map(userId => ({
                userId,
                count: groups[userId].length
            })),
            discarded: discardedTasks.length,
            discardedDetails: discardedTasks
        });

        return groups;
    }, [users, allTasks]);

    // Drag & Drop Handler
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        console.log('🎯 Drag End:', {
            source: result.source,
            destination: result.destination,
            draggableId: result.draggableId
        });

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const destUserId = destination.droppableId;

        // 1. Find the task being moved
        const taskIndex = allTasks.findIndex(t => t.id === draggableId);
        if (taskIndex === -1) return;

        const movedTask = { ...allTasks[taskIndex] };

        // 2. Update assignee locally
        movedTask.assignee_id = destUserId === 'unassigned' ? null : destUserId;

        // 3. Calculate new position (Fractional Indexing - Same logic as Kanban)
        const destColumnTasks = allTasks
            .filter(t => {
                // Exclude the task being moved
                if (t.id === draggableId) return false;

                // Match tasks in the destination column
                const taskUserId = t.assignee_id || 'unassigned';
                return taskUserId === destUserId;
            })
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        let newPosition = 0;

        if (destColumnTasks.length === 0) {
            // Empty column
            newPosition = 1000;
        } else if (destination.index === 0) {
            // Top of column
            newPosition = (destColumnTasks[0].position || 0) / 2;
            if (newPosition < 1) newPosition = 1;
        } else if (destination.index >= destColumnTasks.length) {
            // Bottom of column
            const last = destColumnTasks[destColumnTasks.length - 1];
            newPosition = (last.position || 0) + 1000;
        } else {
            // Middle of column
            const prev = destColumnTasks[destination.index - 1];
            const next = destColumnTasks[destination.index];
            newPosition = ((prev.position || 0) + (next.position || 0)) / 2;
        }

        movedTask.position = newPosition;

        console.log('📊 Position Calculation:', {
            destIndex: destination.index,
            destColumnTasksCount: destColumnTasks.length,
            newPosition,
            neighbors: destColumnTasks.map(t => ({ id: t.id, position: t.position }))
        });

        // 4. Optimistic Update
        const updatedTasks = [...allTasks];
        updatedTasks[taskIndex] = movedTask;
        setAllTasks(updatedTasks.sort((a, b) => (a.position || 0) - (b.position || 0)));

        // 5. Persist to Backend
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    assignee_id: movedTask.assignee_id,
                    position: newPosition
                })
                .eq('id', draggableId);

            if (error) throw error;

            console.log('✅ Task updated successfully:', { taskId: draggableId, assignee_id: movedTask.assignee_id, position: newPosition });
        } catch (error) {
            console.error('❌ Error reassigning task:', error);
            toast.error('Erro ao reatribuir tarefa');
            loadTasks(); // Revert on error
        }
    };

    if (loading && allTasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-text-muted">
                <span className="animate-pulse">Carregando Tarefas...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-background">
            {/* Empty State Hint (Only if no users selected AND no tasks found) */}
            {users.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-50 border-2 border-dashed border-white/5 rounded-xl m-6">
                    <span className="material-symbols-outlined text-4xl mb-2">group_add</span>
                    <p>Selecione membros da equipe para visualizar a carga de trabalho.</p>
                </div>
            )}

            {/* Board Area */}
            {users.length > 0 && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex h-full px-4 pt-2 gap-4 items-start justify-start select-none pb-6 min-w-min">

                            {/* Unassigned Column - Only show if has tasks */}
                            {groupedTasks['unassigned']?.length > 0 && (
                                <WorkloadColumn
                                    key="unassigned"
                                    userId="unassigned"
                                    tasks={groupedTasks['unassigned'] || []}
                                    onTaskClick={onTaskClick}
                                />
                            )}

                            {/* Selected User Columns */}
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
