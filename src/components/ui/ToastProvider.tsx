import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
                style: {
                    background: '#1a1d21',
                    border: '1px solid #23482f',
                    color: '#fff',
                },
                classNames: {
                    success: 'border-primary/50 text-primary',
                    error: 'border-red-500/50 text-red-500',
                    info: 'border-blue-500/50 text-blue-500',
                    warning: 'border-yellow-500/50 text-yellow-500',
                }
            }}
        />
    );
}
