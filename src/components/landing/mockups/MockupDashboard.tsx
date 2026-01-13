import { Search, Bell, Monitor, Timer, CheckCircle, Clock } from 'lucide-react';

export function MockupDashboard() {
    return (
        <div className="relative mx-auto max-w-6xl rounded-xl bg-[#102216] border border-white/5 shadow-2xl overflow-hidden select-none pointer-events-none group perspective-1000 flex flex-col min-h-[400px] sm:h-[600px]">
            {/* Header Mockup */}
            <div className="flex items-center justify-between border-b border-white/5 px-3 sm:px-6 py-3 sm:py-4 bg-[#102216]/95 backdrop-blur z-20">
                <div className="flex items-center gap-2 sm:gap-4 text-white">
                    <h2 className="text-base sm:text-xl font-bold tracking-tight">Dashboard</h2>
                </div>

                <div className="hidden sm:flex flex-1 justify-center px-4 max-w-xl mx-auto">
                    <div className="w-full bg-[#183925] border border-[#23482f] rounded-xl h-10 flex items-center px-4 gap-2 text-[#92c9a4]">
                        <Search size={16} />
                        <span className="text-sm">Buscar tarefas, projetos...</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#183925] border border-[#23482f] flex items-center justify-center text-[#92c9a4]">
                        <Bell size={14} className="sm:hidden" />
                        <Bell size={16} className="hidden sm:block" />
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#13ec5b] to-[#0ea842] flex items-center justify-center text-[#102216] font-bold text-[10px] sm:text-xs ring-2 ring-[#13ec5b]/20">
                        ND
                    </div>
                </div>
            </div>

            {/* Main Content - Mobile First */}
            <div className="flex-1 p-3 sm:p-6 md:p-8 bg-[#102216] overflow-hidden">
                {/* Summary Metrics - Always visible */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-[#23482f]/30 p-2 sm:p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-0.5 sm:gap-1 backdrop-blur-sm">
                        <span className="text-xl sm:text-3xl font-bold text-white">12</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-[#92c9a4] uppercase tracking-wider text-center">Vencendo Hoje</span>
                    </div>
                    <div className="bg-[#23482f]/30 p-2 sm:p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-0.5 sm:gap-1 backdrop-blur-sm">
                        <span className="text-xl sm:text-3xl font-bold text-white">5</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-purple-400 uppercase tracking-wider text-center">Revisão</span>
                    </div>
                    <div className="bg-[#23482f]/30 p-2 sm:p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-0.5 sm:gap-1 backdrop-blur-sm">
                        <span className="text-xl sm:text-3xl font-bold text-[#13ec5b]">28</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-[#13ec5b] uppercase tracking-wider text-center">Concluídas</span>
                    </div>
                </div>

                {/* Active Timer Widget - Simplified for mobile */}
                <div className="bg-[#183925]/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 relative overflow-hidden border border-white/5 shadow-lg group mb-4 sm:mb-6">
                    <div className="hidden sm:block absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Timer size={120} className="text-[#13ec5b]" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#13ec5b]/20 text-[#13ec5b]">
                                    Em Andamento
                                </span>
                                <span className="text-[#92c9a4] text-[10px] sm:text-xs font-medium hidden sm:inline">• MktNow - Sede</span>
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold text-white mb-0.5 sm:mb-1">Redesign da Landing Page 2.0</h3>
                            <p className="text-[#92c9a4] text-xs sm:text-sm">Responsável: Netinho Duque</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 bg-[#102216]/80 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/5 backdrop-blur-sm">
                            <div className="text-center w-8 sm:w-12">
                                <div className="text-lg sm:text-2xl font-mono font-bold text-white">02</div>
                                <span className="text-[8px] sm:text-[9px] uppercase text-[#92c9a4]">Hr</span>
                            </div>
                            <div className="text-white/20 font-light text-lg sm:text-2xl">:</div>
                            <div className="text-center w-8 sm:w-12">
                                <div className="text-lg sm:text-2xl font-mono font-bold text-white">15</div>
                                <span className="text-[8px] sm:text-[9px] uppercase text-[#92c9a4]">Min</span>
                            </div>
                            <div className="text-white/20 font-light text-lg sm:text-2xl">:</div>
                            <div className="text-center w-8 sm:w-12">
                                <div className="text-lg sm:text-2xl font-mono font-bold text-[#13ec5b] animate-pulse">42</div>
                                <span className="text-[8px] sm:text-[9px] uppercase text-[#92c9a4]">Seg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop-only sections */}
                <div className="hidden md:block space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#92c9a4] uppercase tracking-wider">Minhas Tarefas</span>
                        <button className="text-[#13ec5b] text-xs font-bold hover:underline">Ver todas</button>
                    </div>
                    {[
                        { title: 'Aprovar Wireframe Dashboard', time: '14:00', tag: 'Design', status: 'TODO' },
                        { title: 'Reunião com Stakeholders', time: '16:30', tag: 'Meeting', status: 'WAITING' },
                    ].map((task, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-[#183925]/30 border border-white/5 rounded-xl hover:bg-[#183925]/50 transition-colors">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === 'DONE' ? 'bg-[#13ec5b] border-[#13ec5b]' : 'border-[#92c9a4]/50'}`}>
                                {task.status === 'DONE' && <CheckCircle size={12} className="text-[#102216]" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium text-sm">{task.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock size={12} className="text-[#92c9a4]" />
                                    <span className="text-xs text-[#92c9a4]">{task.time}</span>
                                </div>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-white/5 text-xs font-bold text-white">{task.tag}</span>
                        </div>
                    ))}
                </div>

                {/* Mobile: Show simplified productivity */}
                <div className="md:hidden bg-[#183925] border border-[#13ec5b]/10 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Monitor size={14} className="text-[#13ec5b]" />
                            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Produtividade</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-white tracking-tighter">06:24</span>
                        <span className="text-[#92c9a4] text-xs mb-1 font-medium">horas focadas</span>
                    </div>
                    <div className="bg-[#102216]/40 p-2 rounded-lg border border-white/5 backdrop-blur-md mt-3">
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-white font-bold uppercase tracking-wider">Meta Diária</span>
                            <span className="text-[#13ec5b] font-bold">80%</span>
                        </div>
                        <div className="h-2 w-full bg-[#102216] rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-[#13ec5b] to-[#0ea842] shadow-[0_0_15px_rgba(19,236,91,0.4)]" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
