import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// --- TYPES ---
type Client = {
    id: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    default_board_id?: string;
    created_at: string;
};

type CatalogTemplate = {
    id: string; // We use one ID just for keys, but logic is name-based
    name: string;
};

type Board = {
    id: string;
    name: string;
};

// --- HELPER COMPONENTS ---

// Custom styled dropdown to match the user's specific "Neon" request
// Background: #0A1F14, Neon Border, White Text
const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder,
    label
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    label?: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-4 rounded-lg cursor-pointer flex items-center justify-between transition-all duration-300
                    bg-[#0A1F14] text-white border
                    ${isOpen
                        ? 'border-primary shadow-[0_0_15px_rgba(33,197,94,0.3)]'
                        : 'border-primary/30 hover:border-primary/60'
                    }
                `}
            >
                <span className={`font-medium ${!value ? "text-text-muted" : "text-white"}`}>
                    {value ? selectedLabel : (placeholder || 'Selecione...')}
                </span>
                <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </div>

            {/* Dropdown Menu */}
            <div className={`
                absolute z-50 left-0 right-0 mt-2 bg-[#0A1F14] border border-primary/30 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200 origin-top
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`
                                px-4 py-3 cursor-pointer text-sm transition-colors border-b border-white/5 last:border-0
                                ${value === option.value ? 'bg-primary/20 text-primary font-bold' : 'text-text-muted hover:bg-white/5 hover:text-white'}
                            `}
                        >
                            {option.label}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="p-4 text-center text-xs text-text-muted">Nenhuma opção disponível</div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function ClientManagement() {
    // --- STATE ---
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');

    // Data
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [boards, setBoards] = useState<Board[]>([]);
    const [catalogTemplates, setCatalogTemplates] = useState<CatalogTemplate[]>([]);

    // Editor
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [clientProjectNames, setClientProjectNames] = useState<Set<string>>(new Set());

    // --- EFFECTS ---
    useEffect(() => {
        fetchClients();
        fetchBoards();
        fetchCatalogTemplates();
    }, []);

    // --- FETCH FUNCTIONS ---
    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Erro ao carregar clientes.');
        }
    };

    const fetchBoards = async () => {
        try {
            const { data } = await supabase.from('boards').select('id, name').order('name');
            if (data) setBoards(data);
        } catch (error) {
            console.error('Error fetching boards:', error);
        }
    };

    const fetchCatalogTemplates = async () => {
        try {
            // REFINED LOGIC: Fetch ALL projects
            // We want to show a catalog of ALL unique project names, 
            // regardless of whether they are 'Global' (client_id=null) or 'Instances' (client_id=set).
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) throw error;

            // Deduplicate by Name
            // If multiple projects have the name "Website", only show it once in the catalog.
            const uniqueMap = new Map<string, CatalogTemplate>();
            data?.forEach(p => {
                if (!uniqueMap.has(p.name)) {
                    uniqueMap.set(p.name, p);
                }
            });

            setCatalogTemplates(Array.from(uniqueMap.values()));
        } catch (error) {
            console.error('Error fetching catalog:', error);
            toast.error('Erro ao carregar o catálogo de serviços.');
        }
    };

    // --- EDITOR LOGIC ---
    const openClient = async (client: Client) => {
        setSelectedClient(client);
        setSelectedBoardId(client.default_board_id || '');

        if (client.id !== 'new') {
            const { data } = await supabase
                .from('projects')
                .select('name')
                .eq('client_id', client.id);

            const existingNames = new Set(data?.map(p => p.name) || []);
            setClientProjectNames(existingNames);
        } else {
            setClientProjectNames(new Set());
        }

        setViewMode('DETAIL');
    };

    const handleCreateNewClient = () => {
        openClient({
            id: 'new',
            name: '',
            status: 'ACTIVE',
            created_at: new Date().toISOString()
        });
    };

    const handleBack = () => {
        setViewMode('LIST');
        setSelectedClient(null);
    };

    const toggleProject = (templateName: string) => {
        setClientProjectNames(prev => {
            const next = new Set(prev);
            if (next.has(templateName)) next.delete(templateName);
            else next.add(templateName);
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedClient) return;
        if (!selectedClient.name.trim()) {
            toast.error('O nome do cliente é obrigatório.');
            return;
        }
        if (!selectedBoardId) {
            toast.error('O Quadro (Board) é obrigatório.');
            return;
        }

        try {
            let clientId = selectedClient.id;

            // 1. Upsert Client
            const clientData = {
                name: selectedClient.name,
                status: selectedClient.status,
                default_board_id: selectedBoardId
            };

            if (clientId === 'new') {
                const { data, error } = await supabase.from('clients').insert([clientData]).select().single();
                if (error) throw error;
                clientId = data.id;
            } else {
                const { error } = await supabase.from('clients').update(clientData).eq('id', clientId);
                if (error) throw error;
            }

            // 2. Sync Projects (Enforcing Board ID)
            const { data: existingProjects } = await supabase
                .from('projects')
                .select('id, name')
                .eq('client_id', clientId);

            const existingNames = new Set(existingProjects?.map(p => p.name) || []);
            const targetNames = clientProjectNames;

            const toAdd = [...targetNames].filter(name => !existingNames.has(name));
            const toRemove = [...existingNames].filter(name => !targetNames.has(name));
            const toUpdateBoard = existingProjects?.filter(p => targetNames.has(p.name)) || [];

            // Remove unselected
            if (toRemove.length > 0) {
                await supabase.from('projects').delete().eq('client_id', clientId).in('name', toRemove);
            }

            // Create new (with board_id)
            if (toAdd.length > 0) {
                await supabase.from('projects').insert(toAdd.map(name => ({
                    name,
                    client_id: clientId,
                    board_id: selectedBoardId
                })));
            }

            // Update existing (switch board/team if changed)
            if (toUpdateBoard.length > 0) {
                await supabase
                    .from('projects')
                    .update({
                        board_id: selectedBoardId,
                    })
                    .eq('client_id', clientId)
                    .in('id', toUpdateBoard.map(p => p.id));
            }

            toast.success('Cliente salvo com sucesso!');
            await fetchClients();
            handleBack();

        } catch (error: any) {
            console.error(error);
            toast.error(`Erro ao salvar: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        if (!selectedClient || selectedClient.id === 'new') return;
        if (!confirm(`Excluir ${selectedClient.name}?`)) return;

        try {
            const { error } = await supabase.from('clients').delete().eq('id', selectedClient.id);
            if (error) throw error;
            toast.success('Cliente excluído.');
            await fetchClients();
            handleBack();
        } catch (error: any) {
            toast.error(error.message);
        }
    };


    // --- VIEW --
    if (viewMode === 'LIST') {
        const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

        return (
            <div className="flex flex-col h-full w-full animate-fade-in-up">
                <header className="flex-none pb-6">
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div>
                            <h1 className="text-white text-3xl font-bold tracking-tight">Gerenciar Clientes</h1>
                            <p className="text-text-muted mt-1 text-sm">Controle de clientes e serviços.</p>
                        </div>
                        <button
                            onClick={handleCreateNewClient}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-light text-background-dark font-bold py-3 px-6 rounded-full shadow-[0_4px_20px_rgba(0,255,0,0.2)]"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Novo Cliente
                        </button>
                    </div>
                </header>

                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">search</span>
                    <input
                        className="w-full bg-background-dark/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-text-muted focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
                    {filteredClients.map(client => (
                        <div
                            key={client.id}
                            onClick={() => openClient(client)}
                            className="group bg-surface-dark p-6 rounded-xl border border-white/5 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,0,0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-full bg-background-dark border border-white/10 flex items-center justify-center text-lg font-bold text-text-muted group-hover:text-primary transition-colors">
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${client.status === 'ACTIVE' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-text-muted border-white/10'}`}>
                                    {client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{client.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!selectedClient) return null;

    return (
        <div className="flex flex-col h-full w-full animate-fade-in-up pb-32">
            <header className="flex-none pb-6 flex items-center gap-4">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-lg bg-surface-dark border border-white/10 text-white hover:border-primary/50 hover:text-primary transition-colors flex items-center gap-2 px-4 shadow-lg active:scale-95 group"
                >
                    <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Voltar
                </button>
                <div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">{selectedClient.id === 'new' ? 'Novo Cadastro' : selectedClient.name}</h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- CARD ESQUERDA --- */}
                <div className="space-y-6">
                    <section className="bg-surface-dark p-6 rounded-xl border border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            Dados Principais
                        </h3>

                        <div className="space-y-8"> {/* Increased spacing */}
                            {/* NAME INPUT */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Nome do Cliente</label>
                                <input
                                    className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-4 text-white focus:border-primary/50 transition-all outline-none focus:shadow-[0_0_15px_rgba(0,255,0,0.1)]"
                                    value={selectedClient.name}
                                    placeholder="Ex: Acme Corporation"
                                    onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                                />
                            </div>

                            {/* CUSTOM BOARD SELECT */}
                            <div>
                                <CustomSelect
                                    label={<><span className="material-symbols-outlined text-[16px]">view_kanban</span> Quadro (Board)</>}
                                    options={boards.map(b => ({ value: b.id, label: b.name }))}
                                    value={selectedBoardId}
                                    onChange={setSelectedBoardId}
                                    placeholder="Selecione o Quadro..."
                                />
                            </div>

                            {/* CUSTOM STATUS SELECT */}

                            {/* CUSTOM STATUS SELECT */}
                            <div>
                                <CustomSelect
                                    label="Status do Cliente"
                                    options={[
                                        { value: 'ACTIVE', label: 'Ativo' },
                                        { value: 'INACTIVE', label: 'Inativo' }
                                    ]}
                                    value={selectedClient.status}
                                    onChange={(val) => setSelectedClient({ ...selectedClient, status: val as any })}
                                />
                            </div>
                        </div>
                    </section>

                    {selectedClient.id !== 'new' && (
                        <button onClick={handleDelete} className="w-full py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-bold flex items-center justify-center gap-2 border border-dashed border-red-500/20">
                            <span className="material-symbols-outlined">delete_forever</span>
                            Excluir Cliente
                        </button>
                    )}
                </div>

                {/* --- CARD DIREITA (CATALOGO) --- */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-surface-dark p-6 rounded-xl border border-primary/20 relative overflow-hidden min-h-[400px]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>

                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">local_offer</span>
                                Serviços Contratados
                            </h3>
                            <div className="px-3 py-1 bg-[#0A1F14] rounded-full text-xs font-bold text-primary border border-primary/30 shadow-[0_0_10px_rgba(33,197,94,0.1)]">
                                Catálogo Global
                            </div>
                        </div>
                        <p className="text-sm text-text-muted mb-6">
                            Estes serviços serão criados no Quadro selecionado ao lado.
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                            {catalogTemplates.length === 0 ? (
                                <div className="py-12 text-center text-text-muted border border-dashed border-white/10 rounded-xl bg-background-dark/30">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_off</span>
                                    <p>O catálogo de serviços está vazio.</p>
                                    <p className="text-xs text-primary mt-2 cursor-pointer hover:underline" onClick={handleBack}>Adicionar em Projetos</p>
                                </div>
                            ) : (
                                catalogTemplates.map(template => {
                                    const isSelected = clientProjectNames.has(template.name);

                                    return (
                                        <div
                                            key={template.id}
                                            onClick={() => toggleProject(template.name)}
                                            className={`
                                                cursor-pointer flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 select-none group
                                                ${isSelected
                                                    ? 'bg-[#0A1F14] border-primary text-white shadow-[0_0_15px_rgba(33,197,94,0.15)]'
                                                    : 'bg-background-dark/40 border-white/5 text-text-muted hover:bg-[#0A1F14] hover:border-primary/40 hover:text-white'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-6 h-6 rounded flex items-center justify-center border transition-all duration-300
                                                ${isSelected
                                                    ? 'bg-primary border-primary text-[#0A1F14]'
                                                    : 'border-white/20 group-hover:border-primary/50'
                                                }
                                            `}>
                                                {isSelected && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                            </div>

                                            <div className="flex-1">
                                                <h4 className={`font-bold text-lg transition-colors ${isSelected ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>
                                                    {template.name}
                                                </h4>
                                            </div>

                                            {isSelected && (
                                                <div className="text-xs font-bold text-primary flex items-center gap-1 opacity-80 animate-fade-in">
                                                    <span className="material-symbols-outlined text-[14px]">link</span>
                                                    Vinculado
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

            </div>

            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-light text-background-dark font-bold py-3 px-8 rounded-full shadow-[0_4px_20px_rgba(0,255,0,0.3)] hover:shadow-[0_4px_25px_rgba(0,255,0,0.4)] transition-all hover:scale-105 active:scale-95 border border-primary/20"
                >
                    <span className="material-symbols-outlined font-bold">save</span>
                    Salvar e Voltar
                </button>
            </div>

        </div>
    );
}
