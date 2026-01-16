import { memo } from 'react';

interface UserAvatarProps {
    user?: {
        full_name?: string;
        avatar_url?: string | null;
        email?: string;
    } | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number; // 'xs': 20px, 'sm': 24px, 'md': 32px, 'lg': 40px, 'xl': 64px
    showBorder?: boolean;
    className?: string; // Additional classes
}

const UserAvatar = ({ user, size = 'sm', showBorder = false, className = '' }: UserAvatarProps) => {
    // 1. Determine dimensions
    let sizeClasses = 'w-6 h-6 text-[10px]'; // Default 'sm'

    if (typeof size === 'number') {
        // Custom pixel size handled via style, but we need base classes for text
        sizeClasses = 'text-[10px]';
    } else {
        switch (size) {
            case 'xs': sizeClasses = 'w-5 h-5 text-[8px]'; break;
            case 'sm': sizeClasses = 'w-6 h-6 text-[10px]'; break;
            case 'md': sizeClasses = 'w-8 h-8 text-xs'; break;
            case 'lg': sizeClasses = 'w-10 h-10 text-sm'; break;
            case 'xl': sizeClasses = 'w-16 h-16 text-lg'; break;
        }
    }

    const style = typeof size === 'number' ? { width: size, height: size } : {};

    // 2. Safely get user data
    const fullName = user?.full_name || user?.email || '?';
    const avatarUrl = user?.avatar_url;

    // Initials
    const initials = fullName !== '?'
        ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    // 3. Render
    return (
        <div
            className={`
                relative rounded-full flex items-center justify-center overflow-hidden shrink-0 select-none
                ${showBorder ? 'border border-[#333]' : ''}
                ${!avatarUrl ? 'bg-surface-border text-text-muted font-bold' : ''}
                ${sizeClasses}
                ${className}
            `}
            style={style}
            title={fullName}
        >
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback on error (broken link)
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-surface-border', 'text-text-muted', 'font-bold');
                        const span = document.createElement('span');
                        span.innerText = initials;
                        e.currentTarget.parentElement?.appendChild(span);
                    }}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};

export default memo(UserAvatar);
