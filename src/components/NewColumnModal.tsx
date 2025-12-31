import { useState, useRef, useEffect } from 'react';

interface NewColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (title: string, color: string) => void;
}

export default function NewColumnModal({ isOpen, onClose, onAdd }: NewColumnModalProps) {
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const colors = [
            'bg-blue-500/20 text-blue-300',
            'bg-green-500/20 text-green-300',
            'bg-purple-500/20 text-purple-300',
            'bg-yellow-500/20 text-yellow-300',
            'bg-red-500/20 text-red-300',
            'bg-orange-500/20 text-orange-300',
            'bg-pink-500/20 text-pink-300',
            'bg-teal-500/20 text-teal-300'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        onAdd(title, randomColor);
        setTitle('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl border border-border-green/50 bg-[#162E20]/90 backdrop-blur-md p-8 shadow-2xl transition-all shadow-black/50">

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white font-display">Nova Coluna</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-text-subtle hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-8">
                        <label
                            className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-2"
                            htmlFor="column-name"
                        >
                            Nome da Coluna
                        </label>
                        <input
                            ref={inputRef}
                            id="column-name"
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Em Teste, Deploy, Backlog..."
                            className="w-full rounded-xl border border-border-green bg-background-dark px-4 py-3 text-white placeholder-text-subtle/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-text-subtle hover:text-white transition-colors rounded-xl hover:bg-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-background-dark shadow-neon hover:shadow-[0_0_20px_rgba(19,236,91,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-display"
                        >
                            Adicionar Coluna
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
