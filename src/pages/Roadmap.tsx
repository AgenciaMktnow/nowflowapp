import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Brain, Presentation } from 'lucide-react';

export default function Roadmap() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'NowFlow | Roadmap de Inovação';
        window.scrollTo(0, 0);
    }, []);

    const roadmapItems = [
        {
            quarter: 'Q1 2026',
            title: 'Integração de Ecossistemas',
            description: 'Integração nativa com ecossistemas Google Workspace e Slack.',
            icon: <Zap size={24} className="text-[#13ec5b]" />
        },
        {
            quarter: 'Q2 2026',
            title: 'Inteligência Artificial',
            description: 'Módulo de Inteligência Artificial para estimativa automática de prazos baseada no histórico da equipe.',
            icon: <Brain size={24} className="text-[#13ec5b]" />
        },
        {
            quarter: 'Q3 2026',
            title: 'Dashboards Customizáveis',
            description: 'Dashboards customizáveis para exportação direta em apresentações de performance.',
            icon: <Presentation size={24} className="text-[#13ec5b]" />
        }
    ];

    return (
        <div className="min-h-screen bg-[#102216] text-white selection:bg-[#13ec5b] selection:text-[#102216] font-sans">
            <nav className="fixed top-0 w-full z-50 bg-[#102216]/80 backdrop-blur-md border-b border-[#13ec5b]/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/Logo-nowflow-banco.png" alt="NowFlow Logo" className="h-10 w-auto object-contain" />
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="text-white hover:text-[#13ec5b] transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <ArrowLeft size={16} /> Voltar para Home
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold uppercase mb-6 border border-[#13ec5b]/20">
                            Roadmap
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                            O Futuro da <span className="text-[#13ec5b]">Produtividade</span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Trabalhamos em um ciclo de inovação contínua para manter o NowFlow como o sistema de execução mais ágil do mercado. Confira o que estamos construindo.
                        </p>
                    </motion.div>
                </div>

                <div className="relative">
                    {/* Linha Vertical Conectora */}
                    <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-[#13ec5b]/20 hidden md:block"></div>

                    <div className="space-y-12">
                        {roadmapItems.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.2 }}
                                className="relative md:pl-24 group"
                            >
                                {/* Ponto na Linha */}
                                <div className="absolute left-[26px] top-8 w-4 h-4 rounded-full bg-[#102216] border-2 border-[#13ec5b] z-10 hidden md:block group-hover:bg-[#13ec5b] transition-colors"></div>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#13ec5b]/30 transition-all hover:translate-x-2">
                                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                        <div className="w-12 h-12 bg-[#13ec5b]/10 rounded-xl flex items-center justify-center border border-[#13ec5b]/20 flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="text-[#13ec5b] text-sm font-bold uppercase tracking-wider mb-2">{item.quarter}</div>
                                            <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                                            <p className="text-gray-400 leading-relaxed font-light">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-20 text-center p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10"
                >
                    <p className="text-gray-400 italic">
                        "Foco: Visão e Inovação contínua."
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
