import { useState } from 'react';

export default function Help() {
    const [searchQuery, setSearchQuery] = useState('');


    const categories = [
        {
            id: 'getting-started',
            title: 'Primeiros Passos',
            icon: 'rocket_launch',
            description: 'Tudo o que você precisa saber para começar a usar o NowFlow.',
            articles: [
                { title: 'Conceitos Básicos do Kanban', content: 'Entenda como funcionam as colunas, cartões e o fluxo de trabalho.' },
                { title: 'Criando sua Primeira Tarefa', content: 'Aprenda a criar, atribuir e gerenciar tarefas rapidamente.' },
                { title: 'convidando sua Equipe', content: 'Adicione membros ao seu time e configure permissões de acesso.' }
            ]
        },
        {
            id: 'tasks',
            title: 'Gestão de Tarefas',
            icon: 'check_circle',
            description: 'Domine a criação, edição e acompanhamento de tarefas.',
            articles: [
                { title: 'Checklists e Subtarefas', content: 'Quebre tarefas complexas em etapas menores com checklists.' },
                { title: 'Anexos e Arquivos', content: 'Como fazer upload e gerenciar documentos nas tarefas.' },
                { title: 'Histórico e Comentários', content: 'Mantenha o rastro de todas as alterações e comunicações.' }
            ]
        },
        {
            id: 'time-tracking',
            title: 'Controle de Tempo',
            icon: 'timer',
            description: 'Monitore produtividade e horas trabalhadas.',
            articles: [
                { title: 'Usando o Timer', content: 'Inicie e pare o cronômetro enquanto trabalha nas tarefas.' },
                { title: 'Lançamento Manual', content: 'Esqueceu o timer? Saiba como registrar horas manualmente.' },
                { title: 'Relatórios de Tempo', content: 'Visualize e exporte relatórios de desempenho da equipe.' }
            ]
        },
        {
            id: 'admin',
            title: 'Administração',
            icon: 'admin_panel_settings',
            description: 'Configurações avançadas para donos e gerentes.',
            articles: [
                { title: 'Planos e Faturamento', content: 'Gerencie sua assinatura, limites e métodos de pagamento.' },
                { title: 'Configurações da Empresa', content: 'Personalize o nome, logo e identidade visual da sua agência.' },
                { title: 'Gestão de Clientes', content: 'Cadastre seus clientes, contratos e vincule projetos.' }
            ]
        }
    ];

    const filteredCategories = categories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.articles.some(art => art.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex-1 w-full bg-[#0F1115] overflow-y-auto custom-scrollbar p-6 md:p-10 animate-fade-in">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                        Como podemos <span className="text-primary">ajudar</span>?
                    </h1>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                        Encontre respostas, tutoriais e dicas para aproveitar ao máximo a plataforma NowFlow.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto mt-8 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar tópicos (ex: timer, tarefas, equipe)..."
                            className="w-full bg-[#1A1D21] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-text-muted transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-[#202429] outline-none shadow-lg"
                        />
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredCategories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-[#121214] border border-white/5 rounded-2xl p-6 hover:bg-[#1A1D21] hover:border-primary/20 transition-all group cursor-default"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-black transition-colors">
                                    <span className="material-symbols-outlined text-2xl">{category.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{category.title}</h3>
                                    <p className="text-sm text-text-muted mt-1 leading-relaxed">{category.description}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-6 pt-6 border-t border-white/5">
                                {category.articles.map((article, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group/item">
                                        <span className="material-symbols-outlined text-text-muted text-[18px] group-hover/item:text-primary transition-colors">article</span>
                                        <span className="text-sm font-medium text-text-secondary group-hover/item:text-white transition-colors">{article.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredCategories.length === 0 && (
                        <div className="col-span-full py-12 text-center text-text-muted">
                            <span className="material-symbols-outlined text-4xl mb-3 opacity-30">search_off</span>
                            <p>Nenhum resultado encontrado para "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {/* Support Card */}
                <div className="bg-gradient-to-r from-[#1A1D21] to-[#121214] rounded-2xl p-8 md:p-12 border border-white/5 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-2">
                            <span className="material-symbols-outlined text-green-500 text-3xl">support_agent</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Ainda precisa de ajuda?</h2>
                            <p className="text-text-muted max-w-xl mx-auto">
                                Nossa equipe de especialistas está pronta para ajudar você a resolver qualquer problema ou dúvida técnica.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <a
                                href="mailto:suporte@nowflow.it"
                                className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-light transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                Fale com o Suporte
                            </a>
                            <button className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                Ver Tutoriais em Vídeo
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
