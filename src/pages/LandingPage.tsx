import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Check,
    Layout,
    TrendingUp,
    Database,
    Menu,
    X,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { MockupDashboard } from '../components/landing/mockups/MockupDashboard';
import { MockupKanban } from '../components/landing/mockups/MockupKanban';
import { MockupTaskChat } from '../components/landing/mockups/MockupTaskChat';
import { MockupTimer } from '../components/landing/mockups/MockupTimer';

const Navbar = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B0E0F]/80 backdrop-blur-md border-b border-primary/10' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/Logo-nowflow-banco.png" alt="NowFlow Logo" className="h-10 w-auto object-contain" />
                    </button>

                    <div className="hidden md:flex items-center space-x-8">
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-text-muted hover:text-white transition-colors text-sm font-medium">Funcionalidades</button>
                        <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-text-muted hover:text-white transition-colors text-sm font-medium">Preços</button>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-white hover:text-primary transition-colors text-sm font-bold"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-primary hover:bg-primary-dark text-[#0B0E0F] px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] transform hover:-translate-y-0.5"
                        >
                            Começar Agora
                        </button>
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-[#0B0E0F] border-b border-white/10 p-4 flex flex-col space-y-4 shadow-2xl">
                    <button onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="text-text-muted hover:text-white py-2 text-left">Funcionalidades</button>
                    <button onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="text-text-muted hover:text-white py-2 text-left">Preços</button>
                    <button onClick={() => navigate('/login')} className="text-white py-2 text-left font-bold">Login</button>
                    <button onClick={() => navigate('/signup')} className="bg-primary text-[#0B0E0F] w-full py-3 rounded-xl font-bold">
                        Começar Agora
                    </button>
                </div>
            )}
        </nav>
    );
};

const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-30" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary text-xs font-bold uppercase tracking-wider">Novo: Gestão de Prazos Inteligente</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6 tracking-tight">
                    A plataforma que organiza sua operação e devolve seu tempo.
                </h1>

                <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto mb-10 font-light leading-relaxed">
                    O gerenciador de tarefas desenhado para empresas que precisam de fluxo, clareza e centralização em um só lugar.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-[#0B0E0F] h-14 px-8 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] flex items-center justify-center gap-2 group"
                    >
                        Começar Grátis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 h-14 px-8 rounded-full font-bold text-lg transition-all backdrop-blur-md flex items-center justify-center gap-2">
                        Ver Demonstração
                    </button>
                </div>

                {/* Dashboard Screenshot Mockup */}
                <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <MockupDashboard />
                </div>
            </div>
        </section>
    );
};

