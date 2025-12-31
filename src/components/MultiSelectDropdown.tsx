import { useState, useRef, useEffect } from 'react';

export type DropdownOption = {
    id: string;
    name: string;
};

interface MultiSelectDropdownProps {
    options: DropdownOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    label?: string;
    icon?: string;
    className?: string;
}

export default function MultiSelectDropdown({
    options,
    selectedValues,
    onChange,
    placeholder = 'Selecione...',
    label,
    icon,
    className = ''
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOptions = options.filter(opt => selectedValues.includes(opt.id));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when opening
            const searchInput = dropdownRef.current?.querySelector('input');
            if (searchInput) setTimeout(() => searchInput.focus(), 50);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggleOption = (optionId: string) => {
        if (selectedValues.includes(optionId)) {
            onChange(selectedValues.filter(id => id !== optionId));
        } else {
            onChange([...selectedValues, optionId]);
        }
    };

    const removeOption = (e: React.MouseEvent, optionId: string) => {
        e.stopPropagation();
        onChange(selectedValues.filter(id => id !== optionId));
    };

    return (
        <div className={`space-y-1 ${className}`} ref={dropdownRef}>
            {label && <label className="text-xs font-medium text-text-muted">{label}</label>}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all h-auto min-h-[56px]
                        ${isOpen ? 'ring-2 ring-primary border-transparent bg-surface-dark' : 'bg-surface-dark border-gray-700 hover:border-gray-500 hover:text-white'}
                        ${selectedValues.length > 0 ? 'text-white' : 'text-gray-400'}
                    `}
                >
                    <div className="flex items-center gap-2 flex-1 overflow-hidden flex-wrap">
                        {icon && <span className="material-symbols-outlined text-[20px] text-gray-400">{icon}</span>}

                        {selectedValues.length === 0 ? (
                            <span className="truncate">{placeholder}</span>
                        ) : (
                            <div className="flex flex-wrap gap-2 w-full">
                                {selectedOptions.map((opt) => (
                                    <span key={opt.id} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded">
                                        {opt.name}
                                        <span
                                            onClick={(e) => removeOption(e, opt.id)}
                                            className="material-symbols-outlined text-[14px] cursor-pointer hover:text-red-400 transition-colors"
                                            title="Remover"
                                        >
                                            close
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`}>
                        expand_more
                    </span>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#162e21] border border-[#23482f] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[300px]">
                        <div className="p-2 border-b border-[#23482f]">
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 material-symbols-outlined text-[16px] text-text-muted">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full bg-[#23482f] border-none rounded-md pl-8 pr-2 py-1.5 text-xs text-white placeholder-text-muted focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar p-1 flex-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(option => {
                                    const isSelected = selectedValues.includes(option.id);
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleToggleOption(option.id)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group mb-0.5
                                                ${isSelected
                                                    ? 'bg-primary/20 text-white'
                                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                }
                                            `}
                                        >
                                            <span>{option.name}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-sm text-text-muted text-center flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-[24px] opacity-50">search_off</span>
                                    Nenhum resultado encontrado
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
