import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();

    const menuItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'analytics', label: 'Portfólio', path: '/portfolio' },
        { icon: 'view_kanban', label: 'Kanban', path: '/kanban' },
        { icon: 'calendar_month', label: 'Calendário', path: '/calendar' },
        { icon: 'groups', label: 'Equipes', path: '/teams' },
        { icon: 'add_task', label: 'Nova Tarefa', path: '/tasks/new' },
        { icon: 'schedule', label: 'Time Tracking', path: '/time-tracking' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border-dark bg-background-dark transition-colors duration-300 print:hidden h-full">
            <div className="flex flex-col p-4 gap-6">
                {/* Logo */}
                <div className="flex gap-3 items-center px-2">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 shadow-lg border border-white/5" style={{ backgroundImage: `url("${settings.logo_dark_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB24_ZfT5X-sHKLttEZrmZar0qRv82CJJoVclokr6vYhy6KXda1MQvRK_M0kB-K1AEEG17vCBCtSpAJXsA0EYTmAc7f7m7WVDTna75o4axavHe6391KJuJtRMdSSRJq-4da07WvwAqgB0Vbw-D11RJtPUgGBHO4Kj5lJGYHmOvIbZoGGSDqdjccux4psjAaYN0fHpWj5EPA6JCFFV2OqxROgun0VeDZs51SsX1v9AQvu5ZV4iSd6mPil7PWjacPo8rZp6Zl1CDKHd8'}")` }}></div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold leading-normal tracking-wide truncate max-w-[160px]">{settings.company_name || 'NowFlow'}</h1>
                        <p className="text-text-muted-dark text-xs font-normal">Gerenciamento Pro</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (onMobileClose) onMobileClose();
                            }}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive(item.path)
                                ? 'bg-surface-dark shadow-sm'
                                : 'hover:bg-surface-dark hover:shadow-sm'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive(item.path)
                                ? 'text-primary'
                                : 'text-text-muted-dark group-hover:text-white'
                                }`}>
                                {item.icon}
                            </span>
                            <span className={`text-sm tracking-wide ${isActive(item.path)
                                ? 'text-white font-bold'
                                : 'text-text-muted-dark font-medium group-hover:text-white'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
