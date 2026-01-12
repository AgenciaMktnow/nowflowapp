import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthData {
    date: string;
    mrr: number;
    users: number;
    active_users: number;
}

interface RevenueGrowthChartProps {
    data: GrowthData[];
    isLoading?: boolean;
}

export default function RevenueGrowthChart({ data, isLoading }: RevenueGrowthChartProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-surface-panel rounded-2xl border border-white/5 animate-pulse">
                <span className="text-text-subtle text-sm">Carregando dados financeiros...</span>
            </div>
        );
    }

    // Gradient definitions
    const GradientColors = () => (
        <defs>
            <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00FF00" stopOpacity={0} />
            </linearGradient>
        </defs>
    );

    return (
        <div className="bg-surface-panel border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-text-subtle uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400">trending_up</span>
                        Crescimento de MRR
                    </h3>
                    <p className="text-xs text-text-muted mt-1">Recorrência Mensal (Últimos 30 dias)</p>
                </div>
                <div className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                        +12.5% <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                    </span>
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
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A1D21', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '4px' }}
                            formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'MRR']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                        />
                        <Area
                            type="monotone"
                            dataKey="mrr"
                            stroke="#00FF00"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorMrr)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
