import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTaskActions } from '../hooks/useTaskActions';
import { useAuth } from '../contexts/AuthContext';

interface TaskActionMenuProps {
    task: any;
    onEdit: () => void;
    onUpdate?: () => void;
    onClone?: (newTask: any) => void;
}

export default function TaskActionMenu({ task, onEdit, onUpdate, onClone }: TaskActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // State for positioning
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const { cloneTask, deleteTask, loading } = useTaskActions();
    const { userProfile } = useAuth();
    const isAdmin = userProfile?.role === 'ADMIN';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
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

    // Position calculation
    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // Position menu bottom-left of the button, but ensuring it fits screen
        setCoords({
            top: rect.bottom + 5,
            left: rect.right - 180, // 180px width approx
        });
        setIsOpen(true);
    };

    const handleClone = async () => {
        setIsOpen(false);
        await cloneTask(task, (newTask) => {
            if (onClone) onClone(newTask);
            if (onUpdate) onUpdate();
        });
    };

    const handleDelete = async () => {
        // Confirmation is handled by modal
        // Trigger generic delete logic from hook which performs Supabase delete
        // We call hook.deleteTask inside the Modal's "Sim" button
        // Here we just open the modal
        setIsOpen(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        await deleteTask(task.id, () => {
            setShowDeleteModal(false);
            if (onUpdate) onUpdate();
        });
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={toggleMenu}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Ações Rápidas"
            >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        top: coords.top,
                        left: coords.left,
                    }}
                    className="fixed w-[180px] bg-surface-dark border border-gray-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1"
                >
                    {/* Edit */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onEdit();
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Editar
                    </button>

                    {/* Clone */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClone();
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                        disabled={loading}
                    >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        {loading ? 'Clonando...' : 'Clonar'}
                    </button>

                    {/* Delete - Admin OR (Manager + Creator) Only */}
                    {(isAdmin || (userProfile?.role === 'MANAGER' && task.creator?.id === userProfile?.id)) && (
                        <>
                            <div className="h-px bg-gray-700 my-1 mx-2" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Excluir
                            </button>
                        </>
                    )}
                </div>,
                document.body
            )}

            {/* Delete Modal Portal */}
            {showDeleteModal && createPortal(
                <div className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-surface-dark border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Excluir Tarefa?</h3>
                        <p className="text-gray-400 mb-6">
                            Tem certeza que deseja excluir a tarefa <span className="text-white font-medium">"{task.title}"</span>? Esta ação é irreversível.
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
