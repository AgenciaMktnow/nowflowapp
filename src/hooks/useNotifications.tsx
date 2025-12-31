import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, type Notification } from '../services/notification.service';
import { toast } from 'sonner';

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Audio ref for sound alert
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio (using a simple base64 sound or external URL)
        // Using a short "pop" sound
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.volume = 0.5;

        if (user) {
            loadNotifications();

            // Subscribe to Realtime changes
            const subscription = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to INSERT (new) and UPDATE (grouping)
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        handleRealtimeEvent(payload);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await notificationService.getNotifications(user.id);
        const count = await notificationService.getUnreadCount(user.id);

        if (data) setNotifications(data);
        setUnreadCount(count);
        setLoading(false);
    };

    const handleRealtimeEvent = (payload: any) => {
        // Logic to update state without full reload if possible, but simpler to reload or prepend
        const newEvent = payload.new as Notification;
        // const oldEvent = payload.old as Notification;

        // Play sound if it's a new unread notification or an update to an unread one (grouping)
        if (newEvent && !newEvent.is_read) {
            playSound();
            toast(newEvent.title, {
                description: newEvent.message,
                position: 'top-right',
                duration: 4000
            });
        }

        // Optimistic update
        if (payload.eventType === 'INSERT') {
            setNotifications(prev => [newEvent, ...prev]);
            setUnreadCount(prev => prev + 1);
        } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === newEvent.id ? newEvent : n));
            // Count might not change if it was already unread, but if it changed from read to unread (unlikely in this logic)
        }
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed (interaction required first)', e));
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await notificationService.markAsRead(id);
    };

    const markAllAsRead = async () => {
        if (!user) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        await notificationService.markAllAsRead(user.id);
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: loadNotifications
    };
}
