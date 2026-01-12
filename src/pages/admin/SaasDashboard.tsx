import { useState, useEffect } from 'react';
import { adminService, type SaasMetric, type SystemStats } from '../../services/admin.service';
import OrgDetailsModal from '../../components/admin/OrgDetailsModal';
import { QuotaProgressBar } from '../../components/admin/QuotaProgressBar';
import Header from '../../components/layout/Header/Header';
import { toast } from 'sonner';

export default function SaasDashboard() {
    const [metrics, setMetrics] = useState<SaasMetric[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'infrastructure' | 'financial'>('infrastructure');

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

    // Derived KPIs
    const totalOrgs = metrics.length;
    const totalUsers = metrics.reduce((acc, curr) => acc + curr.user_count, 0);
    const activeOrgs = metrics.filter(m => m.status === 'active' || m.status === 'trialing').length;

    const filteredMetrics = metrics.filter(m =>
        m.org_name.toLowerCase().includes(filter.toLowerCase()) ||
        m.owner_email.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="flex h-screen items-center justify-center text-text-muted bg-background-elevated">Carregando Admin Console...</div>;

    return (
        <div className="min-h-screen bg-background-elevated">
            {/* Standard Header */}
            <Header
                title="SaaS Console"
                rightElement={
                    <div className="flex items-center gap-2 bg-surface-mixed px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="text-text-subtle text-[10px] uppercase font-bold tracking-widest">Total ARR</span>
                        <span className="text-sm font-bold text-white">R$ --</span>
                    </div>
                }
            />

            <div className="p-8 max-w-[1600px] mx-auto">
                {/* Tab Navigation */}
                <div className="mb-8 flex gap-2 border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('infrastructure')}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'infrastructure'
                            ? 'text-primary'
                            : 'text-text-subtle hover:text-text-light'
                            }`}
                    >
                        Infraestrutura
                        {activeTab === 'infrastructure' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'financial'
                            ? 'text-primary'
                            : 'text-text-subtle hover:text-text-light'
                            }`}
                    >
                        Financeiro
                        {activeTab === 'financial' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                        )}
                    </button>
                </div>

                {/* Infrastructure Tab Content */}
                {activeTab === 'infrastructure' && (
                    <>
                        {/* Global Infrastructure Status - Energy Board */}
                        <div className="mb-8 bg-surface-panel border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <h2 className="text-sm font-bold text-text-subtle uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
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
                                    <div className="flex justify-between items-center text-xs h-5">
                                        <span className="text-text-muted flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                            Custo excedente: $0.125/GB
                                        </span>
                                        {systemStats && (systemStats.db_size_bytes / 1024 / 1024) > 500 ? (
                                            <span className="text-red-400 font-bold animate-pulse flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-[16px]">priority_high</span> Upgrade Requerido
                                            </span>
                                        ) : (
                                            <span className="text-green-400 font-bold flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span> Dentro da Cota
                                            </span>
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
                                    <div className="flex justify-between items-center text-xs h-5">
                                        <span className="text-text-muted flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                            Custo excedente: $0.021/GB
                                        </span>
                                        {systemStats && (systemStats.storage_size_bytes / 1024 / 1024) > 1024 ? (
                                            <span className="text-red-400 font-bold animate-pulse flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-[16px]">priority_high</span> Upgrade Requerido
                                            </span>
                                        ) : (
                                            <span className="text-green-400 font-bold flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span> Dentro da Cota
                                            </span>
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

                        {/* Header Actions & Filter */}
                        <div className="mb-6 flex justify-between items-center">
                            <div className="relative w-full max-w-sm group">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar empresa ou email..."
                                    className="w-full bg-[#1A1D21] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Data Grid */}
                        <div className="bg-background-card rounded-2xl border border-border-green/20 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider">Empresa</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider">Dono (Admin)</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-center">Cadastro</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-center">Plano</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-center">Status</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-center">Uso</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMetrics.map((org) => (
                                            <tr
                                                key={org.org_id}
                                                onClick={() => setSelectedOrgId(org.org_id)}
                                                className="border-b border-border-green/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                            >
                                                <td className="p-4">
                                                    <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">{org.org_name}</div>
                                                    <div className="text-[10px] text-text-subtle font-mono mt-0.5 opacity-50">{org.org_id.slice(0, 8)}...</div>
                                                </td>
                                                <td className="p-4 text-text-light text-sm">{org.owner_email}</td>
                                                <td className="p-4 text-center text-xs text-text-muted">
                                                    {new Date(org.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                            ${org.plan_type === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                            org.plan_type === 'PRO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                'bg-white/5 text-gray-400 border border-white/10'}`}>
                                                        {org.plan_type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5
                                            ${org.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                            org.status === 'trialing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${org.status === 'active' ? 'bg-green-400' : org.status === 'trialing' ? 'bg-blue-400' : 'bg-red-400'}`}></span>
                                                        {org.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center text-text-muted">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <div className="w-24">
                                                            <QuotaProgressBar current={org.user_count} max={org.max_users} label="users" compact showText={false} />
                                                        </div>
                                                        <span className="text-[10px] opacity-60">{org.user_count} users</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Acessar a conta de ${org.org_name}?`)) {
                                                                    localStorage.setItem('impersonate_org_id', org.org_id);
                                                                    window.location.href = '/dashboard';
                                                                }
                                                            }}
                                                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all"
                                                            title="Acessar Conta (Impersonate)"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </button>

                                                        <button
                                                            onClick={(e) => handlePlanChange(e, org.org_id, 'ENTERPRISE', org.status)}
                                                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-text-subtle hover:text-yellow-400 transition-all"
                                                            title="Promover para Enterprise"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">workspace_premium</span>
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
                    </>
                )}

                {/* Financial Tab Content */}
                {activeTab === 'financial' && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* MRR Total */}
                            <div className="bg-surface-panel border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                        <span className="material-symbols-outlined text-2xl">payments</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-text-subtle tracking-wider">MRR Total</div>
                                        <div className="text-2xl font-bold text-white font-display">
                                            R$ {metrics.reduce((acc, org) => {
                                                if (org.status !== 'active') return acc;
                                                const price = org.plan_type === 'ENTERPRISE' ? 299 : org.plan_type === 'PRO' ? 99 : 0;
                                                return acc + price;
                                            }, 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Custo Operacional */}
                            <div className="bg-surface-panel border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                        <span className="material-symbols-outlined text-2xl">trending_down</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-text-subtle tracking-wider">Custo Operacional</div>
                                        <div className="text-2xl font-bold text-white font-display">
                                            R$ {metrics.reduce((acc, org) => {
                                                const storageCost = (org.storage_size_mb / 1024) * 0.50;
                                                const userCost = org.user_count * 0.50;
                                                return acc + storageCost + userCost;
                                            }, 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Margem Bruta */}
                            <div className="bg-surface-panel border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <span className="material-symbols-outlined text-2xl">analytics</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-text-subtle tracking-wider">Margem Bruta</div>
                                        <div className="text-2xl font-bold text-white font-display">
                                            {(() => {
                                                const revenue = metrics.reduce((acc, org) => {
                                                    if (org.status !== 'active') return acc;
                                                    const price = org.plan_type === 'ENTERPRISE' ? 299 : org.plan_type === 'PRO' ? 99 : 0;
                                                    return acc + price;
                                                }, 0);
                                                const cost = metrics.reduce((acc, org) => {
                                                    const storageCost = (org.storage_size_mb / 1024) * 0.50;
                                                    const userCost = org.user_count * 0.50;
                                                    return acc + storageCost + userCost;
                                                }, 0);
                                                const margin = revenue > 0 ? ((revenue - cost) / revenue * 100) : 0;
                                                return `${margin.toFixed(1)}%`;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profitability Table */}
                        <div className="bg-background-card rounded-2xl border border-border-green/20 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider">Empresa</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-center">Plano</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-right">Receita</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-right">Custo Infra</th>
                                            <th className="p-4 text-[10px] font-bold uppercase text-text-subtle tracking-wider text-right">Margem Líquida</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMetrics.map((org) => {
                                            const revenue = org.status === 'active' ? (org.plan_type === 'ENTERPRISE' ? 299 : org.plan_type === 'PRO' ? 99 : 0) : 0;
                                            const storageCost = (org.storage_size_mb / 1024) * 0.50;
                                            const userCost = org.user_count * 0.50;
                                            const totalCost = storageCost + userCost;
                                            const margin = revenue > 0 ? ((revenue - totalCost) / revenue * 100) : 0;

                                            return (
                                                <tr
                                                    key={org.org_id}
                                                    className="border-b border-border-green/5 hover:bg-white/5 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedOrgId(org.org_id)}
                                                >
                                                    <td className="p-4">
                                                        <div className="font-bold text-white text-sm">{org.org_name}</div>
                                                        <div className="text-[10px] text-text-subtle mt-0.5">{org.user_count} users • {(org.storage_size_mb / 1024).toFixed(2)} GB</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                        ${org.plan_type === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                                org.plan_type === 'PRO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                    'bg-white/5 text-gray-400 border border-white/10'}`}>
                                                            {org.plan_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-white">R$ {revenue.toFixed(2)}</td>
                                                    <td className="p-4 text-right text-text-muted">R$ {totalCost.toFixed(2)}</td>
                                                    <td className="p-4 text-right">
                                                        <span className={`px-2 py-1 rounded-lg font-bold text-sm
                                                        ${margin > 70 ? 'bg-green-500/10 text-green-400' :
                                                                margin < 30 ? 'bg-orange-500/10 text-orange-400' :
                                                                    'text-white'}`}>
                                                            {margin.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
