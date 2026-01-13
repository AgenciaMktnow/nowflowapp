import { Plus } from 'lucide-react';

export function MockupKanban() {
    return (
        <div className="w-full bg-[#102216] border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
            {/* Header Simulado */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#13ec5b] flex items-center justify-center text-[#102216] font-bold text-lg shadow-[0_0_15px_rgba(19,236,91,0.3)]">W</div>
                    <div>
                        <div className="text-base font-bold text-white">Website Institucional</div>
                        <div className="text-xs text-[#92c9a4]">MktNow - Sede • Sprint 24</div>
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-[#183925] border-2 border-[#102216] flex items-center justify-center text-xs text-[#92c9a4] font-bold">
                            {['JD', 'AN', 'MP'][i - 1]}
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-[#23482f] border-2 border-[#102216] flex items-center justify-center text-xs text-white font-bold">+2</div>
                </div>
            </div>

            {/* Board Columns */}
            <div className="flex gap-6 h-full overflow-hidden">
                {/* Column 1: A Fazer */}
                <div className="flex-1 bg-[#162E20]/30 rounded-xl border border-white/5 p-3 flex flex-col gap-3 min-w-[200px]">
                    <div className="flex justify-between items-center px-1 mb-1">
                        <span className="text-xs font-bold text-[#92c9a4] uppercase tracking-wider">A Fazer</span>
                        <div className="p-1 hover:bg-white/5 rounded cursor-pointer">
                            <Plus size={14} className="text-[#92c9a4]" />
                        </div>
                    </div>
                    {/* Card 1 */}
                    <div className="bg-[#183925] p-4 rounded-lg border border-white/5 shadow-sm hover:border-[#13ec5b]/50 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400">Design</span>
                        </div>
                        <p className="text-sm font-medium text-white mb-3">Definir paleta de cores 2026</p>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#23482f] flex items-center justify-center text-[8px] text-white">AN</div>
                        </div>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-[#183925] p-4 rounded-lg border border-white/5 shadow-sm hover:border-[#13ec5b]/50 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">Copy</span>
                        </div>
                        <p className="text-sm font-medium text-white mb-3">Escrever textos da Home</p>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#23482f] flex items-center justify-center text-[8px] text-white">MP</div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Em Andamento */}
                <div className="flex-1 bg-[#162E20]/30 rounded-xl border border-white/5 p-3 flex flex-col gap-3 min-w-[200px]">
                    <div className="flex justify-between items-center px-1 mb-1">
                        <span className="text-xs font-bold text-[#13ec5b] uppercase tracking-wider">Em Andamento</span>
                        <div className="p-1 hover:bg-white/5 rounded cursor-pointer">
                            <Plus size={14} className="text-[#92c9a4]" />
                        </div>
                    </div>
                    {/* Active Card */}
                    <div className="bg-[#183925] p-4 rounded-lg border-l-4 border-l-[#13ec5b] border-y border-r border-r-white/5 border-y-white/5 shadow-lg relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#13ec5b]/20 text-[#13ec5b]">Dev</span>
                            <div className="flex items-center gap-1.5 text-[#13ec5b] bg-[#13ec5b]/10 px-1.5 py-0.5 rounded animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#13ec5b]"></span>
                                <span className="text-[10px] font-bold">Rastreando</span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-white mb-3">Implementar Autenticação OAuth</p>
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#23482f] flex items-center justify-center text-[8px] text-white">ND</div>
                            </div>
                            <span className="text-xs font-mono text-[#92c9a4]">02:15:42</span>
                        </div>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-[#183925] p-4 rounded-lg border border-white/5 shadow-sm hover:border-[#13ec5b]/50 transition-all cursor-pointer opacity-75">
                        <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400">Reunião</span>
                        </div>
                        <p className="text-sm font-medium text-white mb-3">Daily Sync com Cliente</p>
                    </div>
                </div>

                {/* Column 3: Concluído */}
                <div className="flex-1 bg-[#162E20]/30 rounded-xl border border-white/5 p-3 flex flex-col gap-3 min-w-[200px]">
                    <div className="flex justify-between items-center px-1 mb-1">
                        <span className="text-xs font-bold text-[#92c9a4] uppercase tracking-wider">Concluído</span>
                        <div className="p-1 hover:bg-white/5 rounded cursor-pointer">
                            <Plus size={14} className="text-[#92c9a4]" />
                        </div>
                    </div>
                    {/* Card 4 */}
                    <div className="bg-[#183925] p-4 rounded-lg border border-white/5 shadow-sm opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <p className="text-sm font-medium text-white/50 line-through mb-2">Configurar Banco de Dados</p>
                        <div className="flex justify-end">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#13ec5b]/10 text-[#13ec5b] font-bold">Feito</span>
                        </div>
                    </div>
                    {/* Card 5 */}
                    <div className="bg-[#183925] p-4 rounded-lg border border-white/5 shadow-sm opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <p className="text-sm font-medium text-white/50 line-through mb-2">Setup Inicial do Repo</p>
                        <div className="flex justify-end">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#13ec5b]/10 text-[#13ec5b] font-bold">Feito</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
