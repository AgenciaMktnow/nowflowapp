import { Zap, CheckCircle2, TrendingUp, Search, Bell } from 'lucide-react';

export function MockupDashboard() {
    return (
        <div className="relative mx-auto max-w-5xl rounded-xl bg-[#0B0E0F] border border-white/10 shadow-2xl overflow-hidden select-none pointer-events-none group perspective-1000">
            {/* Header / Browser Frame */}
            <div className="h-10 bg-[#0B0E0F] border-b border-white/5 flex items-center px-4 justify-between">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="flex-1 max-w-sm mx-auto h-6 bg-white/5 rounded flex items-center px-3 text-[10px] text-text-muted gap-2">
                    <Search size={10} />
                    <span>Search or type a command...</span>
                </div>
                <div className="flex gap-3 text-text-muted">
                    <Bell size={14} />
                    <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/50" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex">
                {/* Sidebar */}
                <div className="w-16 border-r border-white/5 bg-[#0B0E0F] h-[400px] flex flex-col items-center py-4 gap-4">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary mb-4">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${i === 1 ? 'bg-white/10 text-white' : 'text-text-muted/50'}`}>
                            <div className="w-4 h-4 bg-current rounded-sm opacity-50" />
                        </div>
                    ))}
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 bg-gradient-to-br from-[#0B0E0F] to-[#162E20]/30 p-8">
                    {/* Welcome Header */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-display font-bold text-white mb-1">Bom dia, Alex 👋</h3>
                        <p className="text-text-muted text-sm">Aqui está o resumo da sua operação hoje.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {/* Stat 1 */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="text-xs text-green-400 flex items-center gap-1">+12% <TrendingUp size={10} /></span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">24</div>
                            <div className="text-xs text-text-muted">Tarefas Concluídas</div>
                        </div>
                        {/* Stat 2 */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Zap size={16} />
                                </div>
                                <span className="text-xs text-text-muted">Hoje</span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">12</div>
                            <div className="text-xs text-text-muted">Em Andamento</div>
                        </div>
                        {/* Stat 3 */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Search size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">98%</div>
                            <div className="text-xs text-text-muted">Produtividade</div>
                        </div>
                    </div>

                    {/* Recent Tasks List */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Minha Fila</div>
                        {[
                            { title: 'Revisar Campanha Black Friday', tag: 'Marketing', color: 'text-pink-400 bg-pink-400/10' },
                            { title: 'Aprovar Layout Landing Page', tag: 'Design', color: 'text-purple-400 bg-purple-400/10' },
                            { title: 'Atualizar Integração de Pagamento', tag: 'Dev', color: 'text-blue-400 bg-blue-400/10' },
                        ].map((task, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full border-2 border-text-muted/30" />
                                    <span className="text-sm text-white font-medium">{task.title}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${task.color} font-bold`}>{task.tag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
