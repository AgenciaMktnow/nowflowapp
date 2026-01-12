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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-[#121214] rounded-2xl border border-border-green/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-green/10 bg-[#1A1A1E]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">monitoring</span>
                            Raio-X da Organização
                        </h2>
                        <p className="text-sm text-text-subtle font-mono mt-1">{orgId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-text-subtle">Carregando dados sensíveis...</span>
                        </div>
                    ) : details ? (
                        <div className="space-y-8">

                            {/* Top Cards: Consumption */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#0A0A0B] p-5 rounded-xl border border-border-green/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <span className="material-symbols-outlined text-xl">database</span>
                                        </div>
                                        <div className="text-xs font-bold uppercase text-text-subtle">Banco de Dados</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{details.db_rows?.toLocaleString()} <span className="text-sm text-text-muted font-normal">registros</span></div>
                                    <div className="text-xs text-text-muted flex gap-2">
                                        <span>{details.task_count} tasks</span>
                                        <span>•</span>
                                        <span>{details.comment_count} comments</span>
                                    </div>
                                </div>

                                <div className="bg-[#0A0A0B] p-5 rounded-xl border border-border-green/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                            <span className="material-symbols-outlined text-xl">cloud</span>
                                        </div>
                                        <div className="text-xs font-bold uppercase text-text-subtle">Storage & Custo</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{details.storage_mb} <span className="text-sm text-text-muted font-normal">MB</span></div>
                                    <div className="text-xs text-emerald-400 font-bold mt-1">Est. Custo: R$ {details.estimated_cost}</div>
                                </div>

                                <div className="bg-[#0A0A0B] p-5 rounded-xl border border-border-green/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                            <span className="material-symbols-outlined text-xl">group</span>
                                        </div>
                                        <div className="text-xs font-bold uppercase text-text-subtle">Engajamento (30d)</div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{details.active_users_30d} <span className="text-sm text-text-muted font-normal">usuários ativos</span></div>
                                    <div className="text-xs text-text-muted">Power Users detectados</div>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg text-text-subtle">history</span>
                                    Últimas Atividades (Log Auditável)
                                </h3>
                                <div className="bg-[#0A0A0B] rounded-xl border border-border-green/10 overflow-hidden">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-white/5 text-text-subtle">
                                                <th className="p-4 font-normal">Ação</th>
                                                <th className="p-4 font-normal">Usuário</th>
                                                <th className="p-4 font-normal">Tarefa</th>
                                                <th className="p-4 font-normal text-right">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.recent_logs?.map((log: any, i: number) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="p-4 font-bold text-white">{log.action_type}</td>
                                                    <td className="p-4 text-text-light">{log.user_email || 'Sistema'}</td>
                                                    <td className="p-4 text-text-muted truncate max-w-[200px]">{log.task_title}</td>
                                                    <td className="p-4 text-right text-text-subtle text-xs font-mono">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {details.recent_logs?.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-text-muted">Nenhuma atividade recente.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center text-red-400 p-8">Falha ao carregar dados.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
