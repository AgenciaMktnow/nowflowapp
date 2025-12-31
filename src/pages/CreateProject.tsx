import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { boardService, type Board } from '../services/board.service';

export default function CreateProject() {
    const navigate = useNavigate();
    const [boards, setBoards] = useState<Board[]>([]);

    useEffect(() => {
        boardService.getBoards().then(({ data }) => {
            if (data) setBoards(data);
        });
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            <header className="h-16 border-b border-[#23482f] bg-background-dark/95 backdrop-blur-sm flex items-center justify-between px-6 lg:px-10 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button className="md:hidden text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="hidden md:flex items-center text-white gap-2">
                        <span className="material-symbols-outlined text-primary">add_circle</span>
                        <h2 className="text-lg font-bold tracking-tight">Novo Projeto</h2>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex w-64 h-10 items-center rounded-lg bg-input-dark group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <div className="pl-3 text-text-muted flex items-center justify-center">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input className="bg-transparent border-none text-white text-sm w-full focus:ring-0 placeholder:text-text-muted/70 outline-none" placeholder="Buscar..." type="text" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="size-10 rounded-lg bg-input-dark flex items-center justify-center text-white hover:bg-[#2d5c3c] transition-colors relative">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                            <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border border-input-dark"></span>
                        </button>
                        <button className="size-10 rounded-lg bg-input-dark flex items-center justify-center text-white hover:bg-[#2d5c3c] transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                        </button>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-background-dark p-6 lg:p-10 scroll-smooth">
                <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
                    <nav className="flex items-center text-sm font-medium">
                        <Link className="text-text-muted hover:text-primary transition-colors" to="/">Home</Link>
                        <span className="mx-2 text-text-muted/50">/</span>
                        <Link className="text-text-muted hover:text-primary transition-colors" to="/kanban">Projetos</Link>
                        <span className="mx-2 text-text-muted/50">/</span>
                        <span className="text-primary">Novo Projeto</span>
                    </nav>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Cadastro de Projeto</h1>
                            <p className="text-text-muted max-w-2xl">Preencha os dados abaixo para iniciar um novo fluxo de trabalho. Certifique-se de associar o cliente correto.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-input-dark px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Rascunho
                            </span>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-surface-dark border border-[#23482f] overflow-hidden shadow-xl shadow-black/20">
                        <div className="px-6 py-4 border-b border-[#23482f] bg-[#1a3024]">
                            <h3 className="text-white text-base font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">info</span>
                                Informações Básicas
                            </h3>
                        </div>
                        <div className="p-6 md:p-8">
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">Nome do Projeto</label>
                                    <input className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" placeholder="Ex: Redesign do E-commerce" type="text" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">Descrição Detalhada</label>
                                    <textarea className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm resize-none" placeholder="Descreva o escopo e os objetivos principais..." rows={4}></textarea>
                                    <div className="flex justify-end">
                                        <span className="text-xs text-text-muted/60">0/500 caracteres</span>
                                    </div>
                                </div>
                                <div className="md:col-span-2 h-px bg-[#23482f] my-2"></div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        Data de Início
                                    </label>
                                    <input className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm [color-scheme:dark]" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">event_available</span>
                                        Prazo Final
                                    </label>
                                    <input className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm [color-scheme:dark]" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">grid_view</span>
                                        Quadro (Núcleo)
                                    </label>
                                    <div className="relative">
                                        <select className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none cursor-pointer">
                                            <option disabled selected value="">Selecione um núcleo</option>
                                            {boards.map(board => (
                                                <option key={board.id} value={board.id}>{board.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">business</span>
                                        Cliente
                                    </label>
                                    <div className="relative">
                                        <select className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none cursor-pointer">
                                            <option disabled defaultValue="" value="">Selecione um cliente</option>
                                            <option value="1">Acme Corp</option>
                                            <option value="2">Stark Industries</option>
                                            <option value="3">Wayne Enterprises</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        Gerente do Projeto
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <div className="size-6 rounded-full bg-cover bg-center" data-alt="Manager avatar" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDrZ_71sa9mbtvpFbeDMbiQriqykoFypizcEkCKCXlHMlEMNKtUWXy3eQ8phX3ua2Y6x1hmdhZeNWEDqIP6-zhgeqUkV0-nsvzK6sITMuJ0vDfcWwWJUxr_cXjmk6JR2jvx7jV2X49kpfDG4hFi_hPEukq8gZmIHad0dySjn1lSMyr_iukiRg1I4uxmh0OB6i3Db1vMg2dh-KRoyMG5_r42Zzb2g8Ew4xFDUPwdwWm_Q9mbprs3RamZoaOXGSnrFobPgDmDoIB3Rks")' }}></div>
                                        </div>
                                        <select className="w-full bg-input-dark border-transparent rounded-lg p-3 pl-12 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none cursor-pointer">
                                            <option defaultValue="1" value="1">Carlos Silva (Você)</option>
                                            <option value="2">Ana Souza</option>
                                            <option value="3">Roberto Mendes</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">toggle_on</span>
                                        Status Inicial
                                    </label>
                                    <div className="relative">
                                        <select className="w-full bg-input-dark border-transparent rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none cursor-pointer">
                                            <option value="planning">Em Planejamento</option>
                                            <option value="active">Ativo</option>
                                            <option value="hold">Em Espera</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-text-muted">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">flag</span>
                                        Prioridade
                                    </label>
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer">
                                            <input className="peer sr-only" name="priority" type="radio" />
                                            <div className="px-4 py-2.5 rounded-lg bg-input-dark border border-transparent text-text-muted peer-checked:bg-red-500/20 peer-checked:text-red-400 peer-checked:border-red-500/50 transition-all text-sm font-medium hover:bg-[#2d5c3c]">
                                                Alta
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input defaultChecked className="peer sr-only" name="priority" type="radio" />
                                            <div className="px-4 py-2.5 rounded-lg bg-input-dark border border-transparent text-text-muted peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:border-primary/50 transition-all text-sm font-medium hover:bg-[#2d5c3c]">
                                                Média
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input className="peer sr-only" name="priority" type="radio" />
                                            <div className="px-4 py-2.5 rounded-lg bg-input-dark border border-transparent text-text-muted peer-checked:bg-blue-500/20 peer-checked:text-blue-400 peer-checked:border-blue-500/50 transition-all text-sm font-medium hover:bg-[#2d5c3c]">
                                                Baixa
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">groups</span>
                                        Equipe do Projeto
                                    </label>
                                    <div className="w-full bg-input-dark border-transparent rounded-lg p-2 min-h-[56px] flex flex-wrap items-center gap-2 focus-within:ring-1 focus-within:ring-primary">
                                        <div className="flex items-center gap-2 bg-[#1a3024] border border-[#23482f] rounded-full pl-1 pr-3 py-1 animate-in fade-in zoom-in duration-300">
                                            <div className="size-6 rounded-full bg-cover bg-center" data-alt="Team member woman" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAA0cRR6Nq99Ydz9_JAH4xBiNnMog6J5AzwXo7M1z2-yZKgfOfWcNcwEwrZqYkKxWK18nWFgLXGriK6WHpmVPT3uMBv37NHtqjel98_hHIv1GY0GWYvQeeOWZiEbsFp4kMF-uAMAKLAsRXLt-8KsSAhwhRr_nW6yxVyGAZX8VjXnyKDqu9uDFOLrpMgLt8p02ClSC_9-eTG85ewB2MGR7gU1neYrv_49tu1GCZLvSNUb1hrGSpL6vVJVNc30lFZLiJiXJrTYQr4a_8")' }}></div>
                                            <span className="text-xs text-white font-medium">Julia R.</span>
                                            <button className="text-text-muted hover:text-white ml-1" type="button">
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-[#1a3024] border border-[#23482f] rounded-full pl-1 pr-3 py-1 animate-in fade-in zoom-in duration-300 delay-75">
                                            <div className="size-6 rounded-full bg-cover bg-center" data-alt="Team member man" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBZWXXEBwIp16CGMK7vELtLVqKIZ0j9CXwFao0s7yDYc5xip8zPP9olhCEljZ2jfs5gO3TYCAiTl1rsy9IQ7w--fGbgfYdmKbbvLth_FtkbTH7xc3YQv1T_oZB-_JlPujVYHDCesNwDnIs2Q3oT2or5WsCGfByPqcVF-VHvwUiMjuzPqSn65BDwmlH8dRpqGUUi1IDkGnxSbwezWwlxhrh-L1-x7XzDb6lu79Lg-ueflAA5kxxkSglgJTgKfL1Xd7xgvGaUy4OmQNU")' }}></div>
                                            <span className="text-xs text-white font-medium">Marcos T.</span>
                                            <button className="text-text-muted hover:text-white ml-1" type="button">
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                            </button>
                                        </div>
                                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-text-muted border border-dashed border-[#92c9a4]/30 hover:bg-[#2d5c3c] hover:text-white transition-colors text-xs font-medium" type="button">
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                            Adicionar Membro
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-5 bg-[#13261a] border-t border-[#23482f] flex flex-col-reverse md:flex-row items-center justify-end gap-4">
                            <button
                                className="w-full md:w-auto px-6 py-2.5 rounded-lg text-white font-medium hover:bg-white/5 hover:text-white transition-colors"
                                type="button"
                                onClick={() => navigate('/kanban')}
                            >
                                Cancelar
                            </button>
                            <button className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-primary text-[#0d1f14] font-bold hover:bg-[#3bfd7b] shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-0.5" type="button">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
                                Salvar Projeto
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="rounded-xl bg-[#13261a]/50 border border-[#23482f] p-4 flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-input-dark text-primary">
                                <span className="material-symbols-outlined">lightbulb</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Dica Pro</h4>
                                <p className="text-text-muted text-xs mt-1 leading-relaxed">Use tags consistentes para facilitar a filtragem de projetos nos relatórios mensais.</p>
                            </div>
                        </div>
                        <div className="rounded-xl bg-[#13261a]/50 border border-[#23482f] p-4 flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-input-dark text-blue-400">
                                <span className="material-symbols-outlined">folder_shared</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Arquivos</h4>
                                <p className="text-text-muted text-xs mt-1 leading-relaxed">Você poderá anexar contratos e briefings na próxima etapa após salvar o projeto.</p>
                            </div>
                        </div>
                        <div className="rounded-xl bg-[#13261a]/50 border border-[#23482f] p-4 flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-input-dark text-purple-400">
                                <span className="material-symbols-outlined">notifications_active</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Notificações</h4>
                                <p className="text-text-muted text-xs mt-1 leading-relaxed">A equipe selecionada receberá um e-mail de convite automaticamente.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
