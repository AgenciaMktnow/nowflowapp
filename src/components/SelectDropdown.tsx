import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    label: string;
    value: string;
}

interface SelectDropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    icon?: string;
    placeholder?: string;
    className?: string; // e.g. min-w-[180px]
}

export default function SelectDropdown({ options, value, onChange, icon, placeholder, className }: SelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Update position when open
    useEffect(() => {
        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true); // Capture scroll on any parent
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
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
        <div className={`relative ${className || ''}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 px-3 py-2 bg-[#112217] border border-[#326744] hover:bg-[#162e21] rounded-lg text-sm transition-colors w-full ${isOpen ? 'ring-1 ring-primary border-primary' : ''}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {icon && <span className="material-symbols-outlined text-[#92c9a4] text-[18px]">{icon}</span>}
                    <span className={`truncate ${selectedOption ? 'text-white' : 'text-[#92c9a4]'}`}>
                        {selectedOption ? selectedOption.label : placeholder || 'Selecione'}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-[#92c9a4] text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        minWidth: typeof className?.match(/min-w-\[(.*?)\]/)?.[1] || '200px', // Try to respect prop or default
                        width: coords.width > 200 ? coords.width : undefined // Match width if larger than default
                    }}
                    className="fixed bg-[#1c3829] border border-[#326744] rounded-lg shadow-2xl z-[9999] overflow-hidden animate-scale-in py-1"
                >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${value === option.value
                                    ? 'bg-[#23482f] text-primary font-medium'
                                    : 'text-[#92c9a4] hover:text-white hover:bg-[#23482f]'
                                    }`}
                            >
                                {option.label}
                                {value === option.value && (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
