import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type DropdownOption = {
    id: string;
    name: string;
};

interface ModernDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: string;
    className?: string;
}

export default function ModernDropdown({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    icon,
    className = ''
}: ModernDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const updatePosition = () => {
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + 8, // Added 8px spacing
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 px-4 h-14 rounded-xl border hover:border-primary/50 text-sm font-medium transition-all appearance-none cursor-pointer
                    ${value
                        ? 'bg-transparent border-primary/50 text-text-main'
                        : 'bg-input-bg border-input-border text-text-secondary hover:text-text-main hover:border-text-secondary/50'
                    }
                    ${isOpen ? 'ring-2 ring-primary border-transparent' : ''}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
                    <span className={value ? 'text-text-main' : ''}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-text-secondary'}`}>
                    expand_more
                </span>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                    }}
                    className="fixed bg-surface-card border border-border-main rounded-xl shadow-xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {options.length > 0 ? (
                            options.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (value === option.id) {
                                            onChange('');
                                        } else {
                                            onChange(option.id);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between group
                                        ${value === option.id
                                            ? 'bg-primary/20 text-text-main font-bold'
                                            : 'text-text-secondary hover:bg-surface-highlight hover:text-text-main'
                                        }
                                    `}
                                >
                                    <span>{option.name}</span>
                                    {value === option.id && (
                                        <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                Nenhuma opção disponível
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
