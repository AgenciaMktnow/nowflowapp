import { Draggable } from '@hello-pangea/dnd';
import { memo } from 'react';

interface WorkloadTaskCardProps {
    task: any;
    index: number;
    onClick: (task: any) => void;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'HIGH': return '#ef4444';
        case 'MEDIUM': return '#fb923c';
        case 'LOW': return '#60a5fa'; // Blue-400
        case 'URGENT': return '#ef4444'; // Red-500
        default: return '#10B981'; // Green (Normal) or Gray
    }
};

const WorkloadTaskCard = ({ task, index, onClick }: WorkloadTaskCardProps) => {

    // Resolve Client Name: Try Task Client -> Project Client -> Project Name
    const clientName = task.client?.name || task.project?.client?.name || task.project?.name || 'Cliente N/A';

    // Check Overdue
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';
    const isDone = task.status === 'DONE';

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(task)}
                    className={`
                        relative group
                        bg-surface-dark hover:bg-surface-highlight
                        border border-white/5 hover:border-white/20
                        rounded-lg p-3 mb-2 transition-colors duration-150
                        ${snapshot.isDragging ? 'shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-50 scale-105 border-primary/30 bg-surface-highlight ring-1 ring-primary/20 cursor-grabbing' : 'shadow-sm cursor-grab'}
                        ${isOverdue ? '!border-l-[3px] !border-l-red-500/50' : ''}
                        ${isDone ? 'opacity-60' : ''}
                    `}
                    style={{
                        ...provided.draggableProps.style,
                        // Specific overrides for priority strip implementation
                    }}
                >
                    {/* Priority Strip (Left Border Simulation or internal element) */}
                    <div
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                    />

                    <div className="pl-3 flex flex-col gap-1.5">

                        {/* Header: Client Name (Hierarquia: Small & Muted) */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted/70 truncate max-w-[160px]" title={clientName}>
                                {clientName}
                            </span>
                            {/* Optional: Task Number for tech feel */}
                            <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30 transition-colors">
                                #{task.task_number}
                            </span>
                        </div>

                        {/* Title (Standard System Font) */}
                        <h4 className={`text-[13px] font-medium text-text-primary leading-snug line-clamp-2 ${isDone ? 'line-through text-text-muted' : ''}`}>
                            {task.title}
                        </h4>

                        {/* Footer: Date & Meta */}
                        <div className="flex items-end justify-between mt-1">
                            {/* Due Date Badge */}
                            {task.due_date ? (
                                <div className={`
                                    flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium border
                                    ${isOverdue
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-white/5 text-text-secondary border-white/5 group-hover:bg-white/10'}
                                `}>
                                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                    <span>
                                        {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-white/20" title="Sem prazo definido">
                                    <span className="material-symbols-outlined text-[12px]">all_inclusive</span>
                                    <span className="text-[10px]">Contínua</span>
                                </div>
                            )}

                            {/* Estimated Time (Workload Context) */}
                            {Number(task.estimated_time) > 0 && (
                                <span className="text-[10px] font-mono text-text-muted bg-white/5 px-1 rounded">
                                    {task.estimated_time}h
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default memo(WorkloadTaskCard);
