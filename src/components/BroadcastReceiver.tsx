import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function BroadcastReceiver() {
    useEffect(() => {
        // Listen for new inserts on system_announcements
        const channel = supabase
            .channel('public:system_announcements')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_announcements',
                    filter: 'is_active=eq.true'
                },
                (payload: any) => {
                    const { title, message, type } = payload.new;

                    // Show Toast with infinite duration (or long enough) until dismissed
                    // Custom styling based on type
                    toast.custom((t) => (
                        <div className={`
                            w-full p-4 rounded-xl border shadow-2xl flex items-start gap-3 relative overflow-hidden backdrop-blur-md
                            ${type === 'warning' ? 'bg-orange-950/90 border-orange-500/30' :
                                type === 'error' ? 'bg-red-950/90 border-red-500/30' :
                                    type === 'success' ? 'bg-green-950/90 border-green-500/30' :
                                        'bg-[#1A1D21]/90 border-white/10'}
                        `}>
                            {/* Icon */}
                            <div className={`p-2 rounded-lg shrink-0
                                ${type === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                                    type === 'error' ? 'bg-red-500/20 text-red-400' :
                                        type === 'success' ? 'bg-green-500/20 text-green-400' :
                                            'bg-blue-500/20 text-blue-400'}
                            `}>
                                <span className="material-symbols-outlined text-xl">
                                    {type === 'warning' ? 'warning' :
                                        type === 'error' ? 'error' :
                                            type === 'success' ? 'check_circle' :
                                                'campaign'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1
                                    ${type === 'warning' ? 'text-orange-400' :
                                        type === 'error' ? 'text-red-400' :
                                            type === 'success' ? 'text-green-400' :
                                                'text-blue-400'}
                                `}>
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-200 leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => toast.dismiss(t)}
                                className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>

                            {/* Glow Effect */}
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-20
                                ${type === 'warning' ? 'bg-orange-500' :
                                    type === 'error' ? 'bg-red-500' :
                                        type === 'success' ? 'bg-green-500' :
                                            'bg-blue-500'}
                            `}></div>
                        </div>
                    ), {
                        duration: 10000, // Show for 10 seconds
                        position: 'top-center'
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return null; // Headless component
}
