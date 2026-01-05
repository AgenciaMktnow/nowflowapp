import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface NotificationSettings {
    notify_task_created: boolean;
    notify_task_moved: boolean;
    notify_task_returned: boolean;
    notify_new_comment: boolean;
}

export default function NotificationsSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        notify_task_created: true,
        notify_task_moved: true,
        notify_task_returned: true,
        notify_new_comment: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('user_notification_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof NotificationSettings) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));

        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_notification_settings')
                .upsert({
                    user_id: user.id,
                    [key]: newValue,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error: any) {
            toast.error('Erro ao salvar preferência: ' + error.message);
            // Rollback UI
            setSettings(prev => ({ ...prev, [key]: !newValue }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-primary">Carregando preferências...</div>;

    const navItems = [
        {
            key: 'notify_task_created',
            title: 'Criação de Tarefas',
            desc: 'Receber e-mail quando uma nova tarefa for criada ou atribuída a você.',
            icon: 'add_task'
        },
        {
            key: 'notify_task_moved',
            title: 'Movimentação de Tarefas',
            desc: 'Receber e-mail quando o status de uma tarefa sua for alterado.',
            icon: 'rocket_launch'
        },
        {
            key: 'notify_task_returned',
            title: 'Tarefa Devolvida',
            desc: 'Receber um alerta urgente quando uma tarefa retroceder no fluxo.',
            icon: 'keyboard_return'
        },
        {
            key: 'notify_new_comment',
            title: 'Novos Comentários',
            desc: 'Receber e-mail para novos comentários ou menções em suas tarefas.',
            icon: 'chat_bubble'
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col gap-1 mb-8">
                <h3 className="text-xl font-bold text-white">Preferências de Notificação</h3>
                <p className="text-sm text-text-muted">Controle quais alertas você deseja receber por e-mail.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {navItems.map((item) => (
                    <div
                        key={item.key}
                        className="bg-surface-dark/50 border border-white/5 p-6 rounded-xl flex items-center justify-between hover:bg-surface-dark transition-all duration-300 group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                                <p className="text-xs text-text-muted leading-relaxed max-w-[280px]">{item.desc}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleToggle(item.key as keyof NotificationSettings)}
                            disabled={saving}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings[item.key as keyof NotificationSettings] ? 'bg-primary' : 'bg-white/10'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background-dark shadow ring-0 transition duration-200 ease-in-out ${settings[item.key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                <p className="text-[10px] text-primary/80 leading-relaxed uppercase tracking-wider font-bold">
                    As notificações internas (sino no topo do app) continuarão ativas mesmo que o envio de e-mail esteja desligado.
                </p>
            </div>
        </div>
    );
}
