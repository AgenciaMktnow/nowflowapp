import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();

    // Initialize from localStorage or default to false (expanded)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    const menuItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'checklist', label: 'Minha Fila', path: '/queue' },
        { icon: 'analytics', label: 'Portfólio', path: '/portfolio' },
        { icon: 'view_kanban', label: 'Kanban', path: '/kanban' },
        { icon: 'calendar_month', label: 'Calendário', path: '/calendar' },
        { icon: 'groups', label: 'Equipes', path: '/teams' },
        { icon: 'add_task', label: 'Nova Tarefa', path: '/tasks/new' },
        { icon: 'schedule', label: 'Time Tracking', path: '/time-tracking' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside
            className={`
                flex-shrink-0 flex flex-col border-r border-border-dark bg-background-dark 
                transition-all duration-300 ease-in-out print:hidden h-full z-20 relative
                ${isCollapsed ? 'w-16' : 'w-64'}
            `}
        >
            {/* Toggle Button - Absolute positioned or in header? User asked for "button at top". 
                We'll place it in the header area, maybe absolute to right if expanded, or centered if collapsed?
                Let's try a dedicated toggle button row or integrated into logo row.
            */}

            <div className={`flex flex-col gap-6 p-4 ${isCollapsed ? 'px-2 items-center' : 'px-4'}`}>
                {/* Header: Logo + Toggle */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} min-h-[48px] relative group/header`}>

                    {/* Logo Section */}
                    <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                        {/* Logo Icon */}
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full shadow-lg border border-white/5 transition-all duration-300 shrink-0"
                            style={{
                                backgroundImage: `url("${settings.logo_dark_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB24_ZfT5X-sHKLttEZrmZar0qRv82CJJoVclokr6vYhy6KXda1MQvRK_M0kB-K1AEEG17vCBCtSpAJXsA0EYTmAc7f7m7WVDTna75o4axavHe6391KJuJtRMdSSRJq-4da07WvwAqgB0Vbw-D11RJtPUgGBHO4Kj5lJGYHmOvIbZoGGSDqdjccux4psjAaYN0fHpWj5EPA6JCFFV2OqxROgun0VeDZs51SsX1v9AQvu5ZV4iSd6mPil7PWjacPo8rZp6Zl1CDKHd8'}")`,
                                width: isCollapsed ? '32px' : '40px',
                                height: isCollapsed ? '32px' : '40px'
                            }}
                        ></div>

                        {/* Logo Text - Hidden when collapsed */}
                        <div className={`flex flex-col transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-[120px] opacity-100'}`}>
                            <h1 className="text-white text-base font-bold leading-normal tracking-wide truncate">{settings.company_name || 'NowFlow'}</h1>
                            <p className="text-text-muted-dark text-xs font-normal truncate">Produtividade em sincronia</p>
                        </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className={`
                            text-text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-white/5
                            ${isCollapsed ? 'mt-2' : ''}
                        `}
                        title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
                    >
                        <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                            menu_open
                        </span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 w-full">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (onMobileClose) onMobileClose();
                            }}
                            className={`
                                relative flex items-center transition-all group w-full
                                ${isCollapsed ? 'justify-center px-0 py-3 rounded-lg' : 'gap-3 px-3 py-3 rounded-xl'}
                                ${isActive(item.path)
                                    ? 'bg-surface-dark shadow-sm'
                                    : 'hover:bg-surface-dark hover:shadow-sm'
                                }
                            `}
                        >
                            <span className={`material-symbols-outlined text-[22px] transition-colors shrink-0 ${isActive(item.path)
                                ? 'text-primary'
                                : 'text-text-muted-dark group-hover:text-white'
                                }`}>
                                {item.icon}
                            </span>

                            {/* Label - Hidden in Collapsed */}
                            <span className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed
                                ? 'w-0 opacity-0 absolute' // Absolute to prevent width taking
                                : 'w-auto opacity-100 relative'
                                } ${isActive(item.path)
                                    ? 'text-white font-bold'
                                    : 'text-text-muted-dark font-medium group-hover:text-white'
                                }`}>
                                {item.label}
                            </span>

                            {/* Tooltip for Collapsed State */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0 transition-transform">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
