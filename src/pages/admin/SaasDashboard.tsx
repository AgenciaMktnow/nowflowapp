import { useState, useEffect } from 'react';
import { adminService, type SaasMetric } from '../../services/admin.service';
import OrgDetailsModal from '../../components/admin/OrgDetailsModal';
import { QuotaProgressBar } from '../../components/admin/QuotaProgressBar';
import { toast } from 'sonner';

export default function SaasDashboard() {
    const [metrics, setMetrics] = useState<SaasMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        setLoading(true);
        const { data, error } = await adminService.getSaasMetrics();
        if (error) {
            toast.error('Acesso Negado ou Erro ao carregar dados.');
        } else if (data) {
            setMetrics(data);
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
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-background-card px-4 py-2 rounded-xl border border-border-green/30">
                        <span className="text-text-subtle text-xs uppercase font-bold">Total ARR (Est.)</span>
                        <span className="text-xl font-bold text-white">R$ --</span>
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
