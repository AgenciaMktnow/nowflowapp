import { useState, useEffect, useRef } from 'react';

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStart, setTempStart] = useState<string>(startDate.toISOString().split('T')[0]);
    const [tempEnd, setTempEnd] = useState<string>(endDate.toISOString().split('T')[0]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync props to temp state
    useEffect(() => {
        setTempStart(startDate.toISOString().split('T')[0]);
        setTempEnd(endDate.toISOString().split('T')[0]);
    }, [startDate, endDate]);

    const handleApply = () => {
        if (tempStart && tempEnd) {
            // Create dates at noon to avoid timezone rolling
            const start = new Date(tempStart + 'T12:00:00');
            const end = new Date(tempEnd + 'T12:00:00');
            onChange(start, end);
            setIsOpen(false);
        }
    };

    const formatDateBR = (date: Date) => {
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger matches ModernDropdown style */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-surface-dark border border-gray-700 hover:border-gray-600 text-white rounded-xl px-4 py-3 transition-colors text-sm font-medium h-[46px]"
            >
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                    <span>{formatDateBR(startDate)} - {formatDateBR(endDate)}</span>
                </div>
                <span className="material-symbols-outlined text-gray-500">expand_more</span>
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-[320px] bg-surface-dark border border-gray-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex flex-col gap-4">
                        {/* Presets */}
                        <div className="grid grid-cols-3 gap-2 border-b border-gray-700 pb-3">
                            <button
                                onClick={() => {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setDate(end.getDate() - 7);
                                    onChange(start, end);
                                    setIsOpen(false);
                                }}
                                className="px-2 py-1.5 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors"
                            >
                                7 Dias
                            </button>
                            <button
                                onClick={() => {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setDate(end.getDate() - 15);
                                    onChange(start, end);
                                    setIsOpen(false);
                                }}
                                className="px-2 py-1.5 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors"
                            >
                                15 Dias
                            </button>
                            <button
                                onClick={() => {
                                    const now = new Date();
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                    onChange(start, end);
                                    setIsOpen(false);
                                }}
                                className="px-2 py-1.5 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors"
                            >
                                Mês Atual
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400 font-bold uppercase">De</label>
                                <input
                                    type="date"
                                    value={tempStart}
                                    onChange={(e) => setTempStart(e.target.value)}
                                    className="bg-background-dark border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400 font-bold uppercase">Até</label>
                                <input
                                    type="date"
                                    value={tempEnd}
                                    onChange={(e) => setTempEnd(e.target.value)}
                                    className="bg-background-dark border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-700">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 py-2 bg-primary text-[#112217] rounded-lg text-xs font-bold hover:bg-[#0fd650] transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
