import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Shield, Zap, Heart } from 'lucide-react';

export default function About() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'NowFlow | Sobre Nós';
        window.scrollTo(0, 0);
    }, []);

    const pillars = [
        {
            title: 'Design Centrado na Execução',
            description: 'Se a equipe não gosta de usar, o dado não é real. O NowFlow é desenhado para ser tão fluido quanto um chat.',
            icon: <Heart size={24} className="text-[#13ec5b]" />
        },
        {
            title: 'Governança de Tempo Nativa',
            description: 'Fomos os primeiros a integrar a pausa inteligente programada, protegendo a lucratividade e o foco da sua operação sem esforço manual.',
            icon: <Shield size={24} className="text-[#13ec5b]" />
        },
        {
            title: 'Transparência Radical',
            description: 'Acreditamos que dados claros geram equipes confiantes. Eliminamos o jogo de adivinhação sobre "quem está fazendo o quê".',
            icon: <Target size={24} className="text-[#13ec5b]" />
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
                {/* Hero Section */}
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold uppercase mb-6 border border-[#13ec5b]/20">
                            Sobre Nós
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                            Não somos apenas mais um software de gestão. <br />
                            Somos o novo padrão de <span className="text-[#13ec5b]">sincronia operacional</span>.
                        </h1>
                    </motion.div>
                </div>

                {/* History & Pain */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-20 prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed"
                >
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-8 bg-[#13ec5b] rounded-full"></span>
                        A História e a Dor
                    </h2>
                    <p className="mb-6">
                        O NowFlow não nasceu em uma sala de reuniões corporativa, mas no campo de batalha das agências e empresas de tecnologia de alta performance.
                    </p>
                    <p>
                        Vimos de perto o "custo invisível do caos": gestores brilhantes consumidos por planilhas infinitas e equipes talentosas sufocadas por ferramentas pesadas que pareciam mais um obstáculo do que um suporte. Percebemos que o mercado estava saturado de "softwares de prateleira" que prometiam organização, mas entregavam burocracia.
                    </p>
                </motion.div>

                {/* Epiphany */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-20 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8 md:p-12"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-[#13ec5b]" />
                        A Epifania (A Virada de Chave)
                    </h2>
                    <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                        <p>
                            Entendemos que a verdadeira produtividade não vem de "gerir tarefas", mas de <strong>sincronizar energia</strong>.
                        </p>
                        <p>
                            Decidimos criar o que nós mesmos precisávamos: uma plataforma onde a execução e o tempo fluem juntos, de forma intuitiva. Onde o dono da empresa tem a segurança dos dados e o colaborador tem a liberdade de focar no que faz de melhor.
                        </p>
                    </div>
                </motion.div>

                {/* Pillars */}
                <div className="mb-24">
                    <h2 className="text-3xl font-display font-bold text-white mb-12 text-center">Nossos Pilares</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {pillars.map((pillar, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
                                className="bg-[#102216] border border-white/10 p-6 rounded-2xl hover:border-[#13ec5b]/30 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-[#13ec5b]/10 rounded-xl flex items-center justify-center border border-[#13ec5b]/20 mb-6 group-hover:scale-110 transition-transform">
                                    {pillar.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{pillar.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {pillar.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center bg-[#13ec5b]/5 border border-[#13ec5b]/20 rounded-3xl p-12 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                            Junte-se à nova era da gestão.
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                            Hoje, o NowFlow é o braço direito de centenas de gestores que decidiram parar de gerir o caos para começar a fluir em sincronia. Estamos prontos para ser o motor da sua próxima grande entrega.
                        </p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-[#13ec5b] hover:bg-[#0ea842] text-[#102216] px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] transform hover:-translate-y-1"
                        >
                            Criar minha conta e começar o teste de 14 dias
                        </button>
                        <p className="text-xs text-gray-500 mt-4">
                            Sem cartão de crédito. Sem letras miúdas. Apenas resultados.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
