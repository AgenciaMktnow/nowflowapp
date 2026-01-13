import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Check,
    Layout,
    TrendingUp,
    Database,
    Menu,
    X,
    Clock,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import { MockupDashboard } from '../components/landing/mockups/MockupDashboard';
import { MockupKanban } from '../components/landing/mockups/MockupKanban';
import { MockupTaskChat } from '../components/landing/mockups/MockupTaskChat';
import { MockupTimer } from '../components/landing/mockups/MockupTimer';

const Navbar = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            // Calculate progress
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scroll = `${totalScroll / windowHeight}`;
            setScrollProgress(Number(scroll));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#102216]/80 backdrop-blur-md border-b border-[#13ec5b]/10' : 'bg-transparent'}`}>
            {/* Reading Progress Bar */}
            <div className="absolute top-0 left-0 h-[2px] bg-[#13ec5b] transition-all duration-300 ease-out z-50" style={{ width: `${scrollProgress * 100}%` }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/Logo-nowflow-banco.png" alt="NowFlow Logo" className="h-10 w-auto object-contain" />
                    </button>

                    <div className="hidden md:flex items-center space-x-8">
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-[#92c9a4] hover:text-white transition-colors text-sm font-medium">Funcionalidades</button>
                        <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-[#92c9a4] hover:text-white transition-colors text-sm font-medium">Preços</button>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-white hover:text-[#13ec5b] transition-colors text-sm font-bold"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-[#13ec5b] hover:bg-[#0ea842] text-[#102216] px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] transform hover:-translate-y-0.5"
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
                <div className="md:hidden absolute top-full left-0 w-full bg-[#102216] border-b border-white/10 p-4 flex flex-col space-y-4 shadow-2xl">
                    <button onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="text-[#92c9a4] hover:text-white py-2 text-left">Funcionalidades</button>
                    <button onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="text-[#92c9a4] hover:text-white py-2 text-left">Preços</button>
                    <button onClick={() => navigate('/login')} className="text-white py-2 text-left font-bold">Login</button>
                    <button onClick={() => navigate('/signup')} className="bg-[#13ec5b] text-[#102216] w-full py-3 rounded-xl font-bold">
                        Começar Agora
                    </button>
                </div>
            )}
        </nav>
    );
};

// Helper Components for Animations
const Typewriter = ({ words }: { words: string[] }) => {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    // Blinking cursor
    useEffect(() => {
        const timeout = setTimeout(() => setBlink(!blink), 500);
        return () => clearTimeout(timeout);
    }, [blink]);

    // Typing logic
    useEffect(() => {
        if (subIndex === words[index].length + 1 && !reverse) {
            setTimeout(() => setReverse(true), 1500);
            return;
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, Math.random() * 30));

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, words]);

    return (
        <span className="inline-block min-w-[120px] text-left">
            {`${words[index].substring(0, subIndex)}`}
            <span className={`ml-1 text-[#13ec5b] ${blink ? 'opacity-100' : 'opacity-0'}`}>|</span>
        </span>
    );
};

