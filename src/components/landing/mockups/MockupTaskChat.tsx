import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

export function MockupTaskChat() {
    const [messages, setMessages] = useState<Array<{ id: number, text: string, sender: 'me' | 'them', time: string }>>([
        { id: 1, text: 'O layout final foi aprovado?', sender: 'them', time: '10:42' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const hasAutoReplied = useRef(false);

    useEffect(() => {
        // Simple simulation loop
        const timer1 = setTimeout(() => {
            if (!hasAutoReplied.current) {
                setIsTyping(true);
            }
        }, 1500);

        const timer2 = setTimeout(() => {
            if (!hasAutoReplied.current) {
                setIsTyping(false);
                setMessages(prev => [...prev, { id: 2, text: 'Sim! Acabei de subir os arquivos finais na tarefa. 🚀', sender: 'me', time: '10:43' }]);
                hasAutoReplied.current = true;
            }
        }, 3500);

        // Reset for loop effect
        const resetTimer = setTimeout(() => {
            setMessages([{ id: 1, text: 'O layout final foi aprovado?', sender: 'them', time: '10:42' }]);
            hasAutoReplied.current = false;
        }, 8000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(resetTimer);
        };
    }, [messages]); // Re-run when messages change isn't strictly necessary for this logic but effectively keeps the loop alive if we depended on it, but here timeouts do formatting. Actually, let's fix the dependency or logic.
    // Better logic: use a recursive timeout or just dependency on length.

    // Simplification for the demo: Just run once on mount, then reset.

    return (
        <div className="w-full bg-[#102216] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[320px]">
            {/* Header */}
            <div className="h-10 border-b border-white/5 px-4 flex items-center justify-between bg-[#102216]">
                <span className="text-xs font-bold text-[#92c9a4] uppercase">Chat da Tarefa #2024</span>
                <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white">JD</div>
                    <div className="w-5 h-5 rounded-full bg-[#13ec5b] flex items-center justify-center text-[8px] text-[#102216]">EU</div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gradient-to-b from-[#183925]/30 to-[#102216]">
                <div className="text-center text-[10px] text-[#92c9a4]/30 my-2">Hoje</div>

                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'me'
                            ? 'bg-[#13ec5b] text-[#102216] rounded-br-none'
                            : 'bg-white/10 text-white rounded-bl-none'
                            } animate-fade-in-up shadow-sm`}>
                            {msg.text}
                            <span className={`block text-[9px] mt-1 opacity-60 ${msg.sender === 'me' ? 'text-black' : 'text-gray-400'} text-right`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-[#92c9a4]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-[#92c9a4]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-[#92c9a4]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#102216] border-t border-white/5 flex gap-2">
                <button className="text-[#92c9a4] hover:text-white p-2">
                    <Paperclip size={18} />
                </button>
                <div className="flex-1 bg-white/5 rounded-full h-9 px-4 flex items-center text-sm text-[#92c9a4] cursor-not-allowed select-none">
                    Digite uma mensagem...
                </div>
                <button className="w-9 h-9 rounded-full bg-[#13ec5b]/20 text-[#13ec5b] flex items-center justify-center">
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};
