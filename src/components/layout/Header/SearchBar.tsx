import { useState, useEffect } from 'react';

interface SearchBarProps {
    onSearch: (value: string) => void;
    placeholder?: string;
    initialValue?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Buscar...', initialValue = '' }: SearchBarProps) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(value);
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [value, onSearch]);

    return (
        <div className="hidden md:flex w-80 h-10 items-center bg-surface-highlight rounded-xl px-4 focus-within:ring-2 focus-within:ring-primary/50 transition-all border border-transparent focus-within:border-primary/50">
            <span className="material-symbols-outlined text-text-secondary text-[20px]">search</span>
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-transparent border-none text-white placeholder-text-secondary focus:ring-0 ml-2 text-sm h-full focus:outline-none"
                placeholder={placeholder}
                type="text"
            />
        </div>
    );
}
