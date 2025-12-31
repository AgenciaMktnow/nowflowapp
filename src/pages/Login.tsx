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

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
            {/* Abstract Background Pattern */}
            <div className="absolute inset-0 z-0">
                <img
                    alt="Background Pattern"
                    className="h-full w-full object-cover opacity-10 mix-blend-overlay"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy8xWhvq5GyMfIGsUJiNkVRTWwuNnUAUyqDlETmxCUd5zF8CQTBgmHdjNkoXQcYNdvF62K0Q-MjbWH0OWvLrneZGpYNi3zlGY3scjnzHOiA2OHRNTtHU7i24n_P--4ycjCL70mSLLBDvWznhW-APkCirhRDvnxtVTzvwoRn5rtKu7rcf--znwpZot6rn4tE9pyCcdu8CiHbJcQ6bbqgE6zmVGV6wlCE7L5vaZ9MMLjoXdJYFp2VGwXCATKXIz2j1ynBwlIfNTe_D0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/90 to-background-dark/80"></div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 pb-16 sm:px-6 lg:px-8">
                <div className="w-[90vw] sm:w-full sm:max-w-md space-y-8">
                    {/* Branding Header */}
                    <div className="flex flex-col items-center text-center">
                        {settings.logo_dark_url ? (
                            <img
                                src={settings.logo_dark_url}
                                alt={settings.company_name || 'NowFlow'}
                                className="h-auto mb-6 object-contain max-w-[280px]"
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
                        <p className="mt-2 text-base font-normal text-slate-300">
                            Produtividade em sincronia.
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white dark:bg-[#152a1d]/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-[#326744] shadow-xl p-8 sm:p-10">
                        <h2 className="mb-6 text-center text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                            Acesse sua conta
                        </h2>

                        <form className="space-y-6" onSubmit={handleLogin}>

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white" htmlFor="email">
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
                                        className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-[#326744] placeholder:text-slate-400 dark:placeholder:text-[#5c856b] focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-[#193322] text-base sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white" htmlFor="password">
                                        Senha
                                    </label>
                                    <div className="text-sm">
                                        <a href="#" className="font-medium text-primary hover:text-green-400 transition-colors">
                                            Esqueci minha senha
                                        </a>
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
                                        className="block w-full rounded-lg border-0 py-3 px-4 pr-10 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-[#326744] placeholder:text-slate-400 dark:placeholder:text-[#5c856b] focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-[#193322] text-base sm:text-sm sm:leading-6"
                                    />
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer group"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 dark:text-[#5c856b] dark:group-hover:text-[#92c9a4] transition-colors" style={{ fontSize: '20px' }}>
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
                                    className="flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-bold leading-6 text-[#112217] shadow-sm hover:bg-[#3bf57a] hover:shadow-[0_0_20px_rgba(19,236,91,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </button>
                            </div>
                        </form>

                        <div className="relative mt-8 mb-6">
                            <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-[#326744]"></div>
                            </div>
                            <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                                <span className="bg-white px-4 text-slate-400 dark:bg-[#152a1d]">
                                    Ou continue com
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-[#326744] bg-white dark:bg-[#193322] px-3 h-[50px] text-sm font-semibold text-slate-700 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-[#1f3f2a] transition-all duration-200"
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
                        <div className="relative mt-8">
                            <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-[#326744]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-6 text-slate-500 dark:bg-[#152a1d] dark:text-[#92c9a4]">
                                    Novo no Nowflow?
                                </span>
                            </div>
                        </div>

                        {/* Create Account Link */}
                        <div className="mt-6">
                            <Link to="/signup" className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 dark:bg-[#193322]/50 px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-[#326744] hover:bg-slate-100 dark:hover:bg-[#193322] transition-colors">
                                Criar uma conta
                            </Link>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <p className="text-center text-xs text-slate-400">
                        © {new Date().getFullYear()} NowFlow Inc. Todos os direitos reservados.
                        <br />
                        <a href="#" className="hover:text-white underline decoration-dotted underline-offset-2">Privacidade</a> · <a href="#" className="hover:text-white underline decoration-dotted underline-offset-2">Termos</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
