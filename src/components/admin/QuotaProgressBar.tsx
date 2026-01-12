

interface QuotaProgressBarProps {
    current: number;
    max?: number; // Optional because Enterprise might be null/unlimited
    label?: string; // e.g. "users"
    showText?: boolean;
    compact?: boolean;
}

export function QuotaProgressBar({ current, max, label, showText = true, compact = false }: QuotaProgressBarProps) {
    // If no limit or unlimited, assume safe
    if (!max || max > 99999) {
        return (
            <div className="flex flex-col w-full">
                {showText && <span className="text-xs text-text-muted mb-1">{current} (Ilimitado)</span>}
                <div className={`w-full bg-white/5 rounded-full ${compact ? 'h-1' : 'h-1.5'}`}>
                    <div className={`h-full rounded-full bg-blue-500 w-[1%]`} />
                </div>
            </div>
        );
    }

    const percentage = Math.min(100, (current / max) * 100);

    // Color Logic
    let colorClass = 'bg-primary'; // Greenish
    if (percentage >= 100) colorClass = 'bg-red-500';
    else if (percentage >= 80) colorClass = 'bg-yellow-500';

    return (
        <div className="flex flex-col w-full max-w-[120px]">
            {showText && (
                <div className="flex justify-between text-[10px] uppercase font-bold text-text-subtle mb-1">
                    <span>{current} de {max} {label}</span>
                </div>
            )}
            <div className={`w-full bg-white/5 rounded-full ${compact ? 'h-1' : 'h-1.5'} overflow-hidden`}>
                <div
                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
