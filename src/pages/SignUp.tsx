import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function Signup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !companyName || !email || !password) {
            toast.warning('Por favor, preencha todos os campos.');
            return;
        }

        if (password.length < 6) {
            toast.warning('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        company_name: companyName,
                        is_owner: true // CRITICAL: This bypasses whitelist and triggers Org creation
                    }
                }
            });

            if (error) {
                // Friendly error mapping
                if (error.message.includes('already registered')) throw new Error('Este e-mail já está cadastrado.');
                throw error;
            }

            if (data.user) {
                toast.success('Conta criada com sucesso!');
                toast.info('Verifique seu e-mail para confirmar o cadastro.', { duration: 5000 });
                // Redirect to login or wait for email confirmation?
                // Usually Supabase requires confirmation by default unless disabled.
                // Let's redirect to login.
                navigate('/login');
            }
        } catch (error: any) {
            console.error('Signup Error:', error);
            toast.error(error.message || 'Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background-dark p-4">
            <div className="w-full max-w-md animate-fade-in space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_30px_-5px_rgba(0,255,127,0.3)]">
                            <span className="material-symbols-outlined text-4xl text-primary">rocket_launch</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white font-display">
                        Comece grátis no NowFlow
                    </h2>
                    <p className="mt-2 text-text-subtle">
                        Crie seu espaço de trabalho e organize sua agência em minutos.
                    </p>
                </div>

                {/* Form Card */}
                <div className="overflow-hidden rounded-2xl border border-border-green/30 bg-[#162E20]/50 backdrop-blur-xl p-8 shadow-2xl">
                    <form onSubmit={handleSignup} className="space-y-5">

                        {/* Nome Completo */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-subtle">
                                Seu Nome
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ex: João Silva"
                                className="w-full rounded-xl border border-border-green/50 bg-background-dark/80 px-4 py-3 text-white placeholder-text-subtle/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Nome da Empresa */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-subtle flex justify-between">
                                <span>Nome da Empresa</span>
                                <span className="text-[10px] text-primary bg-primary/10 px-1.5 rounded">Será seu Workspace</span>
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Ex: Minha Agência Criativa"
                                className="w-full rounded-xl border border-border-green/50 bg-background-dark/80 px-4 py-3 text-white placeholder-text-subtle/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-subtle">
                                E-mail Profissional
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full rounded-xl border border-border-green/50 bg-background-dark/80 px-4 py-3 text-white placeholder-text-subtle/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-subtle">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-border-green/50 bg-background-dark/80 px-4 py-3 text-white placeholder-text-subtle/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-background-dark shadow-[0_0_20px_rgba(0,255,127,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,127,0.5)] disabled:opacity-70 disabled:cursor-not-allowed font-display mt-2"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                ) : (
                                    <>
                                        <span>Criar Conta Grátis</span>
                                        <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-text-subtle">Já tem uma conta? </span>
                        <Link to="/login" className="font-bold text-primary hover:text-green-400 hover:underline transition-colors">
                            Fazer Login
                        </Link>
                    </div>
                </div>

                {/* Footer / Trust */}
                <div className="text-center text-xs text-text-subtle/50">
                    <p>Ao se cadastrar, você concorda com nossos Termos de Uso.</p>
                </div>
            </div>
        </div>
    );
}
