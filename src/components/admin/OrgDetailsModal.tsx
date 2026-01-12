import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { toast } from 'sonner';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-background-elevated rounded-xl border border-border mt-10 shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-background-card rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">monitoring</span>
                            Raio-X da Organização
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-text-subtle font-mono">{orgId.slice(0, 8)}...</span>
                            {details && (
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${details.profit_margin >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    Margem: R$ {details.profit_margin}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tabs */}
                        <div className="flex bg-background-input/50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-background-elevated text-white shadow-sm' : 'text-text-subtle hover:text-white'}`}
                            >
                                Geral
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'logs' ? 'bg-background-elevated text-white shadow-sm' : 'text-text-subtle hover:text-white'}`}
                            >
                                Logs
                            </button>
                        </div>

                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-text-subtle">Carregando dados...</span>
                        </div>
                    ) : details ? (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Profitability Line */}
                                    <div className="bg-background-card p-4 rounded-xl border border-border flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                                <span className="material-symbols-outlined">payments</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase text-text-subtle">Financeiro (Estimado)</div>
                                                <div className="text-sm text-white">
                                                    Custo Infra <span className="text-red-400 font-bold">R$ {details.estimated_cost}</span> vs
                                                    Valor Plano <span className="text-green-400 font-bold">R$ {details.plan_value}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-text-subtle uppercase font-bold">Saldo</div>
                                            <div className={`text-xl font-bold ${details.profit_margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {details.profit_margin >= 0 ? '+' : ''} R$ {details.profit_margin}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-background-card p-5 rounded-xl border border-border hover:border-border-hover transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                                    <span className="material-symbols-outlined text-xl">database</span>
                                                </div>
                                                <div className="text-xs font-bold uppercase text-text-subtle">Banco de Dados</div>
                                            </div>
                                            <div className="text-2xl font-bold text-white mb-1">{details.db_rows?.toLocaleString()}</div>
                                            <div className="text-xs text-text-muted">registros totais</div>
                                        </div>

                                        <div className="bg-background-card p-5 rounded-xl border border-border hover:border-border-hover transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                                    <span className="material-symbols-outlined text-xl">cloud</span>
                                                </div>
                                                <div className="text-xs font-bold uppercase text-text-subtle">Storage</div>
                                            </div>
                                            <div className="text-2xl font-bold text-white mb-1">{details.storage_mb} MB</div>
                                            <div className="text-xs text-text-muted">anexos armazenados</div>
                                        </div>

                                        <div className="bg-background-card p-5 rounded-xl border border-border hover:border-border-hover transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                                    <span className="material-symbols-outlined text-xl">group</span>
                                                </div>
                                                <div className="text-xs font-bold uppercase text-text-subtle">Engajamento (30d)</div>
                                            </div>
                                            <div className="text-2xl font-bold text-white mb-1">{details.active_users_30d}</div>
                                            <div className="text-xs text-text-muted">usuários ativos</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div>
                                    <div className="bg-background-card rounded-xl border border-border overflow-hidden">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-border text-text-subtle bg-background-elevated/50">
                                                    <th className="p-4 font-medium text-xs uppercase">Ação</th>
                                                    <th className="p-4 font-medium text-xs uppercase">Usuário</th>
                                                    <th className="p-4 font-medium text-xs uppercase">Detalhe / Tarefa</th>
                                                    <th className="p-4 font-medium text-xs uppercase text-right">Data</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {details.recent_logs?.map((log: any, i: number) => (
                                                    <tr key={i} className="border-b border-border/50 hover:bg-background-elevated/50 transition-colors">
                                                        <td className="p-4 font-bold text-white">{log.action_type}</td>
                                                        <td className="p-4 text-text-light">{log.user_email || 'Sistema'}</td>
                                                        <td className="p-4 text-text-muted truncate max-w-[200px]">{log.task_title || '-'}</td>
                                                        <td className="p-4 text-right text-text-subtle text-xs font-mono">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {details.recent_logs?.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-text-muted">Nenhuma atividade recente encontrada.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-red-400 p-8">Falha ao carregar dados.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
