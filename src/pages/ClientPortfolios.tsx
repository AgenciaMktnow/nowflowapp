import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '../components/layout/Header/Header';
import { supabase } from '../lib/supabase';

const PORTFOLIO_ORDER = ['Victor', 'Neto', 'Bruno', 'Inativos'];

type Board = {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
};

type Client = {
    id: string;
    name: string;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    status: 'ACTIVE' | 'INACTIVE';
};

type ClientLink = {
    board_id: string;
    client_id: string;
};

export default function ClientPortfolios() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [boards, setBoards] = useState<Board[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [links, setLinks] = useState<ClientLink[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const requestedBoardId = searchParams.get('boardId');

    useEffect(() => {
        const loadPortfolios = async () => {
            setLoading(true);
            const [boardsResult, clientsResult, linksResult] = await Promise.all([
                supabase.from('boards').select('id, name, description, color').in('name', PORTFOLIO_ORDER),
                supabase.from('clients').select('id, name, company_name, email, phone, status').order('name'),
                supabase.from('client_projects').select('board_id, client_id')
            ]);

            const error = boardsResult.error || clientsResult.error || linksResult.error;
            if (error) {
                console.error('Error loading client portfolios:', error);
                toast.error('Erro ao carregar as carteiras de clientes');
                setLoading(false);
                return;
            }

            const orderedBoards = [...(boardsResult.data || [])].sort((a, b) => (
                PORTFOLIO_ORDER.indexOf(a.name) - PORTFOLIO_ORDER.indexOf(b.name)
            ));

            setBoards(orderedBoards);
            setClients((clientsResult.data || []) as Client[]);
            setLinks((linksResult.data || []) as ClientLink[]);
            setLoading(false);
        };

        loadPortfolios();
    }, []);

    const clientsByBoard = useMemo(() => {
        const clientMap = new Map(clients.map(client => [client.id, client]));

        return boards.reduce<Record<string, Client[]>>((groups, board) => {
            const linkedClientIds = new Set(
                links.filter(link => link.board_id === board.id).map(link => link.client_id)
            );

            groups[board.id] = Array.from(linkedClientIds)
                .map(clientId => clientMap.get(clientId))
                .filter((client): client is Client => Boolean(client))
                .sort((a, b) => a.name.localeCompare(b.name));
            return groups;
        }, {});
    }, [boards, clients, links]);

    const selectedBoard = boards.find(board => board.id === requestedBoardId) || null;
    const selectedBoardId = selectedBoard?.id || null;
    const visibleClients = useMemo(() => {
        if (!selectedBoardId) return [];
        const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
        const boardClients = clientsByBoard[selectedBoardId] || [];
        if (!normalizedSearch) return boardClients;

        return boardClients.filter(client => (
            client.name.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
            client.company_name?.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
        ));
    }, [clientsByBoard, search, selectedBoardId]);

    return (
        <div className="flex min-h-full flex-col bg-background-dark">
            <Header title="Clientes" />

            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto w-full max-w-6xl">
                    {selectedBoard ? (
                        <>
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setSearchParams({});
                                        }}
                                        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                                        title="Voltar para carteiras"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <div className="min-w-0">
                                        <h1 className="truncate text-2xl font-bold text-white">{selectedBoard.name}</h1>
                                        <p className="text-sm text-text-muted">
                                            {(clientsByBoard[selectedBoard.id] || []).length} cliente(s)
                                        </p>
                                    </div>
                                </div>

                                <div className="relative w-full sm:w-80">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-muted">search</span>
                                    <input
                                        value={search}
                                        onChange={event => setSearch(event.target.value)}
                                        placeholder="Buscar cliente"
                                        className="w-full rounded-lg border border-white/10 bg-surface-dark py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {visibleClients.map(client => (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => navigate(`/settings/clients?clientId=${encodeURIComponent(client.id)}&returnTo=${encodeURIComponent(`/clients?boardId=${selectedBoard.id}`)}`)}
                                        className="group flex min-h-24 items-center justify-between gap-4 rounded-lg border border-white/5 bg-surface-dark p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface-highlight"
                                    >
                                        <div className="min-w-0">
                                            <h2 className="truncate font-semibold text-white">{client.name}</h2>
                                            {client.company_name && client.company_name !== client.name && (
                                                <p className="mt-1 truncate text-sm text-text-muted">{client.company_name}</p>
                                            )}
                                            {(client.email || client.phone) && (
                                                <p className="mt-2 truncate text-xs text-text-secondary">{client.email || client.phone}</p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase ${client.status === 'ACTIVE'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <span className="material-symbols-outlined shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary">chevron_right</span>
                                    </button>
                                ))}
                            </div>

                            {!loading && visibleClients.length === 0 && (
                                <div className="py-20 text-center text-text-muted">
                                    <span className="material-symbols-outlined mb-3 text-4xl opacity-40">search_off</span>
                                    <p>Nenhum cliente encontrado.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="mb-6 border-b border-white/5 pb-5">
                                <h1 className="text-2xl font-bold text-white">Carteiras de clientes</h1>
                                <p className="mt-1 text-sm text-text-muted">Selecione uma carteira para visualizar seus clientes.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {boards.map(board => {
                                    const boardClients = clientsByBoard[board.id] || [];
                                    const inactiveCount = boardClients.filter(client => client.status === 'INACTIVE').length;

                                    return (
                                        <button
                                            key={board.id}
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                setSearchParams({ boardId: board.id });
                                            }}
                                            className="group flex min-h-32 items-center gap-4 rounded-lg border border-white/5 bg-surface-dark p-5 text-left transition-colors hover:border-primary/40 hover:bg-surface-highlight"
                                        >
                                            <span
                                                className="flex size-12 shrink-0 items-center justify-center rounded-lg text-white"
                                                style={{ backgroundColor: board.color || '#235c38' }}
                                            >
                                                <span className="material-symbols-outlined">business_center</span>
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-lg font-bold text-white">{board.name}</span>
                                                <span className="mt-1 block text-sm text-text-muted">
                                                    {boardClients.length} cliente(s)
                                                    {inactiveCount > 0 && board.name !== 'Inativos' ? ` · ${inactiveCount} inativo(s)` : ''}
                                                </span>
                                            </span>
                                            <span className="material-symbols-outlined text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary">chevron_right</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {!loading && boards.length === 0 && (
                                <div className="py-20 text-center text-text-muted">Nenhuma carteira encontrada.</div>
                            )}
                        </>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-20 text-text-muted">
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
