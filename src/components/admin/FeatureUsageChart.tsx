import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureUsage {
    feature_name: string;
    usage_count: number;
}

interface FeatureUsageChartProps {
    data: FeatureUsage[];
    isLoading?: boolean;
}

export default function FeatureUsageChart({ data, isLoading }: FeatureUsageChartProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-surface-panel rounded-2xl border border-white/5 animate-pulse">
                <span className="text-text-subtle text-sm">Carregando uso de features...</span>
            </div>
        );
    }

    // Colors for bars
    const COLORS = ['#00FF00', '#3B82F6', '#F59E0B', '#A855F7', '#EC4899'];

    return (
        <div className="bg-surface-panel border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-text-subtle uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">equalizer</span>
                        Mapa de Calor (Uso de Features)
                    </h3>
                    <p className="text-xs text-text-muted mt-1">Onde os usuários gastam mais tempo</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="feature_name"
                            type="category"
                            width={150}
                            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1A1D21', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="usage_count" name="Interações" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
