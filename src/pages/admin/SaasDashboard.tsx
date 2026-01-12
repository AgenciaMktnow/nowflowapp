import { useState, useEffect } from 'react';
import { adminService, type SaasMetric, type SystemStats } from '../../services/admin.service';
import OrgDetailsModal from '../../components/admin/OrgDetailsModal';
import { QuotaProgressBar } from '../../components/admin/QuotaProgressBar';
import { toast } from 'sonner';

export default function SaasDashboard() {
    const [metrics, setMetrics] = useState<SaasMetric[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        setLoading(true);
        const [metricsRes, statsRes] = await Promise.all([
            adminService.getSaasMetrics(),
            adminService.getSystemStats()
        ]);

        if (metricsRes.error) {
            toast.error('Acesso Negado ou Erro ao carregar dados.');
        } else if (metricsRes.data) {
            setMetrics(metricsRes.data);
        }

        if (statsRes.data) {
            setSystemStats(statsRes.data);
        } else {
            // Mock data if fetch fails (fallback/dev mode)
            // or simply keep null
            console.log("Stats fetch unavailable or null");
        }

        setLoading(false);
    };

    const handlePlanChange = async (e: React.MouseEvent, orgId: string, newPlan: string, currentStatus: string) => {
        e.stopPropagation();
        const { error } = await adminService.updateOrgPlan(orgId, newPlan, currentStatus);
        if (error) toast.error('Erro ao atualizar plano');
        else {
            toast.success(`Plano atualizado para ${newPlan}`);
            loadMetrics(); // Reload to confirm
        }
    };

    const handleStatusChange = async (e: React.MouseEvent, orgId: string, currentPlan: string, newStatus: string) => {
        e.stopPropagation();
        const { error } = await adminService.updateOrgPlan(orgId, currentPlan, newStatus);
        if (error) toast.error('Erro ao atualizar status');
        else {
            toast.success(`Status atualizado para ${newStatus}`);
            loadMetrics();
        }
    };

    // Derived KPIs
    const totalOrgs = metrics.length;
    const totalUsers = metrics.reduce((acc, curr) => acc + curr.user_count, 0);
    const activeOrgs = metrics.filter(m => m.status === 'active' || m.status === 'trialing').length;

    const filteredMetrics = metrics.filter(m =>
        m.org_name.toLowerCase().includes(filter.toLowerCase()) ||
        m.owner_email.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="flex h-screen items-center justify-center text-text-muted">Carregando God Mode...</div>;

    return (
        <div className="min-h-screen bg-background-dark p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">admin_panel_settings</span>
                        God Mode: SaaS Admin
                    </h1>
                    <p className="text-text-subtle mt-1">Visão geral de todas as organizações e performance do sistema.</p>
                </div>
            </div>

            {/* Global Infrastructure Status - Energy Board */}
            <div className="mb-8 bg-[#121214] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">memory</span>
                    Status Global da Infraestrutura
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Database Health */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-400">database</span>
                                <div>
                                    <div className="text-xs font-bold uppercase text-text-subtle">Database Size</div>
                                    <div className="text-2xl font-bold text-white">
                                        {systemStats ? (systemStats.db_size_bytes / 1024 / 1024).toFixed(1) : '--'} <span className="text-sm font-normal text-text-muted">MB</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-text-muted mb-1">Limite Plano Free</div>
                                <div className="text-sm font-bold text-white">500 MB</div>
                            </div>
                        </div>
                        <QuotaProgressBar
                            current={systemStats ? (systemStats.db_size_bytes / 1024 / 1024) : 0}
                            max={500}
                            label="MB"
                            showText={false}
                        />
                        <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Custo Excedente: $0.125/GB</span>
                            {systemStats && (systemStats.db_size_bytes / 1024 / 1024) > 500 ? (
                                <span className="text-red-400 font-bold animate-pulse">Upgrade Requerido</span>
                            ) : (
                                <span className="text-green-400">Dentro da Cota</span>
                            )}
                        </div>
                    </div>

                    {/* Storage Health */}
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-400">cloud_upload</span>
                                <div>
                                    <div className="text-xs font-bold uppercase text-text-subtle">Storage Size</div>
                                    <div className="text-2xl font-bold text-white">
                                        {systemStats ? (systemStats.storage_size_bytes / 1024 / 1024).toFixed(1) : '--'} <span className="text-sm font-normal text-text-muted">MB</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-text-muted mb-1">Limite Plano Free</div>
                                <div className="text-sm font-bold text-white">1024 MB</div>
                            </div>
                        </div>
                        <QuotaProgressBar
                            current={systemStats ? (systemStats.storage_size_bytes / 1024 / 1024) : 0}
                            max={1024}
                            label="MB"
                            showText={false}
                        />
                        <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Custo Excedente: $0.021/GB</span>
                            {systemStats && (systemStats.storage_size_bytes / 1024 / 1024) > 1024 ? (
                                <span className="text-red-400 font-bold animate-pulse">Upgrade Requerido</span>
                            ) : (
                                <span className="text-green-400">Dentro da Cota</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-background-card p-6 rounded-2xl border border-border-green/20">
                    <div className="text-text-subtle text-xs font-bold uppercase mb-2">Total Organizações</div>
                    <div className="text-3xl font-display font-bold text-white">{totalOrgs}</div>
                </div>
                <div className="bg-background-card p-6 rounded-2xl border border-border-green/20">
                    <div className="text-text-subtle text-xs font-bold uppercase mb-2">Empresas Ativas</div>
                    <div className="text-3xl font-display font-bold text-primary">{activeOrgs}</div>
                </div>
                <div className="bg-background-card p-6 rounded-2xl border border-border-green/20">
                    <div className="text-text-subtle text-xs font-bold uppercase mb-2">Total Usuários</div>
                    <div className="text-3xl font-display font-bold text-blue-400">{totalUsers}</div>
                </div>
                <div className="bg-background-card p-6 rounded-2xl border border-border-green/20">
                    <div className="text-text-subtle text-xs font-bold uppercase mb-2">Saúde Storage</div>
                    <div className="text-3xl font-display font-bold text-text-muted">Safe</div>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar por Empresa ou Email do Dono..."
                    className="w-full max-w-md bg-background-card border border-border-green/30 rounded-xl px-4 py-2 text-white placeholder-text-subtle focus:outline-none focus:border-primary"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            {/* Data Grid */}
            <div className="bg-background-card rounded-2xl border border-border-green/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-green/20 bg-white/5">
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle">Empresa</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle">Dono (Admin)</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle text-center">Plano</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle text-center">Status</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle text-center">Usuários</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle text-center">Quadros</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle text-center">Tarefas (7d)</th>
                                <th className="p-4 text-xs font-bold uppercase text-text-subtle text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMetrics.map((org) => (
                                <tr
                                    key={org.org_id}
                                    onClick={() => setSelectedOrgId(org.org_id)}
                                    className="border-b border-border-green/10 hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-white group-hover:text-primary transition-colors">{org.org_name}</div>
                                        <div className="text-xs text-text-subtle font-mono">{org.org_id.slice(0, 8)}...</div>
                                    </td>
                                    <td className="p-4 text-text-light text-sm">{org.owner_email}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold 
                                            ${org.plan_type === 'ENTERPRISE' ? 'bg-purple-500/20 text-purple-400' :
                                                org.plan_type === 'PRO' ? 'bg-primary/20 text-primary' :
                                                    'bg-gray-700 text-gray-400'}`}>
                                            {org.plan_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize
                                            ${org.status === 'active' ? 'text-green-400' :
                                                org.status === 'trialing' ? 'text-yellow-400' :
                                                    'text-red-400'}`}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-text-muted">
                                        <div className="flex justify-center">
                                            <QuotaProgressBar current={org.user_count} max={org.max_users} label="users" compact />
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-text-muted">
                                        <div className="flex justify-center">
                                            <QuotaProgressBar current={org.board_count} max={org.max_boards} label="boards" compact />
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold ${org.tasks_last_7d === 0 ? 'text-red-400' : 'text-white'}`}>
                                            {org.tasks_last_7d}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => handlePlanChange(e, org.org_id, 'ENTERPRISE', org.status)}
                                                className="text-xs text-text-subtle hover:text-white border border-transparent hover:border-white/20 px-2 py-1 rounded"
                                                title="Promover para Enterprise"
                                            >
                                                👑
                                            </button>
                                            <button
                                                onClick={(e) => handleStatusChange(e, org.org_id, org.plan_type, org.status === 'active' ? 'suspended' : 'active')}
                                                className="text-xs text-text-subtle hover:text-red-400 border border-transparent hover:border-red-400/20 px-2 py-1 rounded"
                                                title={org.status === 'active' ? 'Suspender' : 'Reativar'}
                                            >
                                                🚫
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detail X-Ray */}
            <OrgDetailsModal
                orgId={selectedOrgId}
                onClose={() => setSelectedOrgId(null)}
            />
        </div>
    );
}
