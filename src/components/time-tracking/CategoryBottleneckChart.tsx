import { type CategoryMetric } from '../../services/report.service';

interface CategoryBottleneckChartProps {
    categories: CategoryMetric[];
}

export default function CategoryBottleneckChart({ categories }: CategoryBottleneckChartProps) {

    if (categories.length === 0) return null;

    const maxHours = Math.max(...categories.map(c => c.totalHours), 1);

    return (

        <div className="rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] p-6 shadow-inner">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">

                <div className="flex items-center gap-2">

                    <span className="material-symbols-outlined text-cyan-400 text-[20px]">
                        monitoring
                    </span>

                    <h3 className="text-white font-semibold text-sm tracking-wide">
                        Gargalos por Categoria
                    </h3>

                </div>

                <span className="text-xs text-gray-500">
                    Tempo acumulado por categoria
                </span>

            </div>


            {/* LIST */}
            <div className="flex flex-col gap-4">

                {categories.map((cat) => {

                    const width = (cat.totalHours / maxHours) * 100;

                    return (

                        <div
                            key={cat.category}
                            className="group transition-all"
                        >

                            {/* LABEL */}
                            <div className="flex justify-between text-xs mb-1">

                                <span className="text-gray-400 group-hover:text-gray-200 transition">
                                    {cat.category}
                                </span>

                                <span className="text-white font-mono">
                                    {cat.totalHours.toFixed(1)}h
                                </span>

                            </div>


                            {/* BAR BACKGROUND */}
                            <div className="h-2.5 w-full bg-[#020617] border border-[#1f2937] rounded-full overflow-hidden">

                                {/* BAR */}
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 transition-all duration-700 ease-out group-hover:brightness-110"
                                    style={{ width: `${width}%` }}
                                />

                            </div>

                        </div>

                    );

                })}

            </div>


            {/* FOOTER LEGEND */}
            <div className="flex items-center justify-end gap-3 mt-6 text-xs text-gray-500">

                <div className="flex items-center gap-2">

                    <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>

                    Baixo impacto

                </div>

                <div className="flex items-center gap-2">

                    <div className="w-3 h-3 rounded-sm bg-cyan-400"></div>

                    Maior gargalo

                </div>

            </div>

        </div>

    );
}