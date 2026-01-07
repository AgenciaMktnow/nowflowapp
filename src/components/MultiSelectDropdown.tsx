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



    return (
        <div className={`space-y-1 ${className}`} ref={dropdownRef}>
            {label && <label className="text-xs font-medium text-text-muted">{label}</label>}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 bg-[#112217] border border-[#326744] hover:bg-[#162e21] rounded-lg text-sm transition-colors w-full text-left h-[38px] ${isOpen ? 'ring-1 ring-primary border-primary' : ''}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {icon && <span className="material-symbols-outlined text-[#92c9a4] text-[18px]">{icon}</span>}
                        <span className={`truncate ${selectedValues.length > 0 ? 'text-white' : 'text-[#92c9a4]'}`}>
                            {selectedValues.length === 0
                                ? placeholder
                                : (selectedValues.length === 1
                                    ? selectedOptions[0]?.name
                                    : `${selectedValues.length} selecionados`
                                )
                            }
                        </span>
                    </div>
                    <span className={`material-symbols-outlined text-[#92c9a4] text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
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
