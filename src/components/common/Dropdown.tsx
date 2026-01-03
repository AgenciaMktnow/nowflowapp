import { useState, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface DropdownOption {
    value: string;
    label: string;
    icon?: string;
}

interface DropdownProps {
    /** Current selected value */
    value: string;
    /** Array of options */
    options: DropdownOption[];
    /** Callback when option is selected */
    onChange: (value: string) => void;
    /** Optional placeholder text */
    placeholder?: string;
    /** Optional minimum width (default: 200px) */
    minWidth?: string;
    /** Optional alignment for dropdown menu (default: left) */
    align?: 'left' | 'right';
    /** Optional custom className for button */
    className?: string;
    /** Optional disabled state */
    disabled?: boolean;
}

/**
 * NowFlow Standard Dropdown Component
 * 
 * Features:
 * - Click-outside detection (auto-close)
 * - Dark/Neon styling with green glow when active
 * - Shadow-2xl for depth
 * - Checkmark on selected option
 * - Smooth animations
 */
export default function Dropdown({
    value,
    options,
    onChange,
    placeholder = 'Selecione...',
    minWidth = '200px',
    align = 'left',
    className = '',
    disabled = false
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click-outside detection
    useClickOutside(dropdownRef, () => setIsOpen(false));

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption?.label || placeholder;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`bg-surface-dark border text-white text-sm font-medium rounded-lg px-4 py-2 cursor-pointer transition-all focus:outline-none flex items-center gap-2 justify-between ${isOpen
                    ? 'border-primary ring-2 ring-primary/50 shadow-[0_0_20px_rgba(19,236,91,0.3)]'
                    : 'border-white/10 hover:border-primary/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
                style={{ minWidth }}
            >
                <span className="flex items-center gap-2">
                    {selectedOption?.icon && (
                        <span className="material-symbols-outlined text-sm">{selectedOption.icon}</span>
                    )}
                    {displayText}
                </span>
                <span
                    className={`material-symbols-outlined text-sm transition-all ${isOpen ? 'rotate-180 text-primary' : 'text-text-muted'
                        }`}
                >
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute top-full mt-2 bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-scale-in ${align === 'right' ? 'right-0' : 'left-0'
                        }`}
                    style={{ minWidth }}
                >
                    <div className="p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between gap-2"
                            >
                                <span className="flex items-center gap-2">
                                    {option.icon && (
                                        <span className="material-symbols-outlined text-sm">{option.icon}</span>
                                    )}
                                    {option.label}
                                </span>
                                {value === option.value && (
                                    <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
