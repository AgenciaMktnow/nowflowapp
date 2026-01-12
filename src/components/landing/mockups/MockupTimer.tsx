import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Clock } from 'lucide-react';

export function MockupTimer() {
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(16320); // Starts at 04:32:00
    const intervalRef = useRef<any>(null);

    const toggleTimer = () => {
        if (isRunning) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
        } else {
            setIsRunning(true);
            intervalRef.current = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative bg-[#0B0E0F] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-8 shadow-2xl w-full max-w-sm mx-auto">
                {/* Glow Effect when running */}
                {isRunning && (
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse pointer-events-none" />
                )}

                {/* Header */}
                <div className="flex items-center gap-2 text-text-muted text-sm uppercase font-bold tracking-widest">
                    <Clock size={14} />
                    <span>Time Tracking</span>
                </div>

                {/* Digital Display */}
                <div className={`text-6xl md:text-7xl font-mono font-bold tabular-nums transition-all ${isRunning ? 'text-primary drop-shadow-[0_0_15px_rgba(19,236,91,0.5)]' : 'text-white/50'}`}>
                    {formatTime(seconds)}
                </div>

                {/* Controls */}
                <div className="flex gap-4 z-10">
                    <button
                        onClick={() => {
                            setSeconds(0);
                            setIsRunning(false);
                            if (intervalRef.current) clearInterval(intervalRef.current);
                        }}
                        className="w-12 h-12 rounded-full border border-white/10 text-text-muted hover:bg-white/5 hover:text-white flex items-center justify-center transition-all active:scale-95"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <button
                        onClick={toggleTimer}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${isRunning
                            ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30'
                            : 'bg-primary text-[#0B0E0F] hover:bg-primary-dark shadow-[0_0_20px_rgba(19,236,91,0.4)]'
                            }`}
                    >
                        {isRunning
                            ? <Pause size={32} fill="currentColor" />
                            : <Play size={32} fill="currentColor" className="ml-1" />
                        }
                    </button>
                </div>

                {/* Recent Log Placeholder */}
                <div className="w-full pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs text-text-muted opacity-60">
                        <span>Última sessão</span>
                        <span>2h 14m</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