const PainPoints = () => {
    const pains = [
        {
            icon: <Clock className="w-8 h-8 text-red-400" />,
            title: "Prazos Perdidos",
            desc: "Tarefas esquecidas e entregas atrasadas? Tenha visibilidade total do cronograma e evite surpresas."
        },
        {
            icon: <AlertTriangle className="w-8 h-8 text-yellow-400" />,
            title: "Informação Espalhada",
            desc: "Briefings no WhatsApp, arquivos no Email. Centralize tudo e pare de perder tempo procurando."
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-orange-400" />,
            title: "Falta de Clareza",
            desc: "Sem saber quem faz o quê, a produtividade cai. Distribua demandas com clareza e acompanhe o progresso."
        }
    ];

    return (
        <section className="py-24 bg-[#05110A]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">Chega de caos operacional.</h2>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Elimine o caos operacional que impede sua equipe de crescer.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pains.map((pain, idx) => (
                        <div key={idx} className="group p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl hover:bg-white/10 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(19,236,91,0.1)]">
                            <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                {pain.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{pain.title}</h3>
                            <p className="text-text-muted leading-relaxed">
                                {pain.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Features = () => {
    return (
        <section id="features" className="py-24 relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
                {/* Feature 1: Kanban */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase mb-6">
                            <Layout size={14} />
                            <span>Kanban Dinâmico</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            Gestão visual de <br /><span className="text-primary">ponta a ponta</span>.
                        </h2>
                        <p className="text-text-muted text-lg mb-8 leading-relaxed">
                            Mova tarefas com facilidade e saiba exatamente em que etapa cada projeto está. Identifique gargalos instantaneamente com nosso board intuitivo.
                        </p>
                        <ul className="space-y-4">
                            {['Workflows Personalizáveis', 'Drag & Drop Fluido', 'Tags e Prioridades Claras'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-white font-medium">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        <div className="transform hover:scale-[1.02] transition-transform duration-500">
                            <MockupKanban />
                        </div>
                    </div>
                </div>

                {/* Feature 2: Project Context */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold uppercase mb-6">
                            <Database size={14} />
                            <span>Contexto Centralizado</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            Hub de execução: <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Arquivo e conversa na tarefa</span>.
                        </h2>
                        <p className="text-text-muted text-lg mb-8 leading-relaxed">
                            Chega de procurar o briefing no email e o layout no WhatsApp. No NowFlow, arquivos, discussões e histórico vivem dentro do card da tarefa.
                        </p>
                        <ul className="space-y-4">
                            {['Chat por Tarefa', 'Upload de Arquivos Integrado', 'Histórico de Atividades'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-white font-medium">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        <div className="transform hover:scale-[1.02] transition-transform duration-500">
                            <MockupTaskChat />
                        </div>
                    </div>
                </div>

                {/* Feature 3: Time Tracking */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold uppercase mb-6">
                            <Clock size={14} />
                            <span>Rastreamento de Tempo Preciso</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            Controle total da <br /><span className="text-blue-400">produtividade</span>.
                        </h2>
                        <p className="text-text-muted text-lg mb-8 leading-relaxed">
                            Saiba exatamente quanto tempo cada demanda consome. Adicione ou remova horas manualmente e tenha o controle total da produtividade da sua equipe.
                        </p>
                        <ul className="space-y-4">
                            {['Play/Pause no Timer', 'Ajuste Manual de Horas', 'Relatórios de Performance'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-white font-medium">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#1A1A1A] to-[#0B0E0F] rounded-2xl border border-white/10 shadow-2xl overflow-hidden group">
                            {/* Background Decor */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                            <MockupTimer />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    const navigate = useNavigate();
    return (
        <section id="pricing" className="py-24 bg-[#05110A]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Simples e Transparente.</h2>
                    <p className="text-text-muted text-lg">Escolha o plano ideal para escalar sua operação.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    {/* Starter */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">Starter</h3>
                            <p className="text-text-muted text-sm mt-2">Para organização pessoal.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-bold text-white">Grátis</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> 1 Usuário</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Até 2 Projetos Ativos</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Armazenamento Básico</li>
                        </ul>
                        <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
                            Começar Grátis
                        </button>
                    </div>

                    {/* Pro */}
                    <div className="relative p-8 rounded-3xl bg-[#162E20] border border-primary/50 flex flex-col transform md:-translate-y-4 shadow-[0_0_40px_rgba(19,236,91,0.1)]">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-[#0B0E0F] text-xs font-bold px-6 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(19,236,91,0.4)]">
                            Recomendado
                        </div>
                        <div className="mb-4">
                            <div className="inline-block px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                                50% OFF por 12 meses
                            </div>
                            <h3 className="text-xl font-bold text-white">Pro</h3>
                            <p className="text-primary text-sm mt-2">Para equipes ágeis.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-bold text-white">R$ 99</span>
                            <span className="text-text-muted">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-primary" /> Até 10 Usuários</li>
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-primary" /> Projetos Ilimitados</li>
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-primary" /> Histórico Completo</li>
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-primary" /> <span className="font-bold text-white">Time Tracking Nativo</span></li>
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-primary" /> Relatórios de Produtividade</li>
                        </ul>
                        <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-[#0B0E0F] font-bold transition-all shadow-lg hover:shadow-primary/20">
                            Assinar Agora
                        </button>
                    </div>

                    {/* Business */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">Business</h3>
                            <p className="text-text-muted text-sm mt-2">Para grandes operações.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-bold text-white">Sob Consulta</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Usuários Ilimitados</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Projetos Ilimitados</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Gestão de Permissões</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Suporte Dedicado</li>
                        </ul>
                        <button onClick={() => window.open('https://wa.me/5511999999999', '_blank')} className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
                            Falar com Consultor
                        </button>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#162E20] to-[#0B0E0F] border border-primary/20 p-12 text-center mb-24">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                            Pronto para parar de <br /><span className="text-primary">perder tempo?</span>
                        </h2>
                        <button onClick={() => navigate('/signup')} className="px-12 py-5 rounded-xl bg-primary hover:bg-primary-dark text-[#0B0E0F] text-lg font-bold transition-all shadow-[0_0_30px_rgba(19,236,91,0.3)] hover:shadow-[0_0_50px_rgba(19,236,91,0.5)] transform hover:-translate-y-1">
                            Comece hoje seu teste gratuito
                        </button>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mb-24">
                    <h2 className="text-3xl font-display font-bold text-white text-center mb-12">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Como funciona o Time Tracking?", a: "O Time Tracking é nativo no NowFlow. Você pode iniciar um timer direto na tarefa ou lançar horas manualmente. Tudo fica registrado no relatório de produtividade." },
                            { q: "Posso cancelar a qualquer momento?", a: "Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento nas configurações da conta." },
                            { q: "Meus dados estão seguros?", a: "Segurança é nossa prioridade. Utilizamos criptografia de ponta e backups diários para garantir a integridade dos seus projetos." },
                            { q: "Preciso de cartão para testar?", a: "Não. Você pode começar com o plano Starter gratuito e fazer o upgrade apenas quando precisar de mais recursos." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                                <h3 className="text-white font-bold text-lg mb-2">{faq.q}</h3>
                                <p className="text-text-muted">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-[#05110A] border-t border-white/5 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 mb-4 md:mb-0 hover:opacity-80 transition-opacity">
                        <img src="/Logo-nowflow-banco.png" alt="NowFlow Logo" className="h-10 w-auto object-contain" />
                    </button>
                    <div className="text-text-muted text-sm">
                        © 2026 NowFlow. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Sticky Mobile CTA for High Conversion
const StickyMobileCTA = () => {
    return (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0B0E0F]/90 backdrop-blur-lg border-t border-white/10 md:hidden z-50 flex items-center justify-between gap-4">
            <div className="block">
                <p className="text-white text-xs font-bold">Teste o NowFlow</p>
                <p className="text-text-muted text-[10px]">Cancele quando quiser</p>
            </div>
            <a href="/signup" className="flex-1 bg-primary text-[#0B0E0F] text-center py-3 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(19,236,91,0.3)]">
                Começar Grátis
            </a>
        </div>
    );
};

export default function LandingPage() {
    // Basic SEO Setup (In a real app, use Helmet)
    useEffect(() => {
        document.title = "NowFlow - Gestão Inteligente para Agências";
    }, []);

    return (
        <div className="min-h-screen bg-[#0B0E0F] text-white selection:bg-primary selection:text-[#0B0E0F]">
            <Navbar />

            <main>
                <Hero />
                <PainPoints />
                <Features />
                <Pricing />
            </main>

            <Footer />
            <StickyMobileCTA />
        </div>
    );
}
