import { useNavigate } from 'react-router-dom';
import { type Notification } from '../../../services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationDropdownProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    loading: boolean;
}

export default function NotificationDropdown({
    notifications,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead,
    loading
}: NotificationDropdownProps) {
    const navigate = useNavigate();

    const handleClick = (notification: Notification) => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
        if (notification.task) {
            navigate(`/tasks/${notification.task.task_number}`);
            onClose();
        } else if (notification.task_id) {
            // Fallback for verification/legacy
            navigate(`/tasks/${notification.task_id}`);
            onClose();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ASSIGNMENT': return 'assignment_ind';
            case 'MOVEMENT': return 'arrow_forward';
            case 'COMMENT': return 'chat_bubble';
            case 'MENTION': return 'alternate_email';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'ASSIGNMENT': return 'text-blue-400 bg-blue-400/10';
            case 'MOVEMENT': return 'text-purple-400 bg-purple-400/10';
            case 'COMMENT': return 'text-yellow-400 bg-yellow-400/10';
            case 'MENTION': return 'text-orange-400 bg-orange-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[#162e21] border border-[#23482f] rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Notificações</h3>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-xs text-primary hover:underline hover:text-primary/80"
                    >
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-xs animate-pulse">Carregando...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center gap-2 text-gray-500">
                        <span className="material-symbols-outlined text-[32px] opacity-50">notifications_off</span>
                        <p className="text-xs">Nenhuma notificação recente.</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <button
                            key={notification.id}
                            onClick={() => handleClick(notification)}
                            className={`w-full text-left p-3 rounded-lg flex gap-3 transition-colors group relative ${notification.is_read ? 'hover:bg-white/5 opacity-70 hover:opacity-100' : 'bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(notification.type)}`}>
                                <span className="material-symbols-outlined text-[16px]">{getIcon(notification.type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <p className={`text-sm truncate pr-4 ${notification.is_read ? 'text-gray-300' : 'text-white font-semibold'}`}>
                                        {notification.title}
                                    </p>
                                    {!notification.is_read && (
                                        <span className="size-2 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse"></span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-0.5">
                                    {notification.message}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/5 bg-black/20 rounded-b-xl text-center">
                {/* Could link to a full notifications page here if existed */}
                <span className="text-[10px] text-gray-600 block py-1">NowFlow Notifications System</span>
            </div>
        </div>
    );
}
