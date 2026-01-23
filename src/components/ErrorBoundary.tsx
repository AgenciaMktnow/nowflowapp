import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Fallback Component specifically for the button hook
const ErrorFallbackAction = () => {
    return (
        <div className="flex gap-4 mt-6">
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary-light transition-colors"
            >
                Recarregar Página
            </button>
            <button
                onClick={() => {
                    window.location.href = '/dashboard';
                }}
                className="px-6 py-2 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
                Voltar ao Início
            </button>
        </div>
    );
};

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#121214] text-white p-6">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-red-500">
                                error_outline
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
                        <p className="text-text-subtle mb-8">
                            O sistema encontrou um erro inesperado ao tentar exibir esta tela.
                        </p>

                        <div className="bg-black/30 p-4 rounded-lg text-left mb-6 overflow-hidden">
                            <p className="font-mono text-xs text-red-300 break-words">
                                {this.state.error?.message || 'Unknown Error'}
                            </p>
                        </div>

                        <ErrorFallbackAction />
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
