import { useState, useRef, useEffect } from 'react';

interface NewTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    initialData?: { name: string } | null;
}

export default function NewTeamModal({ isOpen, onClose, onAdd, initialData }: NewTeamModalProps) {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
            } else {
                setName('');
            }
            // Small timeout to ensure modal is rendered before focusing
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onAdd(name);
        // Do not clear name here immediately if we are editing, 
        // but typically the parent will close the modal which unmounts or re-renders.
        // For add mode, clearing is good.
        if (!initialData) {
            setName('');
        }
        // Removed onClose() here so parent can handle success/error
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl border border-border-green/50 bg-[#162E20]/90 backdrop-blur-md p-8 shadow-2xl transition-all shadow-black/50">

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white font-display">
                        {initialData ? 'Editar Equipe' : 'Nova Equipe'}
                    </h3>
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
                            htmlFor="team-name"
                        >
                            Nome da Equipe
                        </label>
                        <input
                            ref={inputRef}
                            id="team-name"
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Marketing, Desenvolvimento..."
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
                            disabled={!name.trim()}
                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-background-dark shadow-neon hover:shadow-[0_0_20px_rgba(19,236,91,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-display"
                        >
                            {initialData ? 'Salvar' : 'Criar Equipe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
