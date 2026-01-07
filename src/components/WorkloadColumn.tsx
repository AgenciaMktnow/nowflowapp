import { memo, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import WorkloadTaskCard from './WorkloadTaskCard';

interface WorkloadColumnProps {
    userId: string | 'unassigned';
    user?: { id: string; full_name: string; avatar_url?: string };
    tasks: any[];
    onTaskClick: (task: any) => void;
}

const WorkloadColumn = ({ userId, user, tasks, onTaskClick }: WorkloadColumnProps) => {


    // Performance: Memoize total hours calculation
    const totalHours = useMemo(() => {
        return tasks.reduce((acc, task) => {
            return acc + (Number(task.estimated_time) || 0);
        }, 0);
    }, [tasks]);

    // Color Logic for Overload (example threshold: > 40h)
    const isOverloaded = totalHours > 40;
    const statsColor = isOverloaded ? 'text-red-400' : 'text-primary';

    return (
        <div className="flex flex-col min-h-full min-w-[350px] w-[350px] bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
            {/* Column Header */}
            <div className={`
                p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0
                ${userId === 'unassigned' ? 'bg-orange-500/10' : 'bg-surface-dark'}
            `}>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        {userId === 'unassigned' ? (
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/30">
                                <span className="material-symbols-outlined text-sm">person_off</span>
                            </div>
                        ) : (
                            <img
                                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=random`}
                                alt={user?.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary truncate max-w-[140px]">
                            {userId === 'unassigned' ? 'Sem Responsável' : user?.full_name}
                        </span>
                        <span className="text-xs text-text-muted">{tasks.length} Tarefa(s)</span>
                    </div>
                </div>

                {/* Hours Badge */}
                <div className={`flex flex-col items-end ${statsColor}`}>
                    <span className="text-[10px] font-bold uppercase opacity-70">Carga</span>
                    <span className="text-sm font-bold font-mono">{totalHours}h</span>
                </div>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={userId} type="TASK">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 w-full pt-3 px-2 pb-2 overflow-y-auto custom-scrollbar transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5' : ''
                            }`}
                        style={{ minHeight: '200px' }}
                    >
                        {tasks.map((task, index) => (
                            <WorkloadTaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={onTaskClick}
                            />
                        ))}
                        {provided.placeholder}

                        {tasks.length === 0 && (
                            <div className="h-20 flex items-center justify-center text-text-muted/20 border-2 border-dashed border-white/5 rounded-lg text-xs mt-2">
                                Livre
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default memo(WorkloadColumn);
