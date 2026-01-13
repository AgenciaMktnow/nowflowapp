import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { settingsService, type SystemSettings } from '../../services/settings.service';
import ModernDropdown from '../../components/ModernDropdown';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

export default function GeneralSettings() {
    const { refreshSettings } = useSettings();
    const { can } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Partial<SystemSettings>>({
        company_name: '',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        focus_goal_hours: 6.0,
        daily_journey_hours: 8.0,
        first_day_of_week: 'MONDAY',
        work_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        weekly_workload_hours: 44,
        timezone: 'America/Sao_Paulo',
        theme_preference: 'DARK',
        favicon_url: '',
        timer_auto_pause_enabled: false,
        timer_max_hours: 8,
        timer_action: 'PAUSE_AND_NOTIFY'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await settingsService.getSettings();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            await settingsService.updateSettings(settings);
            await refreshSettings(); // Update global context immediately
            toast.success('Configurações salvas com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        }
    };

    const { userProfile } = useAuth();
    const isAdmin = userProfile?.role === 'ADMIN';

    // Permission Checks
    const canAutoPause = can('auto_pause');
    const canWorkload = can('workload_management');

    const handleUpgrade = () => {
        window.open('https://api.whatsapp.com/send?phone=5511999999999&text=Quero%20fazer%20upgrade%20para%20o%20Plano%20PRO%20do%20NowFlow', '_blank');
    };

    if (loading) return <div className="p-8 text-center text-primary">Carregando configurações...</div>;



    return (
        <div className="space-y-8 animate-fade-in-up pb-32">
            {!isAdmin && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3 text-yellow-500">
                    <span className="material-symbols-outlined">lock</span>
                    <p className="text-sm font-medium">Apenas administradores podem alterar as configurações do sistema. Você está em modo de visualização.</p>
                </div>
            )}

            {/* Section: Produtividade & Metas */}

            {/* Section: Produtividade & Metas */}
            <section className="bg-surface-dark p-6 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]"></div>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary/80">monitoring</span>
                    </div>
                    Métricas de Produtividade
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group/input">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Jornada Diária</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={settings.daily_journey_hours}
                                onChange={e => handleChange('daily_journey_hours', parseFloat(e.target.value))}
                                disabled={!isAdmin}
                                className={`w-full bg-background-dark/50 border border-white/10 rounded-lg pl-4 pr-16 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-bold tracking-wider pointer-events-none">HORAS</span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2">Capacidade total da equipe.</p>
                    </div>

                    <div className="group/input">
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Meta de Foco</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={settings.focus_goal_hours}
                                onChange={e => handleChange('focus_goal_hours', parseFloat(e.target.value))}
                                disabled={!isAdmin}
                                className={`w-full bg-background-dark/50 border border-white/10 rounded-lg pl-4 pr-16 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-bold tracking-wider pointer-events-none">HORAS</span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2">Meta de "Deep Work" diário.</p>
                    </div>
                </div>
            </section >

            {/* Section: Regras de Negócio do Timer */}
            <section className={`bg-surface-dark p-6 rounded-xl border shadow-sm relative overflow-hidden transition-all duration-500 ${!canAutoPause ? 'border-white/5 opacity-80' : 'border-primary/20 hover:border-primary/40'}`}>
                {!canAutoPause && (
                    <div className="absolute inset-0 bg-background-dark/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <button onClick={handleUpgrade} className="flex flex-col items-center gap-2 group-lock cursor-pointer hover:scale-105 transition-transform">
                            <div className="rounded-full bg-background-dark border border-primary/50 p-4 shadow-[0_0_20px_rgba(19,236,91,0.2)]">
                                <span className="material-symbols-outlined text-primary text-3xl">lock</span>
                            </div>
                            <span className="bg-primary text-[#0B0E0F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recurso PRO</span>
                            <span className="text-white text-sm font-bold underline decoration-primary decoration-2 underline-offset-4">Fazer Upgrade</span>
                        </button>
                    </div>
                )}
                <div className={`absolute top-0 left-0 w-1 h-full ${!canAutoPause ? 'bg-white/10' : 'bg-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]'}`}></div>

                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${!canAutoPause ? 'bg-white/5 border-white/10' : 'bg-primary/10 border-primary/20'}`}>
                            <span className={`material-symbols-outlined ${!canAutoPause ? 'text-text-muted' : 'text-primary/80'}`}>timer_off</span>
                        </div>
                        Regras de Negócio do Timer
                    </h3>
                    {!canAutoPause && <span className="text-[10px] font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded border border-white/10">STARTER/FREE</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                        {/* Toggle Principal */}
                        <div className={`flex items-center justify-between p-4 bg-background-dark/50 rounded-lg border transition-colors ${!canAutoPause ? 'border-white/5' : 'border-white/5 hover:border-white/10'}`}>
                            <div>
                                <span className="block text-sm font-bold text-white">Ativar Pausa Automática</span>
                                <span className="text-xs text-text-muted">Monitorar timers excessivamente longos</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.timer_auto_pause_enabled}
                                    onChange={e => isAdmin && canAutoPause && handleChange('timer_auto_pause_enabled', e.target.checked)}
                                    disabled={!isAdmin || !canAutoPause}
                                />
                                <div className={`w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-[0_0_10px_rgba(0,255,0,0.2)] ${!isAdmin || !canAutoPause ? 'opacity-60' : ''}`}></div>
                            </label>
                        </div>

                        {/* Configurações Condicionais */}
                        <div className={`space-y-4 transition-all duration-300 ${settings.timer_auto_pause_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="group/input">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Limite Contínuo (Horas)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={`w-full bg-background-dark/50 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all ${!isAdmin || !canAutoPause ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={settings.timer_max_hours}
                                        onChange={e => handleChange('timer_max_hours', parseInt(e.target.value))}
                                        disabled={!isAdmin || !canAutoPause}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">HRS</span>
                                </div>
                            </div>

                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Ação ao Atingir Limite</label>
                            <div className={!isAdmin || !canAutoPause ? 'opacity-60 pointer-events-none' : ''}>
                                <ModernDropdown
                                    options={[
                                        { id: 'PAUSE_AND_NOTIFY', name: 'Pausar e Notificar Usuário' },
                                        { id: 'NOTIFY_ADMIN', name: 'Apenas Notificar Admin' }
                                    ]}
                                    value={settings.timer_action || 'PAUSE_AND_NOTIFY'}
                                    onChange={(val) => isAdmin && canAutoPause && handleChange('timer_action', val)}
                                    icon="bolt"
                                    placeholder="Selecione a ação"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-background-dark/50 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center relative min-h-[220px]">
                        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20 text-[10px] text-yellow-500 font-bold uppercase">Modal Preview</div>

                        <div className="bg-surface-card p-4 rounded-lg shadow-2xl border border-primary/30 max-w-[240px] transform scale-95 opacity-90 hover:scale-100 hover:opacity-100 transition-all duration-300">
                            <div className="size-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto mb-3 border border-yellow-500/30">
                                <span className="material-symbols-outlined">timer_pause</span>
                            </div>
                            <h5 className="text-white font-bold text-sm mb-1">Timer Pausado</h5>
                            <p className="text-[10px] text-text-muted leading-tight mb-3">Seu timer excedeu {settings.timer_max_hours || 8}h e foi pausado automaticamente pelo sistema.</p>
                            <button className="w-full py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 hover:bg-primary/20 transition-colors">Ajustar Tempo</button>
                        </div>

                        <p className="text-[10px] text-text-muted/60 mt-4 max-w-[200px]">O usuário receberá este alerta ao abrir o app caso seu timer tenha sido interrompido.</p>
                    </div>
                </div>
            </section>

            {/* Section: Calendário */}
            <section className={`bg-surface-dark p-6 rounded-xl border shadow-sm relative overflow-hidden transition-all duration-500 ${!canWorkload ? 'border-white/5 opacity-80' : 'border-primary/20 hover:border-primary/40'}`}>
                {!canWorkload && (
                    <div className="absolute inset-0 bg-background-dark/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <button onClick={handleUpgrade} className="flex flex-col items-center gap-2 group-lock cursor-pointer hover:scale-105 transition-transform">
                            <div className="rounded-full bg-background-dark border border-primary/50 p-4 shadow-[0_0_20px_rgba(19,236,91,0.2)]">
                                <span className="material-symbols-outlined text-primary text-3xl">lock</span>
                            </div>
                            <span className="bg-primary text-[#0B0E0F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recurso PRO</span>
                            <span className="text-white text-sm font-bold underline decoration-primary decoration-2 underline-offset-4">Fazer Upgrade</span>
                        </button>
                    </div>
                )}
                <div className={`absolute top-0 left-0 w-1 h-full ${!canWorkload ? 'bg-white/10' : 'bg-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]'}`}></div>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${!canWorkload ? 'bg-white/5 border-white/10' : 'bg-primary/10 border-primary/20'}`}>
                        <span className={`material-symbols-outlined ${!canWorkload ? 'text-text-muted' : 'text-primary/80'}`}>calendar_clock</span>
                    </div>
                    Calendário & Horários
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Início</label>
                            <input
                                type="time"
                                value={settings.business_hours_start}
                                onChange={e => handleChange('business_hours_start', e.target.value)}
                                disabled={!isAdmin || !canWorkload}
                                className={`w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 [color-scheme:dark] ${!isAdmin || !canWorkload ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Fim</label>
                            <input
                                type="time"
                                value={settings.business_hours_end}
                                onChange={e => handleChange('business_hours_end', e.target.value)}
                                disabled={!isAdmin || !canWorkload}
                                className={`w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 [color-scheme:dark] ${!isAdmin || !canWorkload ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Days of Week Checklist */}
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Dias de Trabalho</label>
                            <div className="flex flex-wrap gap-2">
                                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day, index) => {
                                    const dbDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                                    const dbValue = dbDays[index];
                                    const isSelected = settings.work_days?.includes(dbValue);

                                    return (
                                        <button
                                            key={dbValue}
                                            onClick={() => {
                                                if (!isAdmin || !canWorkload) return;
                                                const current = settings.work_days || [];
                                                const newDays = isSelected
                                                    ? current.filter(d => d !== dbValue)
                                                    : [...current, dbValue];
                                                handleChange('work_days', newDays);
                                            }}
                                            disabled={!isAdmin || !canWorkload}
                                            className={`size-9 rounded-lg text-[10px] font-bold transition-all duration-200 border ${isSelected
                                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                                                : 'bg-background-dark/50 border-white/5 text-text-muted hover:border-white/20'
                                                } ${!isAdmin || !canWorkload ? 'cursor-not-allowed opacity-60' : ''}`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Fuso e Carga Horária */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group/input">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Fuso Horário</label>
                                <div className="relative">
                                    <select
                                        value={settings.timezone}
                                        onChange={e => handleChange('timezone', e.target.value)}
                                        disabled={!isAdmin}
                                        className={`w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </span>
                                </div>
                            </div>

                            <div className="group/input">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Carga Semanal</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={settings.weekly_workload_hours || 44}
                                        onChange={e => handleChange('weekly_workload_hours', parseFloat(e.target.value))}
                                        disabled={!isAdmin || !canWorkload}
                                        className={`w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 ${!isAdmin || !canWorkload ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-bold tracking-wider pointer-events-none">HRS</span>
                                </div>
                                {/* Average Calc */}
                                <p className="text-[9px] text-text-muted mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">info</span>
                                    Média: <span className="text-primary font-bold">
                                        {settings.work_days && settings.work_days.length > 0
                                            ? ((settings.weekly_workload_hours || 44) / settings.work_days.length).toFixed(1)
                                            : '0'}h
                                    </span> por dia útil.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fixed Save Button - Elegant & Refined */}
            {isAdmin && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-light text-background-dark font-bold py-3 px-6 rounded-full shadow-[0_4px_20px_rgba(0,255,0,0.2)] hover:shadow-[0_4px_25px_rgba(0,255,0,0.3)] transition-all hover:scale-105 active:scale-95 border border-primary/20"
                    >
                        <span className="material-symbols-outlined font-bold">save</span>
                        Salvar Configurações
                    </button>
                </div>
            )}
        </div >
    );
}
