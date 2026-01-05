import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { session } = useAuth();
    const { settings } = useSettings();

    if (session) {
        navigate('/');
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await authService.signIn({
                email,
                password,
            });

            if (error) throw error;

            toast.success('Login realizado com sucesso!');
            navigate('/');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao realizar login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await authService.signInWithGoogle();
            if (error) throw error;
        } catch (error) {
            console.error("Google Login Cancelled/Failed:", error);
            // Discrete Neon Toast for Cancellation/Error
            toast.message('Login cancelado ou não concluído.', {
                style: {
                    border: '1px solid #13ec5b', // Neon Green Border
                    color: '#fff',
                    backgroundColor: 'rgba(19, 236, 91, 0.1)'
                },
                description: 'Feche a janela apenas se não quiser logar.'
            });
        }
    };

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        try {
            const { error } = await authService.resetPasswordForEmail(resetEmail, 'https://www.nowflow.it/reset-password');
            if (error) throw error;
            toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
            setShowForgotPassword(false);
            setResetEmail('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao enviar email de recuperação');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden font-display bg-background-dark text-white">
            {/* Background Pattern - Subtle Neon Glow */}
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
                                    {settings.company_name || 'Nowflow'}
                                </h1>
                            </>
                        )}
                        <p className="mt-2 text-base font-normal text-text-secondary">
                            Produtividade em sincronia.
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-surface-card backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl p-6 sm:p-8">
                        <h2 className="mb-4 text-center text-2xl font-bold leading-tight tracking-tight text-white">
                            Acesse sua conta
                        </h2>

                        <form className="space-y-4" onSubmit={handleLogin}>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium leading-6 text-text-secondary" htmlFor="email">
                                    E-mail ou Usuário
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="exemplo@nowflow.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-lg border border-white/10 py-3 px-4 text-white shadow-sm placeholder:text-text-secondary/50 focus:ring-2 focus:ring-inset focus:ring-primary bg-background-dark/50 text-base sm:text-sm sm:leading-6 focus:outline-none transition-all duration-300"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium leading-6 text-text-secondary" htmlFor="password">
                                        Senha
                                    </label>
                                    <div className="text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="font-medium text-primary hover:text-green-400 transition-colors"
                                        >
                                            Esqueci minha senha
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 relative rounded-lg shadow-sm">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
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

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-bold leading-6 text-background-dark shadow-sm hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(19,236,91,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </button>
                            </div>
                        </form>

                        <div className="relative mt-4 mb-4">
                            <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="bg-surface-card px-4 text-text-secondary/60">
                                    Ou continue com
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-background-dark/50 px-3 h-[50px] text-sm font-semibold text-white shadow-sm hover:bg-background-dark transition-all duration-300"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Entrar com Google
                        </button>

                        {/* Divider */}
                        <div className="relative mt-4">
                            <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-surface-card px-6 text-text-secondary">
                                    Novo no Nowflow?
                                </span>
                            </div>
                        </div>

                        {/* Create Account Link */}
                        <div className="mt-4">
                            <Link to="/signup" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/5 hover:bg-primary/10 px-3 py-3 text-sm font-semibold text-white shadow-sm border border-primary/20 hover:border-primary/40 transition-all duration-300">
                                Criar uma conta
                            </Link>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <p className="text-center text-xs text-text-secondary/60">
                        © {new Date().getFullYear()} NowFlow Inc. Todos os direitos reservados.
                        <br />
                        <a href="#" className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4">Privacidade</a> · <a href="#" className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4">Termos</a>
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-surface-card rounded-xl border border-white/10 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowForgotPassword(false)}
                            className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="mb-6 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-2xl">lock_reset</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Recuperar Senha</h3>
                            <p className="mt-2 text-sm text-text-secondary">
                                Digite seu email para receber um link de redefinição de senha.
                            </p>
                        </div>

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium leading-6 text-text-secondary" htmlFor="resetEmail">
                                    Email cadastrado
                                </label>
                                <input
                                    id="resetEmail"
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="mt-2 block w-full rounded-lg border border-white/10 py-3 px-4 text-white shadow-sm placeholder:text-text-secondary/50 focus:ring-2 focus:ring-inset focus:ring-primary bg-background-dark/50 focus:outline-none transition-all duration-300"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={resetLoading}
                                className="flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-bold leading-6 text-background-dark shadow-sm hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(19,236,91,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {resetLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
