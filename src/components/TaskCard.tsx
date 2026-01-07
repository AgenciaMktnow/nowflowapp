import { Draggable } from '@hello-pangea/dnd';
import { memo } from 'react';
import TaskActionMenu from './TaskActionMenu';
import { extractChecklistFromHtml } from '../utils/checklist';
import { useNavigate } from 'react-router-dom';

interface Task {
    id: string;
    task_number: number;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: string;
    due_date?: string;
    assignee?: { full_name: string; avatar_url?: string };
    client?: { name: string };
    project?: { name: string; client?: { name: string }; client_id?: string; board?: { color?: string } };
    client_id?: string;
    board_ids?: string[];
    attachments?: any[];
}

interface TaskCardProps {
    task: Task;
    index: number;
    columnVariant?: string;
    isOverdue: boolean;
    clientsList: { id: string; name: string }[];
    activeTeamLog?: boolean;
    onEdit: (task: Task) => void;
    onClone: (newTask: any) => void;
    onUpdate: () => void;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'HIGH': return '#ef4444';
        case 'MEDIUM': return '#fb923c';
        case 'LOW': return '#60a5fa';
        default: return '#10B981';
    }
};

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'HIGH': return <span className="material-symbols-outlined text-red-500 text-sm font-bold" title="Alta Prioridade">flag</span>;
        case 'MEDIUM': return <span className="material-symbols-outlined text-orange-400 text-sm" title="Média Prioridade">flag</span>;
        case 'LOW': return <span className="material-symbols-outlined text-blue-400 text-sm" title="Baixa Prioridade">flag</span>;
        default: return null;
    }
};

const TaskCard = ({ task, index, columnVariant, isOverdue, clientsList, activeTeamLog, onEdit, onClone, onUpdate }: TaskCardProps) => {
    const navigate = useNavigate();

    const attachmentCount = task.attachments?.length || 0;
    const hasChecklist = task.description?.includes('ul data-type="taskList"');
    const checklistStats = extractChecklistFromHtml(task.description || '');
    const checklistProgress = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => navigate(`/tasks/${task.task_number}`)}
                    className={`group relative bg-surface-dark p-4 rounded-lg shadow-sm border cursor-grab hover:shadow-md transition-[border-color,box-shadow,opacity] duration-200 mb-2
                        ${isOverdue ? 'border-red-500/50' : 'border-input-border/30 hover:border-primary/50'}
                        ${columnVariant === 'done' ? 'opacity-60 hover:opacity-100' : ''}
                        ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary rotate-2 z-50' : ''}
                    `}
                    style={{ ...provided.draggableProps.style }}
                >
                    {/* Priority Color Strip (Left) */}
                    <div
                        className="absolute top-2 bottom-2 left-0 w-1 rounded-r-md"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                    ></div>

                    <div className="pl-3 flex flex-col gap-2 relative">
                        {/* Task Action Menu (Absolute Right) */}
                        <div className="absolute top-0 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TaskActionMenu
                                task={task}
                                onEdit={() => onEdit(task)}
                                onClone={onClone}
                                onUpdate={onUpdate}
                            />
                        </div>

                        {/* Header: ID & Client/Project */}
                        <div className="flex items-center justify-between mb-0.5 pr-6">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[10px] font-mono text-text-muted">#{task.task_number}</span>
                                {/* Client Name Lookup Logic */}
                                {(() => {
                                    const lookupClientName = clientsList.find(c => c.id === task.client_id)?.name;
                                    const taskClientName = task.client?.name;
                                    const projectClientName = task.project?.client?.name;
                                    const projectLookupName = clientsList.find(c => c.id === task.project?.client_id)?.name;
                                    const displayText = lookupClientName || taskClientName || projectClientName || projectLookupName || task.project?.name;

                                    return displayText && (
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 text-text-secondary truncate max-w-[150px]">
                                            {displayText}
                                        </span>
                                    );
                                })()}
                            </div>
                            {getPriorityIcon(task.priority)}
                        </div>

                        {/* Title */}
                        <h4 className={`text-[15px] font-semibold text-text-primary leading-snug mt-1 mb-2 ${columnVariant === 'done' ? 'line-through text-text-muted' : ''}`}>
                            {task.title}
                        </h4>

                        {/* Metadata Footer */}
                        <div className="flex items-end justify-between mt-auto">
                            {/* Left: Date / Continuous */}
                            <div className="flex items-center gap-2">
                                {task.due_date ? (
                                    <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue || new Date(task.due_date).toDateString() === new Date().toDateString() ? 'text-red-500' : 'text-text-secondary'}`}>
                                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                        <span>
                                            {(() => {
                                                const [y, m, d] = task.due_date!.split('T')[0].split('-').map(Number);
                                                return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                            })()}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-[11px] text-text-muted" title="Tarefa Contínua">
                                        <span className="material-symbols-outlined text-[14px]">all_inclusive</span>
                                        <span>Contínua</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Icons */}
                            <div className="flex items-center gap-2 text-text-muted">
                                {task.board_ids && task.board_ids.length > 1 && (
                                    <div className="flex items-center gap-1 text-[#00FF00] bg-[#00FF00]/10 px-1.5 py-0.5 rounded border border-[#00FF00]/30 shadow-[0_0_5px_rgba(0,255,0,0.2)]" title="Tarefa Espelhada em Múltiplos Quadros">
                                        <span className="material-symbols-outlined text-[12px] font-bold">dashboard_customize</span>
                                        <span className="text-[10px] font-bold">+{task.board_ids.length - 1}</span>
                                    </div>
                                )}
                                {(hasChecklist || attachmentCount > 0) && (
                                    <div className="flex items-center gap-2 text-text-muted">
                                        {hasChecklist && (
                                            <span className="material-symbols-outlined text-[14px]" title="Contém Checklist">check_box</span>
                                        )}
                                        {attachmentCount > 0 && (
                                            <div className="flex items-center gap-0.5" title={`${attachmentCount} Anexos`}>
                                                <span className="material-symbols-outlined text-[14px] -rotate-45">attach_file</span>
                                                <span className="text-[10px] font-bold">{attachmentCount}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Checklist Bar */}
                            {checklistStats.total > 0 && (
                                <div className="w-full mt-2 mb-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[9px] text-text-muted font-bold">Checklist</span>
                                        <span className="text-[9px] text-text-secondary">{checklistStats.completed}/{checklistStats.total}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#00FF00] transition-all duration-300 shadow-[0_0_8px_rgba(0,255,0,0.4)]"
                                            style={{ width: `${checklistProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Avatar */}
                            <div className="relative">
                                {activeTeamLog && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                                )}
                                {task.assignee ? (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border border-[#333] ${activeTeamLog ? 'bg-primary text-black' : 'bg-surface-border text-text-subtle'}`} title={task.assignee.full_name}>
                                        <img src={task.assignee.avatar_url} className="rounded-full w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-white/5 border border-dashed border-text-muted/30 flex items-center justify-center">
                                        <span className="text-[10px] text-text-muted">?</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default memo(TaskCard);
