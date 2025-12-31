import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { boardService } from '../services/board.service';

interface ColumnMenuProps {
    columnId: string;
    onEdit: () => void;
    onDeleteSuccess: () => void;
}

export default function ColumnMenu({ columnId, onEdit, onDeleteSuccess }: ColumnMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleDelete = async () => {
        if (window.confirm('Tem certeza que deseja excluir esta coluna?')) {
            const { error } = await boardService.deleteBoardColumn(columnId);
            if (error) {
                toast.error(error.message || 'Erro ao excluir coluna');
                return;
            }
            toast.success('Coluna excluída com sucesso');
            onDeleteSuccess();
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-slate-400 hover:text-white transition-colors p-1 rounded-md ${isOpen ? 'text-white bg-white/10' : ''}`}
            >
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1c3829] border border-[#326744] rounded-lg shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right py-1">
                    <div className="flex flex-col">
                        <button
                            onClick={() => {
                                onEdit();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm text-[#92c9a4] hover:text-white hover:bg-[#23482f] transition-colors flex items-center gap-3"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full text-left px-3 py-2.5 text-sm text-[#92c9a4] hover:text-white hover:bg-[#23482f] transition-colors flex items-center gap-3"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Excluir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
