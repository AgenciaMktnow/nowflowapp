import React, { useEffect } from 'react';
import type { TaskLog } from './DailyTimeline';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: TaskLog | null;
}

export default function TaskModal({ isOpen, onClose, task }: TaskModalProps) {
    // Evita o scroll do fundo quando o modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Bloqueia o scroll ao abrir o modal
            console.log("1");
        } else {
            document.body.style.overflow = ''; // Restaura o scroll ao fechar o modal
            console.log("2");
        }

        return () => {
            document.body.style.overflow = ''; // Restaura o scroll quando o componente for desmontado

        };
    }, [isOpen]); // Reage apenas quando o estado `isOpen` mudar

    if (!isOpen || !task) return null;

    // Fechar o modal ao clicar no fundo
    const handleBackdropClick = (e: React.MouseEvent) => {
        // Só fecha o modal se o clique for fora do conteúdo
        if (e.target === e.currentTarget) {
            onClose();
            console.log("4");
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={handleBackdropClick} // Fecha ao clicar fora do modal
        >
            <div
                className="bg-gradient-to-tl from-gray-800 via-gray-900 to-black rounded-md shadow-xl max-w-md w-full p-8 relative transform transition duration-300 ease-out scale-100 opacity-100"
                onClick={e => e.stopPropagation()} // Impede fechar ao clicar dentro do modal
                style={{ animation: 'fadeInScale 0.3s ease forwards' }}
            >
                {/* Botão de fechar */}
                <button
                    onClick={onClose}
                    aria-label="Fechar modal"
                    className="absolute cursor-pointer z-[9999] top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none transform hover:scale-110"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Título */}
                <h2
                    id="modal-title"
                    className="text-2xl font-semibold text-white mb-6 break-words"
                    style={{ wordBreak: 'break-word' }}
                >
                    {task.task?.title}
                </h2>

                {/* Informações com ícones */}
                <div className="space-y-4 text-gray-300 text-sm">
                    <InfoRow
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7M16 3v4M8 3v4m-5 4h18"
                                />
                            </svg>
                        }
                        label="Cliente"
                        value={task.task?.client?.name || '-'}
                    />

                    <InfoRow
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.38 0-2.5 1.12-2.5 2.5S10.62 13 12 13s2.5-1.12 2.5-2.5S13.38 8 12 8z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v4a8 8 0 0016 0v-4" />
                            </svg>
                        }
                        label="Projeto"
                        value={task.task?.project?.name || '-'}
                    />

                    <InfoRow
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.121 17.804z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                        label="Usuário"
                        value={task.user?.full_name}
                    />

                    <InfoRow
                        icon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                        }
                        label="Horário"
                        value={`${new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${task.end_time
                            ? new Date(task.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Agora'
                            }`}
                    />
                </div>
            </div>

            {/* Animação fadeInScale */}
            <style>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
}

// Componente auxiliar para linha de info com ícone
interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string | undefined;
}
function InfoRow({ icon, label, value }: InfoRowProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-gray-400 text-xs uppercase font-semibold tracking-wide">{label}</p>
                <p className="text-white truncate max-w-xs">{value || '-'}</p>
            </div>
        </div>
    );
}