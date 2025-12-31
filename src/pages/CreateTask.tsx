import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreateTask() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [briefing, setBriefing] = useState('');
    const [priority, setPriority] = useState('medium');
    const [checklistItems, setChecklistItems] = useState<string[]>(['Revisão de requisitos iniciais', 'Configuração do ambiente de homologação']);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase.from('clients').select('id, name').order('name');
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleAddItem = () => {
        if (!newItem.trim()) return;
        setChecklistItems([...checklistItems, newItem.trim()]);
        setNewItem('');
    };

    const handleRemoveItem = (index: number) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from('tasks').insert({
                title: briefing.split('\n')[0] || 'Nova Tarefa',
                description: briefing,
                client_id: clientId || null,
                due_date: dueDate || null,
                priority: priority.toUpperCase(),
                status: 'PLANNING',
                checklist: checklistItems,
                created_by: user?.id
            });

            if (error) throw error;
            navigate('/kanban');
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Erro ao criar tarefa. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full relative overflow-hidden bg-[#102216]">
            {/* Sidebar Produtividade */}
            <div className="hidden md:flex md:w-1/3 lg:w-1/4 bg-surface-dark border-r border-surface-border flex-col p-8 justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #13ec5b 0%, transparent 60%)' }}></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2 text-white">Produtividade</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Mantenha o foco no que importa. Preencha apenas os dados essenciais para garantir que sua equipe inicie o trabalho imediatamente.</p>
                </div>
                <div className="relative z-10 mt-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-surface-border p-2 rounded-full text-primary">
                            <span className="material-symbols-outlined text-[20px]">bolt</span>
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">Rápido</p>
                            <p className="text-xs text-slate-400">Decisões em 3 segundos</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="bg-surface-border p-2 rounded-full text-primary">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">Simples</p>
                            <p className="text-xs text-slate-400">Sem campos desnecessários</p>
                        </div>
                    </div>
                </div>
                <div className="relative z-10 mt-auto pt-10">
                    <div className="h-32 w-full rounded-xl bg-cover bg-center opacity-60 mix-blend-luminosity" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuChEwBqyXmmBWebsaF4FtwXoEH70jXVO8XZTDjyJN9uxF8y-X0NoFIDGw8N8_o1HcLsCrflXxcKYUi4rcNDHD6OKttSBwEk3mDcJJXddH2UVXCVYLkXWsWLYS9R0zDKIk5E2C_VoyeioD7_xWtJK7R81muBjfQLajIueVt9BbPtrGkt5D25MSQH7RfMEklcqHXZpeVipnNBFzMWOAQwYFncERN1E9nXIHdSd4rwPsPLgrqsvWi3tzjMpW-j-c-pvJezCG984tp9nYg')" }}></div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-10 bg-[#102216] overflow-y-auto">
                <div className="w-full max-w-[640px] flex flex-col gap-6 animate-fade-in">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-surface-border">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Nova Tarefa</h1>
                            <p className="text-slate-500 mt-1 text-sm">Preencha os campos obrigatórios (*) para criar um novo card.</p>
                        </div>
                        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-surface-border">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                                    Cliente <span className="text-primary">*</span>
                                </label>
                                <div className="relative group">
                                    <select
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        required
                                        className="w-full h-14 bg-surface-dark border border-input-border rounded-xl px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer hover:border-slate-500 font-medium"
                                    >
                                        <option disabled value="">Selecione o cliente...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                                    Prazo <span className="text-primary">*</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        className="w-full h-14 bg-surface-dark border border-input-border rounded-xl px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium [color-scheme:dark]"
                                        placeholder="DD/MM/AAAA"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-300 flex items-center gap-1">
                                Briefing <span className="text-primary">*</span>
                            </label>
                            <div className="relative">
                                <textarea
                                    value={briefing}
                                    onChange={(e) => setBriefing(e.target.value)}
                                    required
                                    className="w-full min-h-[160px] bg-surface-dark border border-input-border rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-base leading-relaxed"
                                    placeholder="Descreva a tarefa de forma breve e clara. O que precisa ser entregue?"
                                ></textarea>
                                <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-surface-dark px-2 rounded-md border border-input-border py-1">
                                    Markdown suportado
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-300">Checklist</label>
                                <span className="text-xs text-slate-500">{checklistItems.length} itens</span>
                            </div>
                            <div className="w-full bg-surface-dark border border-input-border rounded-xl overflow-hidden flex flex-col group/list focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                {checklistItems.length > 0 && (
                                    <ul className="flex flex-col w-full divide-y divide-surface-border/50">
                                        {checklistItems.map((item, index) => (
                                            <li key={index} className="flex items-center justify-between px-4 py-3 hover:bg-surface-border/30 transition-colors group/item">
                                                <div className="flex items-center gap-3 w-full">
                                                    <button className="text-slate-500 hover:text-primary transition-colors" type="button">
                                                        <span className="material-symbols-outlined text-[20px]">check_box_outline_blank</span>
                                                    </button>
                                                    <span className="text-sm text-slate-200">{item}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    aria-label="Remover item"
                                                    className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 p-1"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 dark:bg-black/10 border-t border-slate-100 dark:border-surface-border/50">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">add</span>
                                    <input
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                                        className="flex-1 bg-transparent border-none p-0 text-sm text-white placeholder-slate-400 focus:ring-0"
                                        placeholder="Adicionar novo item ao checklist..."
                                        type="text"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="px-3 py-1.5 rounded-lg bg-surface-border text-slate-300 text-xs font-bold border border-input-border shadow-sm hover:text-primary hover:border-primary/50 transition-all"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-300">
                                Anexos
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input-border rounded-xl cursor-pointer bg-surface-dark hover:border-primary hover:bg-surface-border/30 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary mb-2 transition-colors">cloud_upload</span>
                                    <p className="text-sm text-slate-400"><span className="font-semibold text-primary">Clique para fazer upload</span> ou arraste e solte</p>
                                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG ou PDF (max. 10MB)</p>
                                </div>
                                <input className="hidden" multiple type="file" />
                            </label>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-300">Prioridade</label>
                            <div className="flex items-center gap-3">
                                {[
                                    { value: 'low', label: 'Baixa', color: 'blue' },
                                    { value: 'medium', label: 'Média', color: 'yellow' },
                                    { value: 'high', label: 'Alta', color: 'red' }
                                ].map((p) => (
                                    <label key={p.value} className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="priority"
                                            type="radio"
                                            value={p.value}
                                            checked={priority === p.value}
                                            onChange={(e) => setPriority(e.target.value)}
                                        />
                                        <div className={`px-4 py-2 rounded-full border border-input-border text-slate-400 text-sm font-medium transition-all hover:bg-surface-border peer-checked:bg-${p.color}-500/20 peer-checked:border-${p.color}-500 peer-checked:text-${p.color}-500`}>
                                            {p.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-surface-border">
                            <button
                                className="px-6 py-3 rounded-full text-slate-300 font-bold text-sm hover:bg-surface-border transition-colors"
                                type="button"
                                onClick={() => navigate(-1)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-[#0fd650] text-[#112217] font-bold text-sm rounded-full shadow-[0_0_15px_rgba(19,236,91,0.3)] hover:shadow-[0_0_25px_rgba(19,236,91,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                                type="submit"
                                disabled={loading}
                            >
                                <span>{loading ? 'Salvando...' : 'Criar Tarefa'}</span>
                                <span className="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>
                            </button>
                        </div>
                    </form>
                </div>
                <div className="absolute bottom-6 text-slate-400 text-xs hidden md:block opacity-50">
                    Pressione <kbd className="font-sans px-1 py-0.5 bg-surface-border rounded text-[10px]">Ctrl</kbd> + <kbd className="font-sans px-1 py-0.5 bg-surface-border rounded text-[10px]">Enter</kbd> para enviar
                </div>
            </div>
        </div>
    );
}
