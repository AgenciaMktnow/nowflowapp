import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Clock, MessageCircle } from 'lucide-react';

export default function Contact() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'NowFlow | Contato e Suporte';
        window.scrollTo(0, 0);
    }, []);

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
                            Fale Conosco
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                            Estamos Aqui para <span className="text-[#13ec5b]">Ajudar</span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Precisa de ajuda ou quer saber como o NowFlow pode escalar sua operação específica? Nossa equipe de especialistas está pronta para atender você.
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-[#13ec5b]/10 rounded-xl flex items-center justify-center border border-[#13ec5b]/20 mb-6">
                            <Mail size={24} className="text-[#13ec5b]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Canais de Atendimento</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li className="flex flex-col">
                                <span className="text-sm font-bold text-white mb-1">Suporte Técnico</span>
                                <a href="mailto:nowflow@nowflow.com.br" className="hover:text-[#13ec5b] transition-colors">nowflow@nowflow.com.br</a>
                                <span className="text-xs mt-1 text-gray-500">(Atendimento humanizado em português)</span>
                            </li>
                            <li className="flex flex-col pt-4 border-t border-white/5">
                                <span className="text-sm font-bold text-white mb-1">Parcerias e Vendas</span>
                                <a href="mailto:comercial@nowflow.com.br" className="hover:text-[#13ec5b] transition-colors">comercial@nowflow.com.br</a>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
                    >
                        <div className="w-12 h-12 bg-[#13ec5b]/10 rounded-xl flex items-center justify-center border border-[#13ec5b]/20 mb-6">
                            <Clock size={24} className="text-[#13ec5b]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Horário de Atendimento</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Nossa equipe está disponível para garantir que sua operação nunca pare.
                        </p>
                        <div className="flex items-center gap-3 text-white font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#13ec5b] animate-pulse"></span>
                            Segunda a Sexta, das 09h às 18h
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
