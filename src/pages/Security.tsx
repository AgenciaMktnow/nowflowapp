import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Server, Database, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Security() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'NowFlow | Segurança de Nível Bancário';
        window.scrollTo(0, 0);
    }, []);

    const layers = [
        {
            title: '1. Proteção de Dados e Criptografia',
            icon: <Lock size={32} className="text-[#13ec5b]" />,
            items: [
                { title: 'Em Trânsito', text: 'Todas as comunicações entre seu navegador e nossos servidores são protegidas por criptografia SSL/TLS (HTTPS) de 256 bits.' },
                { title: 'Em Repouso', text: 'Seus dados e arquivos são armazenados com criptografia AES-256, o padrão ouro de segurança cibernética.' },
                { title: 'Privacidade Radical', text: 'Nenhum colaborador do NowFlow tem acesso aos seus dados de tarefas ou conversas sem a sua autorização expressa via chamado de suporte.' }
            ]
        },
        {
            title: '2. Infraestrutura e Disponibilidade (Tier 4)',
            icon: <Server size={32} className="text-[#13ec5b]" />,
            items: [
                { title: 'Datacenters Globais', text: 'Utilizamos infraestrutura de ponta com certificações ISO 27001, garantindo conformidade com os mais altos padrões de segurança internacional.' },
                { title: 'Redundância Geográfica', text: 'Seus dados são replicados em tempo real em múltiplos datacenters para garantir que, mesmo em casos de desastres naturais em uma região, sua operação nunca pare.' },
                { title: 'Uptime de 99,9%', text: 'Monitoramento 24/7/365 para garantir que o NowFlow esteja sempre disponível quando você precisar.' }
            ]
        },
        {
            title: '3. Backups e Recuperação',
            icon: <Database size={32} className="text-[#13ec5b]" />,
            items: [
                { title: 'Backups Diários', text: 'Realizamos cópias de segurança automáticas de toda a sua conta a cada 24 horas.' },
                { title: 'Recuperação de Desastres', text: 'Protocolos de restauração rápida que garantem a integridade do seu histórico de produtividade contra qualquer falha técnica.' }
            ]
        },
        {
            title: '4. Conformidade (LGPD)',
            icon: <ShieldCheck size={32} className="text-[#13ec5b]" />,
            items: [
                { title: '100% Alinhados', text: 'Estamos 100% alinhados à Lei Geral de Proteção de Dados (LGPD). Você é o único dono dos seus dados; nós somos apenas os custodiantes.' }
            ]
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

            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                {/* Hero */}
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold uppercase mb-6 border border-[#13ec5b]/20">
                            <ShieldCheck size={14} />
                            Segurança
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                            Segurança de Nível Bancário: <br />
                            Seu trabalho é criar, <span className="text-[#13ec5b]">o nosso é proteger</span>.
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            No NowFlow, entendemos que as tarefas, arquivos e o tempo da sua equipe são o ativo mais precioso da sua empresa. Por isso, construímos uma infraestrutura de segurança multicamadas que segue os mesmos protocolos rigorosos usados por instituições financeiras globais. Você foca no fluxo; nós cuidamos da blindagem.
                        </p>
                    </motion.div>
                </div>

                {/* Layers */}
                <div className="space-y-8 mb-24">
                    {layers.map((layer, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-[#102216] border border-white/10 rounded-2xl p-8 hover:border-[#13ec5b]/30 transition-colors group relative overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#13ec5b]/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-[#13ec5b]/10 transition-colors"></div>

                            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-[#13ec5b]/10 rounded-2xl flex items-center justify-center border border-[#13ec5b]/20 group-hover:scale-105 transition-transform">
                                        {layer.icon}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-6">{layer.title}</h3>
                                    <div className="grid md:grid-cols-1 gap-6">
                                        {layer.items.map((item, i) => (
                                            <div key={i} className="flex gap-4">
                                                <CheckCircle className="text-[#13ec5b] flex-shrink-0 mt-1" size={20} />
                                                <div>
                                                    <h4 className="font-bold text-white text-lg mb-1">{item.title}</h4>
                                                    <p className="text-gray-400 leading-relaxed">{item.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Trigger & CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center bg-[#05110A] border border-white/10 rounded-3xl p-12 md:p-16 relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <Lock size={48} className="text-[#13ec5b] mx-auto mb-8" />
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                            Sua empresa em mãos seguras.
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Sabemos que a confiança não se pede, se conquista. Por isso, investimos continuamente em auditorias e atualizações de segurança para que o NowFlow seja sempre o porto seguro da sua operação.
                        </p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-[#13ec5b] hover:bg-[#0ea842] text-[#102216] px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] transform hover:-translate-y-1 flex items-center gap-2 mx-auto"
                        >
                            <ShieldCheck size={20} />
                            Começar meu teste grátis e seguro
                        </button>
                        <p className="text-xs text-gray-500 mt-4">
                            Sem cartão de crédito. Sua privacidade é nossa prioridade.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
