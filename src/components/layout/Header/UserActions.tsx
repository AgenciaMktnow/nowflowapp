import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

export default function UserActions() {
    const { user, userProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // Notifications Hook
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll
    } = useNotifications();

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
                <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative size-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all ${isNotificationsOpen ? 'bg-white/10 text-white' : ''}`}
                >
                    <span className="material-symbols-outlined text-[22px]">
                        {unreadCount > 0 ? 'notifications_active' : 'notifications'}
                    </span>
                    {/* Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex size-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-3 bg-red-500 border-2 border-background-dark"></span>
                        </span>
                    )}
                </button>

                {isNotificationsOpen && (
                    <NotificationDropdown
                        notifications={notifications}
                        loading={loading}
                        onClose={() => setIsNotificationsOpen(false)}
                        onMarkAsRead={markAsRead}
                        onMarkAllAsRead={markAllAsRead}
                        onClearAll={clearAll}
                    />
                )}
            </div>

            {/* Settings */}
            <button
                onClick={() => navigate('/settings')}
                className="size-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title="Configurações"
            >
                <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>

            {/* Divider */}
            <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center gap-2 hover:bg-white/10 p-1.5 rounded-full pr-3 transition-colors border border-transparent ${isProfileOpen ? 'bg-white/10' : ''}`}
                >
                    {user?.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="size-8 rounded-full object-cover ring-2 ring-primary/20"
                        />
                    ) : (
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-primary/20">
                            {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <span className="text-sm font-medium text-white hidden lg:block max-w-[100px] truncate">
                        {userProfile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}
                    </span>
                    <span className={`material-symbols-outlined text-gray-400 text-[18px] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#162e21] border border-[#23482f] rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                        <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || 'Usuário'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            Meu Perfil
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sair
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
