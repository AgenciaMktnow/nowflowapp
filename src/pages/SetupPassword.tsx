import React, { useState } from 'react';

import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';

export default function SetupPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { settings } = useSettings();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            // 1. Update Password in Auth
            const { error: updateError } = await supabase.auth.updateUser({ password: password });
            if (updateError) throw updateError;

            // 2. Clear flags in Database
            const { error: rpcError } = await supabase.rpc('complete_password_setup');
            if (rpcError) throw rpcError;

            // 3. Success
            toast.success('Senha definida com sucesso! Bem-vindo ao NowFlow.');

            // Force reload to refresh context state or just navigate
            // Reloading is safer to ensure AuthContext picks up new DB state if it re-fetches
            window.location.href = '/';

        } catch (error: any) {
            console.error('Error setting password:', error);
            toast.error(error.message || 'Erro ao definir senha. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden font-display bg-background-dark text-white p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/95 to-background-dark/90"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 shadow-[0_0_20px_rgba(19,236,91,0.2)]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in-up">
                {/* Branding */}
                <div className="flex flex-col items-center text-center">
                    {settings.logo_dark_url ? (
                        <img
                            src={settings.logo_dark_url}
                            alt="Logo"
                            className="max-h-12 w-auto mb-6 object-contain"
                        />
                    ) : (
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(19,236,91,0.15)]">
                            <span className="material-symbols-outlined text-4xl text-primary">all_inclusive</span>
                        </div>
                    )}
                    <h1 className="text-3xl font-black text-white mb-2">
                        Bem-vindo ao Time!
                    </h1>
                    <p className="text-text-secondary">
                        Para sua segurança, defina sua senha de acesso pessoal.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-surface-card backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl p-6 sm:p-8">
                    <form onSubmit={handleSetup} className="space-y-6">

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-lg border border-white/10 py-3 px-4 pr-10 bg-background-dark/50 text-white placeholder-text-secondary/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary/60 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Confirmar Senha
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-lg border border-white/10 py-3 px-4 bg-background-dark/50 text-white placeholder-text-secondary/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                placeholder="Confirme sua senha"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-background-dark bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(19,236,91,0.2)] hover:shadow-[0_0_20px_rgba(19,236,91,0.4)]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></span>
                                    Salvando...
                                </span>
                            ) : (
                                'Definir Senha e Entrar'
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
