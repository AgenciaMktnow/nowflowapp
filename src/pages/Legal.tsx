import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, FileText } from 'lucide-react';

export default function Legal() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'NowFlow | Termos e Privacidade';
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            title: 'Política de Dados',
            icon: <Shield size={24} className="text-[#13ec5b]" />,
            content: 'Seus dados de tarefas, conversas e tempo pertencem a você. O NowFlow não comercializa informações de usuários com terceiros.'
        },
        {
            title: 'Assinatura e Cancelamento',
            icon: <FileText size={24} className="text-[#13ec5b]" />,
            content: 'O serviço é prestado no modelo SaaS, sem fidelidade obrigatória, permitindo o cancelamento a qualquer momento sem taxas ocultas.'
        },
        {
            title: 'Privacidade e Segurança',
            icon: <Lock size={24} className="text-[#13ec5b]" />,
            content: 'Coletamos apenas informações essenciais para a autenticação da conta e processamento de faturamento seguro.'
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

            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold uppercase mb-6 border border-[#13ec5b]/20">
                            Jurídico
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                            Termos de Uso e <br /><span className="text-[#13ec5b]">Privacidade</span>
                        </h1>
                        <p className="text-gray-400 text-lg">Resumo Legal: Proteção e Transparência (LGPD)</p>
                    </motion.div>
                </div>

                <div className="space-y-8">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 bg-[#13ec5b]/10 rounded-xl flex items-center justify-center border border-[#13ec5b]/20 flex-shrink-0">
                                    {section.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-3">{section.title}</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
