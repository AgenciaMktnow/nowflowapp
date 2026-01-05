import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { settings } = useSettings();

    useEffect(() => {
        // Check if user came from email link
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type !== 'recovery' && type !== 'signup') {
            toast.error('Link inválido ou expirado');
            navigate('/login');
        }
    }, [navigate]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Senha definida com sucesso!');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao definir senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden font-display bg-background-dark text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/95 to-background-dark/90"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 shadow-[0_0_20px_rgba(19,236,91,0.2)]"></div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:py-8 lg:px-8">
                <div className="w-[90vw] sm:w-full sm:max-w-md space-y-4">
                    {/* Branding Header */}
                    <div className="flex flex-col items-center text-center">
                        {settings.logo_dark_url ? (
                            <img
                                src={settings.logo_dark_url}
                                alt="Logo"
                                className="max-h-12 w-auto mb-4 object-contain"
                            />
                        ) : (
                            <>
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(19,236,91,0.15)]">
                                    <span className="material-symbols-outlined text-4xl text-primary">all_inclusive</span>
                                </div>
                                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-white">
                                    {settings.company_name || 'NowFlow'}
                                </h1>
                            </>
                        )}
                        <p className="mt-2 text-base font-normal text-text-secondary">
                            Defina sua senha de acesso
                        </p>
                    </div>

                    {/* Reset Password Card */}
                    <div className="bg-surface-card backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl p-6 sm:p-8">
                        <h2 className="mb-4 text-center text-2xl font-bold leading-tight tracking-tight text-white">
                            Criar Nova Senha
                        </h2>

                        <form className="space-y-4" onSubmit={handleResetPassword}>
                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium leading-6 text-text-secondary" htmlFor="password">
                                    Nova Senha
                                </label>
                                <div className="mt-2 relative rounded-lg shadow-sm">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-lg border border-white/10 py-3 px-4 pr-10 text-white shadow-sm placeholder:text-text-secondary/50 focus:ring-2 focus:ring-inset focus:ring-primary bg-background-dark/50 text-base sm:text-sm sm:leading-6 focus:outline-none transition-all duration-300"
                                    />
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer group"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-text-secondary/60 group-hover:text-primary transition-colors" style={{ fontSize: '20px' }}>
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-medium leading-6 text-text-secondary" htmlFor="confirmPassword">
                                    Confirmar Senha
                                </label>
                                <div className="mt-2 relative rounded-lg shadow-sm">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full rounded-lg border border-white/10 py-3 px-4 pr-10 text-white shadow-sm placeholder:text-text-secondary/50 focus:ring-2 focus:ring-inset focus:ring-primary bg-background-dark/50 text-base sm:text-sm sm:leading-6 focus:outline-none transition-all duration-300"
                                    />
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer group"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <span className="material-symbols-outlined text-text-secondary/60 group-hover:text-primary transition-colors" style={{ fontSize: '20px' }}>
                                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-bold leading-6 text-background-dark shadow-sm hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(19,236,91,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    {loading ? 'Definindo Senha...' : 'Definir Senha'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-text-secondary/60">
                        © {new Date().getFullYear()} NowFlow Inc. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