const FadeInScroll = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#102216]">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#13ec5b]/10 blur-[120px] rounded-full pointer-events-none opacity-30" />

            <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-[#13ec5b] animate-pulse" />
                    <span className="text-[#13ec5b] text-xs font-bold uppercase tracking-wider">Novo: Gestão de Produtividade 2.0</span>
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6 tracking-tight">
                    Finalmente, um sistema de gestão que sua equipe realmente vai usar.
                </h1>

                <div className="text-lg sm:text-2xl md:text-4xl font-light text-gray-300 mb-8 h-12">
                    Pare de gerir o caos. Comece a fluir <span className="font-bold text-[#13ec5b]"><Typewriter words={['sem burocracia', 'sem atrasos', 'sem complicações']} /></span>.
                </div>

                <p className="text-lg md:text-xl text-[#92c9a4] max-w-3xl mx-auto mb-10 font-light leading-relaxed">
                    Chega de softwares pesados e processos lentos. O NowFlow foi desenhado para quem precisa de agilidade, com Time Tracking nativo e interface ultra-rápida.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full sm:w-auto bg-[#13ec5b] hover:bg-[#0ea842] text-[#102216] h-16 px-10 rounded-full font-bold text-lg transition-all shadow-[0_0_25px_rgba(19,236,91,0.4)] hover:shadow-[0_0_35px_rgba(19,236,91,0.6)] hover:scale-105 flex items-center justify-center gap-2 group ring-4 ring-[#13ec5b]/20"
                    >
                        Começar Grátis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                </div>

                {/* Dashboard Screenshot Mockup */}
                <div className="mt-16 animate-float">
                    <MockupDashboard />
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
};

const PainPoints = () => {
    const pains = [
        {
            icon: <Clock className="w-8 h-8 text-red-500" />,
            title: "O 'jogo de adivinhação' do tempo",
            desc: "Sem rastreamento real, você nunca sabe se um projeto deu lucro ou se sua equipe está sobrecarregada. Pare de estimar e comece a medir."
        },
        {
            icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
            title: "A morte por mil notificações",
            desc: "Briefings no WhatsApp, arquivos no Email e feedback em comentários perdidos. O NowFlow enterra a dispersão de informações."
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-orange-500" />,
            title: "O efeito gargalo",
            desc: "Quando ninguém sabe quem faz o quê, o trabalho trava. Visualize fluxos de ponta a ponta e elimine a confusão de uma vez por todas."
        }
    ];

    return (
        <section className="py-24 bg-[#0e1e14]">
            <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">O custo invisível do caos operacional.</h2>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
                        Sistemas fragmentados não apenas atrasam entregas; eles esgotam sua equipe e corroem sua margem de lucro.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pains.map((pain, idx) => (
                        <FadeInScroll key={idx} delay={idx * 200}>
                            <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl hover:bg-white/10 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(19,236,91,0.1)]">
                                <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {pain.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{pain.title}</h3>
                                <p className="text-text-muted leading-relaxed">
                                    {pain.desc}
                                </p>
                            </div>
                        </FadeInScroll>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Features = () => {
    // Independent hover states for each section to avoid cross-talk
    const [hoverKanban, setHoverKanban] = useState<number | null>(null);
    const [hoverChat, setHoverChat] = useState<number | null>(null);
    const [hoverTimer, setHoverTimer] = useState<number | null>(null);

    return (
        <section id="features" className="py-24 relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 space-y-32">
                {/* Feature 1: Kanban */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold uppercase mb-6 border border-[#13ec5b]/20">
                            <Layout size={14} />
                            <span>Visão Total</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            Sua operação em <br /><span className="text-[#13ec5b]">um único olhar</span>.
                        </h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Substitua as planilhas estáticas por um fluxo vivo. Saiba o status de cada entrega sem precisar perguntar para ninguém.
                        </p>
                        <ul className="space-y-4">
                            {['Workflows Personalizáveis', 'Drag & Drop Fluido', 'Tags e Prioridades Claras'].map((item, i) => (
                                <li
                                    key={i}
                                    onMouseEnter={() => setHoverKanban(i)}
                                    onMouseLeave={() => setHoverKanban(null)}
                                    onClick={() => setHoverKanban(hoverKanban === i ? null : i)}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer border ${hoverKanban === i ? 'bg-[#13ec5b]/10 border-[#13ec5b]/30 translate-x-2' : 'bg-transparent border-transparent'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hoverKanban === i ? 'bg-[#13ec5b] text-[#102216]' : 'bg-[#13ec5b]/20 text-[#13ec5b]'}`}>
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                    <span className={`font-medium transition-colors ${hoverKanban === i ? 'text-white' : 'text-gray-400'}`}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full hidden sm:block">
                        <div className={`transform transition-all duration-500 ${hoverKanban !== null ? 'scale-105 saturate-150' : 'scale-100'}`}>
                            <MockupKanban />
                        </div>
                    </div>
                </div>

                {/* Feature 2: Project Context */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold uppercase mb-6 border border-purple-500/20">
                            <Database size={14} />
                            <span>Centralização</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            O fim da dispersão <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">de informações</span>.
                        </h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            Briefings, arquivos e histórico de decisões no mesmo lugar. Recupere as horas perdidas procurando arquivos em conversas antigas.
                        </p>
                        <ul className="space-y-4">
                            {['Chat por Tarefa', 'Upload de Arquivos Integrado', 'Histórico de Atividades'].map((item, i) => (
                                <li
                                    key={i}
                                    onMouseEnter={() => setHoverChat(i)}
                                    onMouseLeave={() => setHoverChat(null)}
                                    onClick={() => setHoverChat(hoverChat === i ? null : i)}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer border ${hoverChat === i ? 'bg-purple-500/10 border-purple-500/30 translate-x-2' : 'bg-transparent border-transparent'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hoverChat === i ? 'bg-purple-500 text-white' : 'bg-purple-500/20 text-purple-400'}`}>
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                    <span className={`font-medium transition-colors ${hoverChat === i ? 'text-white' : 'text-gray-400'}`}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full hidden sm:block">
                        <div className={`transform transition-all duration-500 ${hoverChat !== null ? 'scale-105 brightness-110' : 'scale-100'}`}>
                            <MockupTaskChat />
                        </div>
                    </div>
                </div>

                {/* Feature 3: Time Tracking */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase mb-6 border border-cyan-500/20">
                            <Clock size={14} />
                            <span>FOCO TOTAL</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            Transforme horas perdidas em <br /><span className="text-cyan-400">resultados reais</span>.
                        </h2>
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            O único rastreador que sua equipe realmente vai usar. Entenda onde a energia do seu time está sendo investida e proteja o tempo das entregas que movem o ponteiro.
                        </p>
                        <ul className="space-y-4">
                            {['Play/Pause intuitivo no Timer', 'Ajuste e Registro de Atividades', 'Visão de Esforço por Projeto'].map((item, i) => (
                                <li
                                    key={i}
                                    onMouseEnter={() => setHoverTimer(i)}
                                    onMouseLeave={() => setHoverTimer(null)}
                                    onClick={() => setHoverTimer(hoverTimer === i ? null : i)}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer border ${hoverTimer === i ? 'bg-cyan-500/10 border-cyan-500/30 translate-x-2' : 'bg-transparent border-transparent'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hoverTimer === i ? 'bg-cyan-500 text-[#102216]' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                    <span className={`font-medium transition-colors ${hoverTimer === i ? 'text-white' : 'text-gray-400'}`}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        <div className={`relative aspect-[4/3] bg-gradient-to-br from-[#102216] to-[#0B0E0F] rounded-2xl border border-white/10 shadow-2xl overflow-hidden group transition-all duration-500 ${hoverTimer !== null ? 'scale-105 border-cyan-500/40' : 'scale-100'}`}>
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


const TestimonialsCarousel = () => {
    const testimonials = [
        { text: "Gente, o NowFlow salvou meu dia. Finalmente parei de caçar briefing no grupo da empresa!", author: "Ana", role: "Gerente de Projetos" },
        { text: "O Time Tracking aqui mudou o jogo. Descobrimos que estávamos perdendo 15h por semana em reuniões inúteis.", author: "Carlos", role: "CEO de Agência" },
        { text: "Dá até um alívio abrir o Kanban e ver tudo limpo. O caos do WhatsApp acabou por aqui.", author: "Mariana", role: "Head de Operações" },
        { text: "O cliente perguntou do projeto e eu respondi em 10 segundos. O histórico na tarefa é vida!", author: "Pedro", role: "Atendimento" },
        { text: "Pela primeira vez em meses, minha equipe entregou tudo no prazo. Sincronia total.", author: "Fernanda", role: "Diretora de Criação" },
        { text: "O custo desse software se pagou no primeiro mês só com o tempo que a gente parou de perder.", author: "Ricardo", role: "Consultor Financeiro" },
        { text: "A integração do chat dentro da tarefa eliminou 80% dos meus e-mails internos. Sensacional.", author: "Juliana", role: "Coordenadora de RH" },
        { text: "Minha consultoria agora tem métrica real. Sei exatamente quanto tempo cada cliente consome.", author: "Lucas", role: "Consultor de TI" },
        { text: "Interface dark muito limpa. O time de TI viciou no Play/Pause do timer.", author: "Roberto", role: "Tech Lead" },
        { text: "NowFlow é o que o Trello deveria ter sido. Simples, mas com o controle que o gestor precisa.", author: "Camila", role: "Product Owner" }
    ];

    return (
        <section className="py-24 bg-[#102216] border-t border-white/5 relative">
            <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 mb-12 text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">O mercado está falando.</h2>
                <p className="text-text-muted">Deslize para ver o que dizem sobre nós.</p>
            </div>

            <div className="relative w-full">
                {/* Scroll Container */}
                <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-8 pb-8 no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing">
                    {testimonials.map((t, i) => (
                        <div key={i} className="snap-center sm:snap-start flex-shrink-0 w-[85vw] sm:w-[400px]">
                            <div className="bg-[#162E20] p-8 rounded-2xl rounded-bl-sm border border-white/5 shadow-lg h-full flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300">
                                <p className="text-gray-200 text-lg leading-relaxed italic mb-6">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13ec5b] to-[#0ea842] flex items-center justify-center text-[#102216] font-bold text-sm ring-2 ring-[#13ec5b]/30">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{t.author}</div>
                                        <div className="text-xs text-[#92c9a4] uppercase tracking-wide">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Padding final para scroll */}
                    <div className="w-8 flex-shrink-0"></div>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};

const Pricing = () => {
    const navigate = useNavigate();
    return (
        <section id="pricing" className="py-24 bg-[#05110A]" aria-label="Planos e Preços">
            <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Simples e Transparente.</h2>
                    <p className="text-text-muted text-lg">Escolha o plano ideal para escalar sua operação.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {/* Free */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm flex flex-col hover:bg-white/10 transition-colors" aria-label="Plano Free">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">Free</h3>
                            <p className="text-text-muted text-sm mt-2">Para micro-equipes iniciarem o fluxo.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-bold text-white">R$ 0</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Kanban Ilimitado</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Time Tracking Manual</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Até 3 Usuários</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> 500MB de Storage</li>
                        </ul>
                        <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
                            Começar teste grátis
                        </button>
                        <p className="text-xs text-text-muted text-center mt-4">Sem fidelidade. Teste grátis por 14 dias sem cartão.</p>
                    </div>

                    {/* Pro (Highlighted) */}
                    <div className="relative p-8 rounded-3xl bg-[#162E20] border-2 border-[#13ec5b] shadow-[0_0_40px_rgba(19,236,91,0.15)] flex flex-col transform md:-translate-y-4 z-10" aria-label="Plano Pro - Escolha Estratégica">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#13ec5b] to-[#0ea842] text-[#0B0E0F] text-xs font-bold px-6 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(19,236,91,0.4)] animate-pulse">
                            ESCOLHA ESTRATÉGICA
                        </div>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">Pro</h3>
                            <p className="text-[#13ec5b] text-sm mt-2">Controle total e inteligência.</p>
                        </div>
                        <div className="mb-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm text-text-muted">R$</span>
                                <span className="text-4xl font-bold text-white">39,90</span>
                                <span className="text-text-muted">/usuário</span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">Mínimo 10 usuários (R$ 399,00/mês)</p>
                        </div>
                        <ul className="space-y-4 mb-8 mt-6 flex-1">
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-[#13ec5b] flex-shrink-0" /> Tudo do Starter +</li>
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-[#13ec5b] flex-shrink-0" /> 25GB de Storage</li>
                            <li className="flex items-start gap-2 text-white text-sm"><Check size={16} className="text-[#13ec5b] flex-shrink-0 mt-0.5" /> <span><span className="font-bold">Pausa Inteligente Programada:</span> Configure limites automáticos para eliminar erros de registro e garantir a precisão do custo operacional.</span></li>
                            <li className="flex items-center gap-2 text-white text-sm"><Check size={16} className="text-[#13ec5b] flex-shrink-0" /> <span className="font-bold">Gestão de Carga Horária</span></li>
                            <li className="flex items-start gap-2 text-white text-sm"><Check size={16} className="text-[#13ec5b] flex-shrink-0 mt-0.5" /> <span><span className="font-bold">Relatórios Semanais de Produtividade:</span> Resumo automático do esforço da equipe enviado para o seu e-mail.</span></li>
                            <li className="flex items-start gap-2 text-white text-sm"><Check size={16} className="text-[#13ec5b] flex-shrink-0 mt-0.5" /> <span><span className="font-bold">Suporte Prioritário e Humanizado:</span> Canal direto com nosso time de sucesso do cliente.</span></li>
                        </ul>
                        <button onClick={() => navigate('/signup?plan=pro')} className="w-full py-4 rounded-xl bg-[#13ec5b] hover:bg-[#0ea842] text-[#0B0E0F] font-bold transition-all shadow-lg hover:shadow-[#13ec5b]/20 transform hover:-translate-y-1">
                            Começar teste grátis
                        </button>
                        <p className="text-xs text-text-muted text-center mt-4">Sem fidelidade. Teste grátis por 14 dias sem cartão.</p>
                    </div>

                    {/* Starter */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm flex flex-col hover:bg-white/10 transition-colors" aria-label="Plano Starter">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">Starter</h3>
                            <p className="text-text-muted text-sm mt-2">Para processos padronizados.</p>
                        </div>
                        <div className="mb-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm text-text-muted">R$</span>
                                <span className="text-4xl font-bold text-white">19,90</span>
                                <span className="text-text-muted">/usuário</span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">Mínimo 5 usuários (R$ 99,50/mês)</p>
                        </div>
                        <ul className="space-y-4 mb-8 mt-6 flex-1">
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Tudo do Free +</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> 5GB de Storage</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Workflows Customizados</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Campos Personalizados</li>
                            <li className="flex items-center gap-2 text-text-muted text-sm"><Check size={16} className="text-white" /> Relatórios de Tempo</li>
                        </ul>
                        <button onClick={() => navigate('/signup?plan=starter')} className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
                            Começar teste grátis
                        </button>
                        <p className="text-xs text-text-muted text-center mt-4">Sem fidelidade. Teste grátis por 14 dias sem cartão.</p>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#162E20] to-[#0B0E0F] border border-primary/20 p-12 text-center mb-24">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                            Pronto para parar de <br /><span className="text-primary">perder tempo?</span>
                        </h2>
                        <button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-12 py-5 rounded-xl bg-primary hover:bg-primary-dark text-[#0B0E0F] text-lg font-bold transition-all shadow-[0_0_30px_rgba(19,236,91,0.3)] hover:shadow-[0_0_50px_rgba(19,236,91,0.5)] transform hover:-translate-y-1">
                            Comece hoje seu teste gratuito
                        </button>
                        <p className="text-text-muted text-sm mt-4">Teste de 14 dias sem compromisso.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FAQ = () => {
    const questions = [
        {
            q: "O NowFlow substitui o Trello ou o Monday?",
            a: "Sim, e com uma vantagem: unimos a gestão visual deles com o rastreamento de tempo nativo que eles não possuem de forma integrada."
        },
        {
            q: "Preciso cadastrar cartão de crédito para testar?",
            a: "Não. O teste de 14 dias é totalmente livre. Só pediremos seus dados se você decidir que o NowFlow é essencial para sua empresa."
        },
        {
            q: "O que acontece se um colaborador esquecer o timer ligado?",
            a: "O NowFlow possui Pausa Inteligente Programada. O administrador define um limite (ex: 2 horas) e, caso não haja atividade, o sistema pausa o timer automaticamente. Isso garante relatórios 100% fiéis, sem horas fantasmadas."
        },
        {
            q: "Minha equipe vai precisar de treinamento?",
            a: "Desenhamos o NowFlow para ser intuitivo como um chat. A maioria das equipes começa a produzir no primeiro dia, sem manuais complexos. Menos burocracia, mais execução."
        },
        {
            q: "O suporte é em português?",
            a: "Sim, suporte 100% humano e em português via chat e e-mail."
        },
        {
            q: "Existe algum custo de implantação (Setup)?",
            a: "Zero. O sistema é self-service e desenhado para ser configurado em minutos."
        },
        {
            q: "Os dados de 500MB/5GB/25GB são por usuário ou por empresa?",
            a: "O armazenamento é total por organização, compartilhado entre todos os usuários do plano."
        },
        {
            q: "O NowFlow funciona offline?",
            a: "Você precisa de conexão para sincronizar as tarefas, mas o timer continua rodando mesmo se sua internet oscilar por alguns momentos."
        },
        {
            q: "Posso fazer upgrade ou downgrade a qualquer momento?",
            a: "Sim, a flexibilidade é total. Ajustamos a cobrança proporcionalmente no seu próximo ciclo."
        },
        {
            q: "Meus dados estão seguros?",
            a: "Utilizamos criptografia de ponta a ponta e servidores de alta disponibilidade (Tier 4), os mesmos padrões usados por bancos digitais."
        }
    ];

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <section className="py-24 bg-[#102216] border-t border-white/5">
            <div className="max-w-3xl mx-auto px-6 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-12 text-center">Tire suas dúvidas</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {questions.map((item, idx) => (
                        <div key={idx} className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-white/5 transition-colors hover:border-[#13ec5b]/30 h-full">
                            <button
                                onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none gap-4"
                            >
                                <span className={`font-bold text-lg transition-colors ${activeIndex === idx ? 'text-[#13ec5b]' : 'text-white'}`}>
                                    {item.q}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${activeIndex === idx ? 'rotate-180 text-[#13ec5b]' : ''}`}
                                />
                            </button>
                            <AnimatePresence>
                                {activeIndex === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 text-gray-300 leading-relaxed border-t border-white/5 pt-4 text-sm">
                                            {item.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-[#05110A] border-t border-white/5 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
                    {/* Coluna 1: Logo e Valor */}
                    <div className="space-y-6">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/Logo-nowflow-banco.png" alt="NowFlow Logo" className="h-10 w-auto object-contain" />
                        </button>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            A plataforma definitiva para equipes que precisam de agilidade sem abrir mão do controle financeiro e operacional.
                        </p>
                    </div>

                    {/* Coluna 2: Produto */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Produto</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#13ec5b] transition-colors">Funcionalidades</button></li>
                            <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#13ec5b] transition-colors">Preços</button></li>

                            <li><button onClick={() => window.location.href = '/roadmap'} className="hover:text-[#13ec5b] transition-colors">Roadmap</button></li>
                        </ul>
                    </div>

                    {/* Coluna 3: Empresa */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Empresa</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><button onClick={() => window.location.href = '/about'} className="hover:text-[#13ec5b] transition-colors">Sobre Nós</button></li>
                            <li><button onClick={() => window.location.href = '/contact'} className="hover:text-[#13ec5b] transition-colors">Contato</button></li>
                        </ul>
                    </div>

                    {/* Coluna 4: Legal */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><button onClick={() => window.location.href = '/legal'} className="hover:text-[#13ec5b] transition-colors">Termos de Uso</button></li>
                            <li><button onClick={() => window.location.href = '/legal'} className="hover:text-[#13ec5b] transition-colors">Política de Privacidade</button></li>
                            <li><button onClick={() => window.location.href = '/security'} className="hover:text-[#13ec5b] transition-colors">Segurança</button></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs">
                        © 2026 NowFlow. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-6">
                        {/* Redes Sociais (Placeholders) */}
                        <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs">Instagram</a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs">LinkedIn</a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs">Twitter</a>
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
        document.title = 'NowFlow | Gestão de Tarefas e Time Tracking para Equipes de Alta Performance';
    }, []);

    return (
        <div className="min-h-screen bg-[#102216] text-white selection:bg-[#13ec5b] selection:text-[#102216]">
            <Navbar />

            <main>
                <Hero />
                <PainPoints />
                <Features />
                <TestimonialsCarousel />
                <Pricing />
                <FAQ />
            </main>

            <Footer />
            <StickyMobileCTA />
        </div>
    );
}
