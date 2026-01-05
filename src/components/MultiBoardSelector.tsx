import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Board } from '../types/database.types';

interface MultiBoardSelectorProps {
    boards: Board[];
    selectedBoardIds: string[];
    onChange: (ids: string[]) => void;
}

export const MultiBoardSelector: React.FC<MultiBoardSelectorProps> = ({ boards, selectedBoardIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

    // Refs for outside click detection
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Check if click is outside both the button (dropdownRef) AND the portal menu (menuRef)
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleBoard = (boardId: string) => {
        const newIds = selectedBoardIds.includes(boardId)
            ? selectedBoardIds.filter(id => id !== boardId)
            : [...selectedBoardIds, boardId];
        onChange(newIds);
    };

    const displayText = selectedBoardIds.length === 0
        ? 'Selecione os quadros...'
        : selectedBoardIds.length === 1
            ? boards.find(b => b.id === selectedBoardIds[0])?.name
            : `${selectedBoardIds.length} selecionados`;

    const handleOpen = () => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        setMenuRect(rect);
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative group/board-selector" ref={dropdownRef}>
            <button
                type="button"
                onClick={handleOpen}
                className={`w-full flex items-center justify-between gap-2 px-4 h-12 bg-surface-dark border border-gray-700/50 rounded-xl hover:border-gray-500 transition-all text-left group ${isOpen ? 'ring-2 ring-primary border-transparent' : ''}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`material-symbols-outlined text-[20px] transition-colors ${selectedBoardIds.length > 0 ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}>view_kanban</span>
                    <span className={`text-sm truncate font-medium ${selectedBoardIds.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                        {displayText}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && menuRect && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 border border-primary/30 bg-[#193322]"
                    style={{
                        top: menuRect.bottom + 8,
                        left: menuRect.left,
                        width: menuRect.width,
                        maxHeight: '320px',
                        boxShadow: '0 0 0 1px rgba(19, 236, 91, 0.1), 0 10px 40px rgba(0,0,0,0.6)'
                    }}
                >
                    <div className="overflow-y-auto max-h-[300px] custom-scrollbar p-1">
                        {boards.map(board => {
                            const isSelected = selectedBoardIds.includes(board.id);
                            return (
                                <div
                                    key={board.id}
                                    onClick={() => toggleBoard(board.id)}
                                    className={`
                                        px-3 py-2.5 mx-1 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 group/item relative overflow-hidden
                                        ${isSelected
                                            ? 'bg-primary/20 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-1 h-8 absolute -left-4 rounded-r-full transition-all duration-300 ${isSelected ? 'bg-primary shadow-[0_0_10px_#00FF00]' : 'bg-transparent'}`}></div>
                                        <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                        <span className="text-sm font-medium">{board.name}</span>
                                    </div>
                                    {isSelected && <span className="material-symbols-outlined text-primary text-[18px] drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">check</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
