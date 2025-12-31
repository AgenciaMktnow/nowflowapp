import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { settingsService, type SystemSettings } from '../../services/settings.service';
import ModernDropdown from '../../components/ModernDropdown';
import { useSettings } from '../../contexts/SettingsContext';

export default function GeneralSettings() {
    const { refreshSettings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Partial<SystemSettings>>({
        company_name: '',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        focus_goal_hours: 6.0,
        daily_journey_hours: 8.0,
        first_day_of_week: 'MONDAY',
        timezone: 'America/Sao_Paulo',
        theme_preference: 'DARK',
        favicon_url: ''
    });

    const fileInputRefDark = useRef<HTMLInputElement>(null);
    const fileInputRefFavicon = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo-dark' | 'logo-light' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading('Enviando arquivo...', { id: 'upload' });
            const url = await settingsService.uploadAsset(file, type);

            if (type === 'logo-dark') handleChange('logo_dark_url', url);
            else if (type === 'logo-light') handleChange('logo_light_url', url);
            else if (type === 'favicon') handleChange('favicon_url', url);

            toast.success('Arquivo enviado com sucesso!', { id: 'upload' });
            // Auto-save to persist the URL immediately? Or just wait for manual save?
            // User flow implies saving everything at the end usually, but file uploads are async.
            // Let's keep it in state and wait for "Salvar Configurações" for the DB update of the URL.
        } catch (error: any) {
            toast.error('Erro ao enviar arquivo: ' + error.message, { id: 'upload' });
        }
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

    if (loading) return <div className="p-8 text-center text-primary">Carregando configurações...</div>;

    const getNeonBorderClass = (hasValue: boolean) =>
        hasValue
            ? 'border-primary shadow-[0_0_15px_rgba(0,255,0,0.3)] bg-primary/5'
            : 'border-white/10 hover:border-primary/50 bg-background-dark/30 hover:bg-primary/5';

    return (
        <div className="space-y-8 animate-fade-in-up pb-32">
            {/* Section: Identidade da Empresa */}
            <section className="bg-surface-dark p-6 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]"></div>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary">business</span>
                    </div>
                    Identidade da Empresa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Nome da Empresa</label>
                            <input
                                type="text"
                                value={settings.company_name || ''}
                                onChange={e => handleChange('company_name', e.target.value)}
                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300"
                                placeholder="Ex: Acme Corp"
                            />
                        </div>

                        {/* Logo & Favicon Uploads */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Assets da Marca</label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Logo Dark */}
                                {/* Logo Main */}
                                <div
                                    onClick={() => fileInputRefDark.current?.click()}
                                    className={`h-28 border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/upload ${getNeonBorderClass(!!settings.logo_dark_url)}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRefDark}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'logo-dark')}
                                    />
                                    {settings.logo_dark_url ? (
                                        <img src={settings.logo_dark_url} alt="Logo" className="h-10 object-contain mb-2" />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-text-muted group-hover/upload:text-primary mb-2 transition-colors">image</span>
                                    )}
                                    <span className="text-[9px] font-medium text-text-muted group-hover/upload:text-primary uppercase tracking-wider">Logo</span>
                                </div>

                                {/* Favicon */}
                                <div
                                    onClick={() => fileInputRefFavicon.current?.click()}
                                    className={`h-28 border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/upload ${getNeonBorderClass(!!settings.favicon_url)}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRefFavicon}
                                        className="hidden"
                                        accept="image/png, image/ico, image/svg+xml"
                                        onChange={(e) => handleFileUpload(e, 'favicon')}
                                    />
                                    {settings.favicon_url ? (
                                        <img src={settings.favicon_url} alt="Favicon" className="size-8 object-contain mb-2" />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-text-muted group-hover/upload:text-primary mb-2 transition-colors">tab</span>
                                    )}
                                    <span className="text-[9px] font-medium text-text-muted group-hover/upload:text-primary uppercase tracking-wider">Favicon</span>
                                </div>
                            </div>
                        </div>

                        {/* Theme Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors">Tema do Sistema</label>
                            <ModernDropdown
                                options={[
                                    { id: 'DARK', name: 'Dark (Padrão)' },
                                    { id: 'LIGHT', name: 'Light (Em breve)' }
                                ]}
                                value={settings.theme_preference || 'DARK'}
                                onChange={(val) => handleChange('theme_preference', val)}
                                icon="palette"
                                placeholder="Selecione o tema"
                            />
                            <p className="text-[10px] text-text-muted mt-2">Escolha a aparência do sistema.</p>
                        </div>
                    </div>

                    <div className="bg-background-dark/50 p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center relative">
                        <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 rounded border border-primary/20 text-[10px] text-primary font-bold uppercase">Preview</div>
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-6 self-start">Visualização no Menu</h4>

                        <div className="flex items-center gap-4 p-4 bg-[#112217] rounded-xl border border-white/5 mb-4 w-full max-w-[280px] shadow-lg">
                            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                                {settings.company_name?.charAt(0) || 'A'}
                            </div>
                            <div className="text-left overflow-hidden">
                                <span className="block text-white font-bold truncate text-base leading-tight">{settings.company_name || 'Sua Empresa'}</span>
                                <span className="text-[10px] text-text-muted font-medium tracking-wider uppercase">Workspace</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-text-muted/60 mt-2 max-w-[200px] leading-relaxed">Sua marca será o destaque principal no topo da navegação lateral.</p>
                    </div>
                </div>
            </section>

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
                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg pl-4 pr-16 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300"
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
                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg pl-4 pr-16 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-bold tracking-wider pointer-events-none">HORAS</span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2">Meta de "Deep Work" diário.</p>
                    </div>
                </div>
            </section >

            {/* Section: Calendário */}
            <section className="bg-surface-dark p-6 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]"></div>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary/80">calendar_clock</span>
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
                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 [color-scheme:dark]"
                            />
                        </div>
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Fim</label>
                            <input
                                type="time"
                                value={settings.business_hours_end}
                                onChange={e => handleChange('business_hours_end', e.target.value)}
                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300 [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Dia de Início</label>
                            <div className="relative">
                                <select
                                    value={settings.first_day_of_week}
                                    onChange={e => handleChange('first_day_of_week', e.target.value)}
                                    className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300"
                                >
                                    <option value="MONDAY">Segunda-feira</option>
                                    <option value="SUNDAY">Domingo</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </span>
                            </div>
                        </div>
                        <div className="group/input">
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 transition-colors group-focus-within/input:text-primary">Fuso Horário</label>
                            <div className="relative">
                                <select
                                    value={settings.timezone}
                                    onChange={e => handleChange('timezone', e.target.value)}
                                    className="w-full bg-background-dark/50 border border-white/10 rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all duration-300"
                                >
                                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                    <option value="UTC">UTC</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fixed Save Button - Elegant & Refined */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-light text-background-dark font-bold py-3 px-6 rounded-full shadow-[0_4px_20px_rgba(0,255,0,0.2)] hover:shadow-[0_4px_25px_rgba(0,255,0,0.3)] transition-all hover:scale-105 active:scale-95 border border-primary/20"
                >
                    <span className="material-symbols-outlined font-bold">save</span>
                    Salvar Configurações
                </button>
            </div>
        </div >
    );
}
