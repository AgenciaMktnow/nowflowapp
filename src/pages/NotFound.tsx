
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export default function NotFound() {
    const navigate = useNavigate();
    const { settings } = useSettings();

    return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects (Subtle Neon Glow) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-4">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-24 shadow-[0_0_20px_rgba(34,197,94,0.4)] border border-white/5" style={{ backgroundImage: `url("${settings.logo_dark_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB24_ZfT5X-sHKLttEZrmZar0qRv82CJJoVclokr6vYhy6KXda1MQvRK_M0kB-K1AEEG17vCBCtSpAJXsA0EYTmAc7f7m7WVDTna75o4axavHe6391KJuJtRMdSSRJq-4da07WvwAqgB0Vbw-D11RJtPUgGBHO4Kj5lJGYHmOvIbZoGGSDqdjccux4psjAaYN0fHpWj5EPA6JCFFV2OqxROgun0VeDZs51SsX1v9AQvu5ZV4iSd6mPil7PWjacPo8rZp6Zl1CDKHd8'}")` }}></div>
                    <h2 className="text-white text-3xl font-bold tracking-tight mt-2">{settings.company_name || 'NowFlow'}</h2>
                </div>

                {/* 404 Text */}
                <h1 className="text-[150px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/20 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)] select-none">
                    404
                </h1>

                {/* Message */}
                <p className="text-white/80 text-xl font-medium mt-4 mb-2">
                    Ops! Parece que essa página se perdeu no fluxo.
                </p>
                <p className="text-text-muted text-sm mb-12">
                    O link que você tentou acessar não existe ou foi movido.
                </p>

                {/* Action Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="group relative px-8 py-4 bg-primary hover:bg-primary-dark text-background-dark font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-3"
                >
                    <span className="material-symbols-outlined">dataset</span>
                    Voltar para Dashboard
                </button>
            </div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 text-text-muted text-xs opacity-40">
                NowFlow &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
