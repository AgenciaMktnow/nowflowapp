import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const { session } = useAuth();
    const { settings } = useSettings();

    if (session) {
        navigate('/');
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await authService.signInWithGoogle();
            if (error) throw error;
        } catch (error) {
            console.error("Google Login Cancelled/Failed:", error);
            toast.message('Login cancelado ou não concluído.', {
                style: {
                    border: '1px solid #13ec5b',
                    color: '#fff',
                    backgroundColor: 'rgba(19, 236, 91, 0.1)'
                },
                description: 'Feche a janela apenas se não quiser logar.'
            });
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirmPassword) {
            toast.error('As senhas não conferem.');
            setLoading(false);
            return;
        }

        try {
            const { error } = await authService.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            toast.success('Cadastro realizado com sucesso!', {
                description: 'Verifique seu e-mail para confirmar a conta (se necessário) ou faça login.'
            });
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao criar conta', {
                description: err.message || 'Ocorreu um erro inesperado. Tente novamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background-dark text-white font-display overflow-hidden relative flex-col antialiased selection:bg-primary selection:text-background-dark">
            <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden py-4 sm:py-6">
                {/* Background Pattern - Subtle Neon Glow */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/95 to-background-dark/90"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 shadow-[0_0_20px_rgba(19,236,91,0.2)]"></div>
                </div>

                <div className="relative w-[90vw] sm:w-full sm:max-w-[520px] mx-auto px-4 sm:px-6">

                    {/* Logo Area */}
                    <div className="flex flex-col items-center justify-center text-center mb-4">
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

                    {/* Card Container */}
                    <div className="bg-surface-card backdrop-blur-sm rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
                        {/* Header */}
                        <div className="px-8 pt-4 pb-2 text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Crie sua conta</h2>
                            <p className="text-text-secondary text-sm">
                                Junte-se a nós para gerenciar seus projetos com eficiência.
                            </p>
                        </div>

                        {/* Form */}
                        <form className="px-8 flex flex-col gap-3 pt-2 pb-4" onSubmit={handleSignUp}>

                            {/* Nome */}
                            <label className="flex flex-col gap-2">
                                <span className="text-text-secondary text-sm font-medium">Nome Completo</span>
                                <div className="relative">
                                    <input
                                        className="form-input w-full rounded-lg bg-background-dark/50 border border-white/10 text-white placeholder:text-text-secondary/40 focus:ring-2 focus:ring-primary h-10 px-4 transition-all duration-300 text-base sm:text-sm focus:outline-none"
                                        placeholder="Digite seu nome"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        spellCheck="false"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </label>

                            {/* Email */}
                            <label className="flex flex-col gap-2">
                                <span className="text-text-secondary text-sm font-medium">E-mail</span>
                                <div className="relative">
                                    <input
                                        className="form-input w-full rounded-lg bg-background-dark/50 border border-white/10 text-white placeholder:text-text-secondary/40 focus:ring-2 focus:ring-primary h-10 px-4 transition-all duration-300 text-base sm:text-sm focus:outline-none"
                                        placeholder="exemplo@nowflow.com"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </label>

                            {/* Senha */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex flex-col gap-2">
                                    <span className="text-text-secondary text-sm font-medium">Senha</span>
                                    <div className="relative flex items-center">
                                        <input
                                            className="form-input w-full rounded-lg bg-background-dark/50 border border-white/10 text-white placeholder:text-text-secondary/40 focus:ring-2 focus:ring-primary h-10 pl-4 pr-10 transition-all duration-300 text-base sm:text-sm focus:outline-none"
                                            placeholder="••••••••"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 text-text-secondary/60 hover:text-primary transition-colors flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </label>
                                {/* Confirmar Senha */}
                                <label className="flex flex-col gap-2">
                                    <span className="text-text-secondary text-sm font-medium">Confirmar Senha</span>
                                    <div className="relative flex items-center">
                                        <input
                                            className="form-input w-full rounded-lg bg-background-dark/50 border border-white/10 text-white placeholder:text-text-secondary/40 focus:ring-2 focus:ring-primary h-10 pl-4 pr-10 transition-all duration-300 text-base sm:text-sm focus:outline-none"
                                            placeholder="••••••••"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 text-text-secondary/60 hover:text-primary transition-colors flex items-center"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </label>
                            </div>

                            {/* Botão Criar Conta */}
                            <button
                                className="mt-4 w-full h-10 bg-primary hover:bg-primary/90 text-background-dark font-bold text-base rounded-lg shadow-[0_0_20px_rgba(19,236,91,0.2)] hover:shadow-[0_0_25px_rgba(19,236,91,0.3)] transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-wider"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Criando Conta...' : 'Criar Conta'}
                                {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                            </button>

                            {/* Google Login Section */}
                            <div className="relative mt-4 mb-2">
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
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-background-dark/50 px-3 h-[40px] text-sm font-semibold text-white shadow-sm hover:bg-background-dark transition-all duration-300"
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

                            {/* Login Link */}
                            <div className="text-center mt-2">
                                <p className="text-sm text-text-secondary">
                                    Já tem uma conta?
                                    <Link className="font-semibold text-white hover:text-primary hover:underline transition-colors ml-1" to="/login">Entrar</Link>
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Footer Links */}
                    <p className="text-center text-xs text-text-secondary/60 mt-4 mb-2">
                        © {new Date().getFullYear()} NowFlow Inc. Todos os direitos reservados.
                        <br />
                        <a href="#" className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4">Privacidade</a> · <a href="#" className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4">Termos</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
