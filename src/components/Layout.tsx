import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden print:h-auto print:overflow-visible">
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
                <span className="font-bold text-lg tracking-tight">NowFlow</span>
                <div className="w-8"></div> {/* Spacer for centering */}
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

            <main className="flex-1 flex flex-col h-full overflow-hidden relative print:overflow-visible print:h-auto md:pt-0 pt-16">
                <Outlet />
            </main>
        </div>
    );
}
