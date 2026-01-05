import React from 'react';
import type { Board } from '../types/database.types';

interface MultiBoardSelectorProps {
    boards: Board[];
    selectedBoardIds: string[];
    onChange: (ids: string[]) => void;
}

export const MultiBoardSelector: React.FC<MultiBoardSelectorProps> = ({ boards, selectedBoardIds, onChange }) => {

    const handleToggle = (boardId: string) => {
        const currentSet = new Set(selectedBoardIds);
        if (currentSet.has(boardId)) {
            // Optional: Prevent deselecting all? Maybe not for now.
            currentSet.delete(boardId);
        } else {
            currentSet.add(boardId);
        }
        onChange(Array.from(currentSet));
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">view_kanban</span> Quadros Ativos (Onde essa tarefa aparece?)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {boards.map(board => {
                    const isSelected = selectedBoardIds.includes(board.id);
                    return (
                        <div
                            key={board.id}
                            onClick={() => handleToggle(board.id)}
                            className={`
                                cursor-pointer px-4 py-4 rounded-xl border flex items-center gap-3 transition-all duration-300 relative overflow-hidden group
                                ${isSelected
                                    ? 'bg-[#0A1F14] border-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                                    : 'bg-[#0A1F14]/50 border-white/5 hover:border-white/20 hover:bg-[#0A1F14]'
                                }
                            `}
                        >
                            <div className={`
                                w-5 h-5 rounded border flex items-center justify-center transition-all duration-300
                                ${isSelected
                                    ? 'bg-[#00FF00] border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.5)]'
                                    : 'border-white/20 group-hover:border-[#00FF00]/50'
                                }
                            `}>
                                {isSelected && <span className="material-symbols-outlined text-black text-[14px] font-bold">check</span>}
                            </div>

                            <span className={`text-sm font-bold tracking-wide ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white/80'}`}>
                                {board.name}
                            </span>

                            {/* Neon Glow Effect on Selection */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-[#00FF00]/5 pointer-events-none animate-pulse-slow" />
                            )}
                        </div>
                    );
                })}
            </div>
            {selectedBoardIds.length === 0 && (
                <p className="text-xs text-red-400 mt-1">* Selecione pelo menos um quadro.</p>
            )}
        </div>
    );
};
