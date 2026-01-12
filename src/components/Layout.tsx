import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
// import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import AutoPauseAlert from './modals/AutoPauseAlert';

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { userProfile } = useAuth();

    // God Mode Detection
    const impersonatedOrgId = localStorage.getItem('impersonate_org_id');
    const impersonatedOrgName = localStorage.getItem('impersonate_org_name');
    const isSuperAdmin = ['neto@mktnow.com.br', 'duqueneto@gmail.com', 'duqueneto@gmail.com.br'].includes(userProfile?.email || '');
    const isImpersonating = impersonatedOrgId && isSuperAdmin;

    const handleExitGodMode = () => {
        localStorage.removeItem('impersonate_org_id');
        localStorage.removeItem('impersonate_org_name');
        window.location.href = '/admin/saas';
    };

    return (
        <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden print:h-auto print:overflow-visible">
            {/* Auto Pause Alert Overlay */}
            <AutoPauseAlert />

            {/* God Mode Banner */}
            {isImpersonating && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-b border-amber-500/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between px-6 py-2.5">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-400 text-xl animate-pulse">visibility</span>
                            <span className="text-sm font-bold text-amber-100">
                                🕵️‍♂️ GOD MODE: Visualizando conta <span className="text-amber-300">{impersonatedOrgName || 'Desconhecida'}</span>
                            </span>
                        </div>
                        <button
                            onClick={handleExitGodMode}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 rounded-lg border border-amber-500/30 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            Sair
                        </button>
                    </div>
                </div>
            )}
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block print:hidden h-full flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background-dark border-b border-border-dark flex items-center justify-between px-4 z-50">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-[#00FF66] hover:bg-white/5 rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined text-3xl">menu</span>
                </button>
                <div
                    className="flex-1 flex justify-center cursor-pointer"
                    onClick={() => window.location.href = '/dashboard'}
                >
                    <img
                        src="/Logo-nowflow-banco.png"
                        alt="Logo"
                        className="max-h-8 w-auto object-contain"
                    />
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="relative w-[80vw] max-w-[300px] h-full bg-background-dark border-r border-border-dark shadow-2xl animate-in slide-in-from-left duration-200">
                        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <main className={`flex-1 flex flex-col h-full overflow-y-auto relative print:overflow-visible print:h-auto md:pt-0 pt-16 pb-32 md:pb-0 ${isImpersonating ? 'md:pt-12' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
