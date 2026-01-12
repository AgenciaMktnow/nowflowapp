import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { toast } from 'sonner';
import { QuotaProgressBar } from './QuotaProgressBar';

interface OrgDetailsModalProps {
    orgId: string | null;
    onClose: () => void;
}

export default function OrgDetailsModal({ orgId, onClose }: OrgDetailsModalProps) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

    useEffect(() => {
        if (orgId) {
            loadDetails();
        }
    }, [orgId]);

    const loadDetails = async () => {
        if (!orgId) return;
        setLoading(true);
        const { data, error } = await adminService.getOrgDetails(orgId);
        if (error) toast.error('Erro ao carregar raio-x');
        else setDetails(data);
        setLoading(false);
    };

    if (!orgId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="w-full max-w-5xl bg-[#121214] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header Section */}
                <div className="flex flex-col border-b border-white/5 bg-[#121214]">
                    <div className="flex items-center justify-between p-6 pb-2">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-3xl">monitoring</span>
                                Raio-X da Organização
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm font-mono text-text-subtle bg-white/5 px-2 py-1 rounded">ID: {orgId}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Styled Tabs (Underline Style) */}
                    <div className="flex px-6 gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'overview' ? 'border-primary text-white' : 'border-transparent text-text-subtle hover:text-text-light'}`}
                        >
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'logs' ? 'border-primary text-white' : 'border-transparent text-text-subtle hover:text-text-light'}`}
                        >
                            Log de Auditoria
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#0F1115]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-50">
                            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm uppercase font-bold tracking-widest text-text-subtle">Carregando Dados...</span>
                        </div>
                    ) : details ? (
                        <div className="space-y-8">

                            {activeTab === 'overview' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

                                    {/* IDENTITY & METRICS SUMMARY */}
                                    <div className="bg-[#121214] rounded-xl border border-white/10 p-5 shadow-lg relative overflow-hidden">
                                        {/* Decorative gradient */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">

                                            {/* Owner */}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Dono (Admin)</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                        {details.owner_email ? details.owner_email[0].toUpperCase() : '?'}
                                                    </div>
                                                    <span className="text-sm font-medium text-white truncate max-w-[120px]" title={details.owner_email}>
                                                        {details.owner_email?.split('@')[0]}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Plan */}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Plano Atual</span>
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${details.plan_type === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        details.plan_type === 'PRO' ? 'bg-primary/10 text-primary border-primary/20' :
                                                            'bg-gray-800 text-gray-400 border-gray-700'
                                                        }`}>
                                                        {details.plan_type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Status</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${details.status === 'active' ? 'bg-green-500 animate-pulse' :
                                                        details.status === 'trialing' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}></span>
                                                    <span className="text-sm font-medium text-white capitalize">{details.status}</span>
                                                </div>
                                            </div>

                                            {/* Users */}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Total Usuários</span>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-lg font-display font-bold text-white">{details.total_users || 0}</span>
                                                    <QuotaProgressBar current={details.total_users} max={details.max_users} compact showText={false} />
                                                    <span className="text-[10px] text-text-muted">{details.total_users} de {details.max_users || 'Inf'}</span>
                                                </div>
                                            </div>

                                            {/* Boards */}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Quadros</span>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-lg font-display font-bold text-white">{details.board_count || 0}</span>
                                                    <QuotaProgressBar current={details.board_count} max={details.max_boards} compact showText={false} />
                                                    <span className="text-[10px] text-text-muted">{details.board_count} de {details.max_boards || 'Inf'}</span>
                                                </div>
                                            </div>

                                            {/* Tasks */}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Total Tarefas</span>
                                                <span className="text-lg font-display font-bold text-white">{details.task_count || 0}</span>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Financial & Health Strip */}
                                    <div className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30 text-green-400">
                                                <span className="material-symbols-outlined text-2xl">payments</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">Health Financeiro</div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-display font-bold text-white">
                                                        R$ {details.plan_value}
                                                    </span>
                                                    <span className="text-sm text-text-subtle">/mês</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px md:h-12 w-full md:w-px bg-white/10"></div>

                                        {/* Plan Health Summary */}
                                        <div className="flex-1 flex justify-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-bold uppercase text-text-subtle mb-1">Saúde do Plano</span>
                                                {(() => {
                                                    const uP = details.max_users ? (details.total_users / details.max_users) : 0;
                                                    const bP = details.max_boards ? (details.board_count / details.max_boards) : 0;
                                                    const maxP = Math.max(uP, bP) * 100;
                                                    let color = 'text-green-400';
                                                    let msg = 'Uso Saudável';
                                                    if (maxP >= 100) { color = 'text-red-400'; msg = 'Plano Esgotado'; }
                                                    else if (maxP >= 80) { color = 'text-yellow-400'; msg = 'Risco de Gargalo'; }

                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xl font-bold ${color}`}>{Math.round(maxP)}% de Capacidade</span>
                                                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white border border-white/10 uppercase tracking-widest">{msg}</span>
                                                        </div>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => {
                                                        const p = details.plan_type === 'FREE' ? 'PRO' : 'ENTERPRISE';
                                                        const txt = `Olá! Notamos que sua organização atingiu ${Math.round(Math.max((details.total_users / details.max_users || 0), (details.board_count / details.max_boards || 0)) * 100)}% da capacidade do plano atual. Recomendamos o upgrade para o plano ${p} para evitar interrupções.`;
                                                        navigator.clipboard.writeText(txt);
                                                        toast.success('Proposta copiada para área de transferência!');
                                                    }}
                                                    className="mt-2 text-xs text-primary hover:text-white underline decoration-dashed cursor-pointer"
                                                >
                                                    Gerar Proposta de Upgrade
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px md:h-12 w-full md:w-px bg-white/10"></div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <div className="text-xs font-bold uppercase text-text-subtle mb-1">Margem de Lucro</div>
                                                <div className={`text-xl font-bold ${details.profit_margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {details.profit_margin >= 0 ? '+' : ''} R$ {details.profit_margin}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* High Density Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                        {/* DATABASE CARD (Blue) */}
                                        <div className="bg-[#121214] border-t-4 border-t-blue-500 p-6 rounded-xl shadow-lg hover:bg-white/5 transition-colors group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Database</div>
                                                    <h3 className="text-white font-bold">Consumo de Linhas</h3>
                                                </div>
                                                <span className="material-symbols-outlined text-blue-500/50 group-hover:text-blue-400 text-3xl transition-colors">database</span>
                                            </div>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <span className="text-4xl font-display font-bold text-white">{details.db_rows?.toLocaleString()}</span>
                                                <span className="text-sm text-text-subtle">linhas</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                                                <div className="flex justify-between text-xs text-text-muted">
                                                    <span>Tarefas</span>
                                                    <span className="text-white">{details.task_count?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-text-muted">
                                                    <span>Comentários</span>
                                                    <span className="text-white">{details.comment_count?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* STORAGE CARD (Orange) */}
                                        <div className="bg-[#121214] border-t-4 border-t-orange-500 p-6 rounded-xl shadow-lg hover:bg-white/5 transition-colors group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">Storage</div>
                                                    <h3 className="text-white font-bold">Armazenamento (S3)</h3>
                                                </div>
                                                <span className="material-symbols-outlined text-orange-500/50 group-hover:text-orange-400 text-3xl transition-colors">cloud_upload</span>
                                            </div>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <span className="text-4xl font-display font-bold text-white">{details.storage_mb}</span>
                                                <span className="text-sm text-text-subtle">MB utilizados</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <QuotaProgressBar current={details.storage_mb} max={details.max_storage_mb || 2048} label="MB" showText={false} />
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span className="text-text-muted">Custo R$ 0.20/GB</span>
                                                    {(() => {
                                                        const limit = details.max_storage_mb || 2048;
                                                        const daysActive = Math.max(1, (new Date().getTime() - new Date(details.created_at).getTime()) / (1000 * 3600 * 24));
                                                        const dailyGrowth = details.storage_mb / daysActive;
                                                        const daysLeft = (limit - details.storage_mb) / (dailyGrowth || 1);

                                                        if (details.storage_mb > limit) return <span className="text-red-400 font-bold">Limite Excedido!</span>;
                                                        if (daysLeft < 30) return <span className="text-yellow-400 font-bold">Esgota em {Math.ceil(daysLeft)} dias</span>;
                                                        return <span className="text-green-400">Crescimento Saudável</span>;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ENGAGEMENT CARD (Purple) */}
                                        <div className="bg-[#121214] border-t-4 border-t-purple-500 p-6 rounded-xl shadow-lg hover:bg-white/5 transition-colors group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">Engajamento</div>
                                                    <h3 className="text-white font-bold">Usuários Ativos (MAU)</h3>
                                                </div>
                                                <span className="material-symbols-outlined text-purple-500/50 group-hover:text-purple-400 text-3xl transition-colors">group</span>
                                            </div>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <span className="text-4xl font-display font-bold text-white">{details.active_users_30d}</span>
                                                <span className="text-sm text-text-subtle">usuários (30d)</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span>Monitoramento em tempo real</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-[#121214] rounded-xl border border-white/10 overflow-hidden shadow-lg">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Últimas 50 Atividades</h3>
                                        </div>
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10 text-text-subtle">
                                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Ação</th>
                                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Usuário</th>
                                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Detalhe</th>
                                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Data</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {details.recent_logs?.map((log: any, i: number) => (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                        <td className="p-4">
                                                            <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-white/5 text-white border border-white/10 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                                                {log.action_type}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-white font-medium">{log.user_email?.split('@')[0]}</div>
                                                            <div className="text-xs text-text-subtle">{log.user_email}</div>
                                                        </td>
                                                        <td className="p-4 text-text-muted truncate max-w-[250px] font-mono text-xs">
                                                            {log.task_title || log.details || '-'}
                                                        </td>
                                                        <td className="p-4 text-right text-text-subtle text-xs font-mono">
                                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!details.recent_logs || details.recent_logs.length === 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="p-12 text-center text-text-muted">
                                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history_toggle_off</span>
                                                            <p>Nenhuma atividade recente registrada.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-red-400">
                            <span className="material-symbols-outlined text-4xl">error_outline</span>
                            <span>Não foi possível carregar os dados. Tente novamente.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
