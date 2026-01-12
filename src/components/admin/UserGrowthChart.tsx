import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthData {
    date: string;
    mrr: number;
    users: number;
    active_users: number;
}

interface UserGrowthChartProps {
    data: GrowthData[];
    isLoading?: boolean;
}

export default function UserGrowthChart({ data, isLoading }: UserGrowthChartProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-surface-panel rounded-2xl border border-white/5 animate-pulse">
                <span className="text-text-subtle text-sm">Carregando dados de usuários...</span>
            </div>
        );
    }

    // Gradient definitions
    const GradientColors = () => (
        <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
        </defs>
    );

    return (
        <div className="bg-surface-panel border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-text-subtle uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">group_add</span>
                        Crescimento de Usuários
                    </h3>
                    <p className="text-xs text-text-muted mt-1">Total vs. Ativos (30d)</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <GradientColors />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A1D21', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '4px' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                        />
                        <Area
                            type="monotone"
                            dataKey="users"
                            name="Total de Usuários"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUsers)"
                        />
                        <Area
                            type="monotone"
                            dataKey="active_users"
                            name="Usuários Ativos (30d)"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorActive)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
