import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { boardService, type Board } from '../../services/board.service';
import { supabase } from '../../lib/supabase';

// Adapted from Boards.tsx to fit into Settings layout
export default function BoardsSettings() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBoard, setEditingBoard] = useState<Partial<Board>>({ color: '#10B981' });
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Member Selection UI State
    const [memberSearch, setMemberSearch] = useState('');

    // Data for dropdowns
    const [allUsers, setAllUsers] = useState<{ id: string, name: string, avatar_url?: string }[]>([]);

    useEffect(() => {
        fetchBoards();
        fetchUsers();
    }, []);

    const fetchBoards = async () => {
        setLoading(true);
        const { data } = await boardService.getBoards();
        if (data) {
            setBoards(data);
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('id, full_name, avatar_url');
        if (data) {
            setAllUsers(data.map(u => ({
                id: u.id,
                name: u.full_name || 'Usuário sem nome',
                avatar_url: u.avatar_url
            })));
        }
    };

    const handleEdit = (board: Board) => {
        setEditingBoard(board);
        setSelectedMemberIds(board.members?.map(m => m.id) || []);
        setMemberSearch('');
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingBoard({ color: '#10B981' }); // Default color
        setSelectedMemberIds([]);
        setMemberSearch('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingBoard.name) {
            toast.warning('O nome do quadro é obrigatório');
            return;
        }

        try {
            let error;
            if (editingBoard.id) {
                // Update
                const res = await boardService.updateBoard(editingBoard.id, editingBoard, selectedMemberIds);
                error = res.error;
            } else {
                // Create
                const res = await boardService.createBoard(editingBoard, selectedMemberIds);
                error = res.error;
            }

            if (error) throw error;

            toast.success(editingBoard.id ? 'Quadro atualizado com sucesso!' : 'Quadro criado com sucesso!');
            setIsModalOpen(false);
            fetchBoards();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao salvar quadro. Tente novamente.');
        }
    };

    const handleDelete = async (board: Board) => {
        if (board.active_projects_count && board.active_projects_count > 0) {
            toast.warning(`Não é possível excluir este quadro pois existem ${board.active_projects_count} projetos ativos vinculados a ele.`);
            return;
        }

        // Custom confirm using browser built-in for simplicity, but toaster for result
        if (!confirm(`Tem certeza que deseja excluir o quadro "${board.name}"?`)) return;

        const { error } = await boardService.deleteBoard(board.id);

        if (error) {
            toast.error('Erro ao excluir quadro.');
        } else {
            toast.success('Quadro excluído com sucesso!');
            fetchBoards();
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMemberIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase()));
    }, [allUsers, memberSearch]);

    const selectedMembersData = useMemo(() => {
        return allUsers.filter(u => selectedMemberIds.includes(u.id));
    }, [allUsers, selectedMemberIds]);

    const colorOptions = [
        { color: '#10B981', label: 'Verde (Design)' },
        { color: '#3B82F6', label: 'Azul (Marketing)' },
        { color: '#8B5CF6', label: 'Roxo (Dev)' },
        { color: '#EF4444', label: 'Vermelho (Urgente)' },
        { color: '#F59E0B', label: 'Laranja (Comercial)' },
        { color: '#EC4899', label: 'Rosa (RH)' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Gerenciar Quadros (Núcleos)</h2>
                    <p className="text-text-muted text-sm mt-1">Crie e organize os núcleos da sua agência.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background-dark font-bold hover:bg-[#3bfd7b] transition-colors shadow-lg shadow-green-500/10"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Novo Quadro
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-text-muted border border-dashed border-[#23482f] rounded-xl bg-[#13261a]/30">Carregando quadros...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map(board => (
                        <div key={board.id} className="group relative bg-[#13261a] border border-[#23482f] rounded-xl p-5 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/5 flex flex-col gap-4 pb-6">
                            {/* Color Stripe */}
                            <div
                                className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                                style={{ backgroundColor: board.color }}
                            ></div>

                            {/* Action Buttons (Top Right) */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#13261a]/80 backdrop-blur-sm rounded-lg p-0.5 border border-[#23482f]">
                                <button
                                    onClick={() => handleEdit(board)}
                                    className="text-text-muted hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                {board.active_projects_count === 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(board); }}
                                        className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                                        title="Excluir Quadro"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                )}
                            </div>

                            <div className="pl-3 pr-24 flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight">{board.name}</h3>
                                    <p className="text-text-muted text-sm mt-1 line-clamp-2 min-h-[40px]">
                                        {board.description || 'Sem descrição definida.'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats & Members */}
                            <div className="pl-3 mt-auto pt-4 border-t border-[#23482f] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-text-muted text-xs font-medium bg-black/20 px-2 py-1 rounded-md">
                                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                                    {board.active_projects_count} Projetos
                                </div>

                                <div className="flex items-center -space-x-2">
                                    {board.members?.slice(0, 3).map((member) => (
                                        <div
                                            key={member.id}
                                            className="w-7 h-7 rounded-full bg-surface-dark border border-[#23482f] flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-[#13261a]"
                                            title={member.full_name}
                                        >
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                member.full_name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    ))}
                                    {board.members && board.members.length > 3 && (
                                        <div className="w-7 h-7 rounded-full bg-[#23482f] flex items-center justify-center text-[10px] text-text-muted font-bold ring-2 ring-[#13261a]">
                                            +{board.members.length - 3}
                                        </div>
                                    )}
                                    {(!board.members || board.members.length === 0) && (
                                        <span className="text-xs text-text-muted italic">Sem membros</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-[#162e21] border border-[#23482f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-[#23482f] flex justify-between items-center bg-[#0d1f14]">
                            <h2 className="text-lg font-bold text-white">
                                {editingBoard.id ? 'Editar Quadro' : 'Novo Quadro'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase">Nome do Núcleo</label>
                                    <input
                                        className="w-full bg-[#0d1f14] border border-[#23482f] rounded-lg px-4 py-2.5 text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Ex: Marketing"
                                        value={editingBoard.name || ''}
                                        onChange={e => setEditingBoard({ ...editingBoard, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase">Cor</label>
                                    <div className="flex gap-2 items-center h-[42px]">
                                        {colorOptions.map(opt => (
                                            <button
                                                key={opt.color}
                                                onClick={() => setEditingBoard({ ...editingBoard, color: opt.color })}
                                                className={`size-6 rounded-full border flex items-center justify-center transition-all ${editingBoard.color === opt.color ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: opt.color }}
                                                title={opt.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase">Descrição</label>
                                <textarea
                                    className="w-full bg-[#0d1f14] border border-[#23482f] rounded-lg px-4 py-2 text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-20 text-sm"
                                    placeholder="O que este núcleo faz?"
                                    value={editingBoard.description || ''}
                                    onChange={e => setEditingBoard({ ...editingBoard, description: e.target.value })}
                                />
                            </div>

                            {/* New Member Selection UI */}
                            <div className="space-y-3 pt-2 border-t border-[#23482f]">
                                <label className="text-xs font-bold text-text-muted uppercase block">Membros do Núcleo ({selectedMemberIds.length})</label>

                                {/* Selected Members Chips */}
                                {selectedMemberIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 p-3 bg-[#0d1f14] rounded-lg border border-[#23482f]/50 max-h-[100px] overflow-y-auto">
                                        {selectedMembersData.map(user => (
                                            <div key={user.id} className="flex items-center gap-2 bg-[#23482f] text-white text-xs py-1 px-2 rounded-full border border-primary/20 animate-in fade-in zoom-in duration-200">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="max-w-[100px] truncate">{user.name}</span>
                                                <button
                                                    onClick={() => toggleMember(user.id)}
                                                    className="hover:text-red-400 transition-colors ml-1"
                                                >
                                                    <span className="material-symbols-outlined text-[14px] align-middle">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Search & List */}
                                <div className="bg-[#0d1f14] border border-[#23482f] rounded-xl overflow-hidden flex flex-col h-[200px]">
                                    <div className="p-2 border-b border-[#23482f]">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                                            <input
                                                className="w-full bg-[#13261a] border border-[#23482f] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="Filtrar por nome..."
                                                value={memberSearch}
                                                onChange={e => setMemberSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
                                        {filteredUsers.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs p-4 text-center">
                                                <span className="material-symbols-outlined mb-1 opacity-50">person_off</span>
                                                Nenhum usuário encontrado.
                                            </div>
                                        ) : (
                                            filteredUsers.map(user => {
                                                const isSelected = selectedMemberIds.includes(user.id);
                                                return (
                                                    <label
                                                        key={user.id}
                                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-[#23482f]/50'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-text-muted group-hover:border-white'}`}>
                                                            {isSelected && <span className="material-symbols-outlined text-black text-[14px] font-bold">check</span>}
                                                        </div>

                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover border border-[#23482f]" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-surface-dark border border-[#23482f] flex items-center justify-center text-[10px] text-white font-bold">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                        )}

                                                        <span className={`text-sm flex-1 truncate ${isSelected ? 'text-white font-medium' : 'text-text-subtle group-hover:text-white'}`}>
                                                            {user.name}
                                                        </span>

                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isSelected}
                                                            onChange={() => toggleMember(user.id)}
                                                        />
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-text-muted italic text-center">
                                    Usuários podem pertencer a múltiplos núcleos simultaneamente.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#23482f] bg-[#0d1f14] flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-primary text-[#0d1f14] font-bold hover:bg-[#3bfd7b] transition-all shadow-lg shadow-green-500/10 text-sm"
                            >
                                Salvar Quadro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
