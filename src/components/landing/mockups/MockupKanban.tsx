import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal } from 'lucide-react';

export function MockupKanban() {
    const [tasks, setTasks] = useState([
        { id: '1', title: 'Briefing Inicial', tag: 'Cliente', col: 'todo' },
        { id: '2', title: 'Wireframe Home', tag: 'Design', col: 'todo' },
        { id: '3', title: 'Dev API', tag: 'Backend', col: 'doing' },
    ]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const newCol = destination.droppableId;
        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, col: newCol } : t));
    };

    const Columns = [
        { id: 'todo', title: 'A Fazer', color: 'bg-white/5' },
        { id: 'doing', title: 'Em Andamento', color: 'bg-blue-500/10' },
        { id: 'done', title: 'Concluído', color: 'bg-green-500/10' }
    ];

    return (
        <div className="w-full bg-[#0B0E0F] border border-white/10 rounded-xl p-4 shadow-2xl relative overflow-hidden flex flex-col h-[420px]">
            {/* Header Simulado */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">P</div>
                    <div>
                        <div className="text-sm font-bold text-white">Projeto Website</div>
                        <div className="text-[10px] text-text-muted">Sprint 24</div>
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-[#0B0E0F]" />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-[#0B0E0F] flex items-center justify-center text-[10px] text-white font-bold">+2</div>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                {/* Board Area - Scrollable on mobile */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible h-full select-none">
                    {Columns.map(col => (
                        <Droppable key={col.id} droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-shrink-0 w-[85%] md:w-auto rounded-xl p-3 bg-[#161616]/50 border border-white/5 flex flex-col h-full transition-colors ${snapshot.isDraggingOver ? 'bg-white/5 border-primary/30' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{col.title}</span>
                                        <Plus size={14} className="text-text-muted cursor-pointer hover:text-white" />
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-[50px]">
                                        {tasks.filter(t => t.col === col.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{ ...provided.draggableProps.style }}
                                                        className={`group cursor-grab active:cursor-grabbing bg-[#222] hover:bg-[#2a2a2a] border border-white/5 p-3 rounded-lg shadow-sm transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary/50 rotate-2 bg-[#2a2a2a] z-50' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-colors">{task.tag}</span>
                                                            <MoreHorizontal size={12} className="text-text-muted opacity-0 group-hover:opacity-100" />
                                                        </div>
                                                        <p className="text-sm font-medium text-white mb-2 leading-snug">{task.title}</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="w-4 h-4 rounded-full bg-orange-500/20" />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {/* Empty State / Ghost Card if empty (and not dragging over) -> Droppable placeholder handles layout usually, but visual empty state is nice. */}
                                        {tasks.filter(t => t.col === col.id).length === 0 && !snapshot.isDraggingOver && (
                                            <div className="h-20 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center">
                                                <span className="text-[10px] text-text-muted/30">Vazio</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            <div className="md:hidden text-center mt-2 text-[10px] text-text-muted/50 w-full animate-pulse flex-shrink-0">
                Segure e arraste · Deslize para o lado →
            </div>
        </div>
    );
}
