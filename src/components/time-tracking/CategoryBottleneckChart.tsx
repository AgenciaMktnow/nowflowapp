
import { type CategoryMetric } from '../../services/report.service';

interface CategoryBottleneckChartProps {
    categories: CategoryMetric[];
}

export default function CategoryBottleneckChart({ categories }: CategoryBottleneckChartProps) {
    if (categories.length === 0) return null;

    const maxHours = Math.max(...categories.map(c => c.totalHours), 1);

    return (
        <div className="bg-surface-dark border border-gray-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-white text-md font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-400">pie_chart</span>
                Gargalos por Categoria
            </h3>

            <div className="flex flex-col gap-3">
                {categories.map((cat) => {
                    const width = (cat.totalHours / maxHours) * 100;
                    return (
                        <div key={cat.category} className="group">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{cat.category}</span>
                                <span className="text-white font-mono">{cat.totalHours.toFixed(1)}h</span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${width}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
