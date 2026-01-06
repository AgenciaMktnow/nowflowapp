import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import NewTask from '../pages/NewTask';

interface TaskEditDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    taskNumber?: string;
    onSuccess: () => void;
}

export default function TaskEditDrawer({ isOpen, onClose, taskNumber, onSuccess }: TaskEditDrawerProps) {

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div className="relative w-full max-w-6xl bg-surface-dark border border-gray-700/50 rounded-2xl shadow-2xl h-[90vh] animate-in zoom-in-95 fade-in duration-200 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0 bg-surface-dark/95 backdrop-blur">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">edit_document</span>
                        Editar Tarefa <span className="text-gray-500">#{taskNumber}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative bg-background-dark/50">
                    {/* Render NewTask in Drawer/Modal Mode */}
                    <NewTask
                        isDrawer={true}
                        taskNumber={taskNumber}
                        onClose={onClose}
                        onSuccess={onSuccess}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
