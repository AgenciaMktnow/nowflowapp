
import { useMemo } from 'react';
import { type DailyActivityBlock } from '../../services/report.service';

interface WorkHeatmapProps {
    blocks: DailyActivityBlock[];
}

export default function WorkHeatmap({ blocks }: WorkHeatmapProps) {
    // Generate 7 days x 24 hours grid
    // Filter blocks for the current displayed week (assuming blocks are filtered by date range in parent)

    // We map blocks to (DayOfWeek, Hour).
    // Day 0 = Sunday, 1 = Monday...

    const grid = useMemo(() => {
        const matrix: { timerSeconds: number, manualSeconds: number }[][] = Array(7).fill(null).map(() =>
            Array(24).fill(null).map(() => ({ timerSeconds: 0, manualSeconds: 0 }))
        );

        blocks.forEach(block => {
            const start = new Date(block.startTime);
            const end = new Date(block.endTime);

            // Simplified: Just mark the start hour? Or distribute duration?
            // Distributing duration is better but complex for a quick component.
            // Let's mark the hour of the start time and subsequent hours if duration > 1h.

            let current = new Date(start);
            // Limit loop to avoid infinite if end is wrong
            while (current < end && current.getDate() === start.getDate()) { // Only same day for simplicity of this row
                const day = current.getDay();
                const hour = current.getHours();

                // Add up to 1 hour (3600s) or remaining duration
                // For heatmap intensity, we just need to know "Was there work?".
                // Let's add seconds to the bucket.
                const secondsInHour = 3600; // Approximation

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
        <div className="bg-surface-dark border border-gray-800 rounded-2xl p-5 shadow-lg overflow-x-auto">
            <h3 className="text-white text-md font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">grid_on</span>
                Mapa de Trabalho Semanal
            </h3>

            <div className="min-w-[600px]">
                <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-1">
                    {/* Header Hours */}
                    <div className="text-xs text-gray-500"></div>
                    {hours.map(h => (
                        <div key={h} className="text-[10px] text-gray-500 text-center">{h}</div>
                    ))}

                    {/* Rows */}
                    {days.map((dayName, dIndex) => (
                        <>
                            <div className="text-xs text-gray-400 font-medium self-center">{dayName}</div>
                            {grid[dIndex].map((cell, hIndex) => {
                                const total = cell.timerSeconds + cell.manualSeconds;
                                const isManual = cell.manualSeconds > cell.timerSeconds;
                                const opacity = Math.min(total / 3600, 1); // Max opacity if full hour

                                let bgColor = 'bg-gray-800/50';
                                if (total > 0) {
                                    bgColor = isManual ? `rgba(250, 204, 21, ${opacity})` : `rgba(74, 222, 128, ${opacity})`; // Yellow vs Green
                                }

                                return (
                                    <div
                                        key={hIndex}
                                        className={`h-6 rounded-sm transition-all hover:scale-125 relative group`}
                                        style={{ backgroundColor: total > 0 ? bgColor : undefined }}
                                    >
                                        <div className={`w-full h-full ${total === 0 ? 'bg-gray-800/30' : ''} rounded-sm`}></div>

                                        {/* Tooltip */}
                                        {total > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-black border border-gray-700 p-2 rounded text-xs whitespace-nowrap">
                                                <div className="font-bold text-white">{dayName} {hIndex}:00</div>
                                                <div className="text-green-400">Timer: {Math.round(cell.timerSeconds / 60)}m</div>
                                                <div className="text-yellow-400">Manual: {Math.round(cell.manualSeconds / 60)}m</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 justify-end">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> Timer</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-sm"></div> Manual</div>
                </div>
            </div>
        </div>
    );
}
