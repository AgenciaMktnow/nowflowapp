import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SelectDropdown from '../SelectDropdown';


interface User {
    id: string;
    full_name: string;
    email: string;
}

interface UserDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetUserId: string, newOwnerId: string | null) => Promise<void>;
    userToDelete: User;
    allUsers: User[];
}

export default function UserDeleteModal({ isOpen, onClose, onConfirm, userToDelete, allUsers }: UserDeleteModalProps) {
    const [taskCount, setTaskCount] = useState<number | null>(null);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter out the user being deleted from the potential owners list
    const potentialOwners = allUsers.filter(u => u.id !== userToDelete.id);

    // Map to options for SelectDropdown
    const ownerOptions = potentialOwners.map(u => ({
        label: u.full_name,
        value: u.id
    }));

    useEffect(() => {
        if (isOpen && userToDelete.id) {
            fetchTaskCount();
            setSelectedOwnerId(''); // Reset selection
        }
    }, [isOpen, userToDelete]);

    const fetchTaskCount = async () => {
        setIsLoadingCount(true);
        try {
            const { count, error } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('assignee_id', userToDelete.id);

            if (error) throw error;
            setTaskCount(count || 0);
        } catch (error) {
            console.error('Error fetching task count:', error);
            setTaskCount(0);
        } finally {
            setIsLoadingCount(false);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(userToDelete.id, selectedOwnerId || null);
            onClose();
        } catch (error) {
            // Error handling is usually done in the parent, this catch is just to stop loading state if needed
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#102216] border border-[#23482f] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-[#23482f] bg-[#162E20]">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">warning</span>
                        Excluir Usuário
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <p className="text-slate-300">
                        Você está prestes a excluir <strong className="text-white">{userToDelete.full_name}</strong>.
                    </p>

                    <div className="bg-[#1a3524] rounded-lg p-4 border border-[#2a4e38]">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary">assignment</span>
                            <span className="text-sm font-medium text-[#92c9a4]">Tarefas Vinculadas</span>
                        </div>
                        {isLoadingCount ? (
                            <div className="h-6 w-24 bg-[#23482f] rounded animate-pulse"></div>
                        ) : (
                            <p className="text-2xl font-bold text-white">
                                {taskCount} <span className="text-sm font-normal text-slate-400">tarefas pendentes</span>
                            </p>
                        )}
                    </div>

                    {taskCount && taskCount > 0 ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 block">
                                Para quem deseja transferi-las?
                            </label>
                            <SelectDropdown
                                options={ownerOptions}
                                value={selectedOwnerId}
                                onChange={setSelectedOwnerId}
                                placeholder="Selecione um novo responsável"
                                className="w-full"
                                icon="person"
                            />
                            {!selectedOwnerId && (
                                <p className="text-xs text-amber-500/80 flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                    Se não transferir, as tarefas ficarão sem responsável.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">
                            Este usuário não possui tarefas ativas para transferir.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#14261d] border-t border-[#23482f] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-500/10"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                Processando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                {selectedOwnerId ? 'Transferir e Excluir' : 'Confirmar Exclusão'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
