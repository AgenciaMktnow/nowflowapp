import { useMemo } from 'react';
import { type DailyActivityBlock } from '../../services/report.service';

interface WorkHeatmapProps {
    blocks: DailyActivityBlock[];
}

export default function WorkHeatmap({ blocks }: WorkHeatmapProps) {

    const grid = useMemo(() => {
        const matrix: { timerSeconds: number, manualSeconds: number }[][] =
            Array(7).fill(null).map(() =>
                Array(24).fill(null).map(() => ({ timerSeconds: 0, manualSeconds: 0 }))
            );

        blocks.forEach(block => {
            const start = new Date(block.startTime);
            const end = new Date(block.endTime);

            let current = new Date(start);

            while (current < end && current.getDate() === start.getDate()) {

                const day = current.getDay();
                const hour = current.getHours();

                const secondsInHour = 3600;

                if (block.type === 'MANUAL') {
                    matrix[day][hour].manualSeconds += secondsInHour;
                } else {
                    matrix[day][hour].timerSeconds += secondsInHour;
                }

                current.setHours(current.getHours() + 1);
            }
        });

        return matrix;

    }, [blocks]);

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (

        <div className="rounded-2xl border border-[#1f2937] bg-gradient-to-b from-[#0f172a] to-[#0b1120] p-6 shadow-inner overflow-x-auto">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">

                <div className="flex items-center gap-2">

                    <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                        grid_view
                    </span>

                    <h3 className="text-white font-semibold text-sm tracking-wide">
                        Mapa de Trabalho Semanal
                    </h3>

                </div>

                <span className="text-xs text-gray-500">
                    Distribuição por hora
                </span>

            </div>


            <div className="min-w-[640px]">

                <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-[2px]">

                    {/* Header Hours */}
                    <div></div>

                    {hours.map(h => (
                        <div
                            key={h}
                            className="text-[10px] text-gray-500 text-center"
                        >
                            {h}
                        </div>
                    ))}


                    {/* Rows */}
                    {days.map((dayName, dIndex) => (
                        <>
                            <div className="text-xs text-gray-400 font-medium self-center">
                                {dayName}
                            </div>

                            {grid[dIndex].map((cell, hIndex) => {

                                const total = cell.timerSeconds + cell.manualSeconds;
                                const isManual = cell.manualSeconds > cell.timerSeconds;
                                const opacity = Math.min(total / 3600, 1);

                                let bgColor = '#020617';

                                if (total > 0) {

                                    bgColor = isManual
                                        ? `rgba(56,189,248,${opacity})`
                                        : `rgba(99,102,241,${opacity})`;

                                }

                                return (
                                    <div
                                        key={hIndex}
                                        className="relative h-6 rounded-md transition-all duration-200 hover:scale-110 hover:z-10 group"
                                        style={{ backgroundColor: bgColor }}
                                    >

                                        {/* base cell */}
                                        {total === 0 && (
                                            <div className="w-full h-full bg-[#020617] border border-[#1f2937] rounded-md"></div>
                                        )}

                                        {/* Tooltip */}
                                        {total > 0 && (

                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">

                                                <div className="bg-[#070c18] border border-[#1f2937] rounded-lg shadow-xl px-3 py-2 text-xs whitespace-nowrap">

                                                    <div className="text-white font-semibold">
                                                        {dayName} {hIndex}:00
                                                    </div>

                                                    <div className="text-indigo-400">
                                                        Timer: {Math.round(cell.timerSeconds / 60)}m
                                                    </div>

                                                    <div className="text-cyan-400">
                                                        Manual: {Math.round(cell.manualSeconds / 60)}m
                                                    </div>

                                                </div>

                                            </div>

                                        )}

                                    </div>
                                );

                            })}
                        </>
                    ))}

                </div>


                {/* LEGEND */}
                <div className="flex items-center gap-6 mt-6 text-xs text-gray-500 justify-end">

                    <div className="flex items-center gap-2">

                        <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>

                        Timer

                    </div>

                    <div className="flex items-center gap-2">

                        <div className="w-3 h-3 rounded-sm bg-cyan-400"></div>

                        Manual

                    </div>

                </div>

            </div>

        </div>
    );
}