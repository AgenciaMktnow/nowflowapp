import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { toast } from 'sonner';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Preencha título e mensagem');
            return;
        }

        if (!confirm('ATENÇÃO: Isso enviará uma notificação para TODOS os usuários online agora. Confirmar?')) {
            return;
        }

        setLoading(true);
        const { error } = await adminService.sendBroadcast(title, message, type);
        setLoading(false);

        if (error) {
            toast.error('Erro ao enviar broadcast');
        } else {
            toast.success('Broadcast enviado com sucesso!');
            setTitle('');
            setMessage('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">campaign</span>
                        Enviar Broadcast
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-subtle mb-1.5">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Manutenção Programada"
                            className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-text-subtle mb-1.5">Mensagem</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Digite a mensagem que aparecerá para todos..."
                            className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all font-medium resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-text-subtle mb-1.5">Tipo de Alerta</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['info', 'success', 'warning', 'error'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all
                                        ${type === t
                                            ? t === 'info' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : t === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                    : t === 'warning' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                                                        : 'bg-red-500/20 border-red-500/50 text-red-400'
                                            : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-text-muted hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Enviando...' : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                                Enviar para Todos
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
