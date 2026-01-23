import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();
    // const { settings } = useSettings(); // Removed as per static asset refactor
    const { isSuperAdmin } = useAuth(); // Get super admin status

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
        { icon: 'view_kanban', label: 'Kanban', path: '/kanban' },
        { icon: 'calendar_month', label: 'Calendário', path: '/calendar' },
        { icon: 'add_task', label: 'Nova Tarefa', path: '/tasks/new' },
        { icon: 'schedule', label: 'Time Tracking', path: '/time-tracking' },
        { icon: 'help', label: 'Ajuda', path: '/help' },
    ];

    if (isSuperAdmin) {
        menuItems.push({ icon: 'admin_panel_settings', label: 'SaaS Console', path: '/admin/saas' });
    }

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

            <div className={`flex flex-col gap-6 p-4 ${isCollapsed ? 'items-center px-2' : ''}`}>
                {/* Header Container */}
                <div className="flex flex-col gap-1 w-full relative group/header">

                    {/* Top Row: Logo + Title + Toggle */}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>

                        {/* Logo + Title Group - Wrapped in Dashboard Link */}
                        <div
                            onClick={() => navigate('/dashboard')}
                            className={`flex items-center gap-3 p-1 cursor-pointer hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {/* Logo Icon */}
                            <div className="flex items-center justify-center shrink-0">
                                <img
                                    src={isCollapsed ? '/3_PNG_Isotipo_Fundo_Claro.png' : '/Logo-nowflow-banco.png'}
                                    alt="Logo"
                                    className={`transition-all duration-300 object-contain ${isCollapsed ? 'h-8 w-8' : 'max-h-10 w-auto'}`}
                                />
                            </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={toggleSidebar}
                            className={`
                                text-text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-white/5
                                ${isCollapsed ? '' : ''}
                            `}
                            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                                menu_open
                            </span>
                        </button>
                    </div>

                    {/* Subtitle - New Line */}
                    <p className={`text-text-muted-dark text-xs font-normal transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100 mt-1'}`}>
                        Produtividade em sincronia
                    </p>
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
