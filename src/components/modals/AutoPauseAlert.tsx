import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AutoPauseAlert() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [alertLog, setAlertLog] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userProfile?.id) {
            checkStatus();
        }
    }, [userProfile?.id]);

    const checkStatus = async () => {
        try {
            const { data, error } = await supabase.rpc('check_auto_pause_status', {
                p_user_id: userProfile?.id
            });

            if (data && !error) {
                setAlertLog(data);
            }
        } catch (error) {
            console.error('Error checking auto-pause status:', error);
        }
    };

    const handleDismiss = async () => {
        if (!alertLog) return;
        setIsLoading(true);
        try {
            // First dismiss the alert in backend
            // For now we just update the local state or call a dismiss RPC if we implemented it
            // The logic in migration was "update alert_dismissed = true" or similar.
            // Let's assume we do a local dismiss visually, but ideally we should flag it in DB so it doesn't reappear on refresh.

            // Implementing DB update directly for simplicity as per migration plan
            await supabase.from('time_logs')
                .update({ alert_dismissed: true } as any)
                .eq('id', alertLog.id);

            setAlertLog(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdjust = async () => {
        await handleDismiss(); // Dismiss alert first
        if (alertLog?.task_id) {
            navigate(`/tasks/${alertLog.task_id}`);
        }
    };

    if (!alertLog) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-[#101512] border border-yellow-500/30 rounded-xl shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-yellow-500/10 bg-yellow-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                            <span className="material-symbols-outlined text-yellow-500">timer_pause</span>
                        </div>
                        Timer Pausado
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 leading-relaxed text-sm">
                        O sistema detectou uma atividade excessivamente longa e pausou seu timer automaticamente para manter a precisão dos registros.
                    </p>

                    <div className="bg-[#0A0F0D] rounded-lg p-4 border border-white/5 flex items-center justify-between group hover:border-yellow-500/30 transition-colors cursor-pointer" onClick={handleAdjust}>
                        <div>
                            <span className="block text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Total Registrado</span>
                            <span className="text-2xl font-mono font-bold text-white group-hover:text-yellow-500 transition-colors">
                                {Math.floor((alertLog.duration_seconds || 0) / 3600)}h {Math.floor(((alertLog.duration_seconds || 0) % 3600) / 60)}m
                            </span>
                        </div>
                        <span className="material-symbols-outlined text-white/20 group-hover:text-yellow-500 transition-colors">arrow_forward</span>
                    </div>

                    <p className="text-xs text-yellow-500/70 italic">
                        * Recomendamos revisar este lançamento.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#0A0F0D] border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={handleDismiss}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-xs uppercase tracking-wider"
                    >
                        Entendido
                    </button>
                    <button
                        onClick={handleAdjust}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Ajustar Tempo
                    </button>
                </div>
            </div>
        </div>
    );
}
