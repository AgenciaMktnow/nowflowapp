import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';
import Fuse from 'fuse.js';

type SearchResult = {
    type: 'task' | 'action' | 'suggestion';
    id: string;
    taskNumber?: number;
    title: string;
    projectName?: string;
    clientName?: string;
    icon: string;
    action: () => void;
    matchIndices?: readonly [number, number][]; // For fuzzy highlighting
    isSuggestion?: boolean;
};

// Fuse.js configuration
const fuseOptions = {
    keys: ['title', 'projectName', 'clientName'],
    threshold: 0.3, // 30% tolerance for typos
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
};

export default function SearchBar() {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Click outside to close
    useClickOutside(searchRef, () => {
        setIsOpen(false);
        setSelectedIndex(-1);
    });

    // Cmd/Ctrl + K to focus search
    useKeyboardShortcut({
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        callback: () => {
            inputRef.current?.focus();
            if (!value.trim()) {
                fetchSuggestions().then(suggestions => {
                    setResults([...suggestions, ...getQuickActions()]);
                    setIsOpen(true);
                });
            }
        }
    });

    const getQuickActions = (): SearchResult[] => [
        {
            type: 'action',
            id: 'new-task',
            title: 'Nova Tarefa',
            icon: 'add_task',
            action: () => {
                navigate('/tasks/new');
                setIsOpen(false);
                setValue('');
            }
        },
        {
            type: 'action',
            id: 'my-queue',
            title: 'Minha Fila',
            icon: 'list',
            action: () => {
                navigate('/queue');
                setIsOpen(false);
                setValue('');
            }
        },
        {
            type: 'action',
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'dashboard',
            action: () => {
                navigate('/dashboard');
                setIsOpen(false);
                setValue('');
            }
        }
    ];

    const fetchSuggestions = async (): Promise<SearchResult[]> => {
        try {
            // Get 2 most recently updated tasks
            const { data: recentTasks } = await supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    task_number,
                    created_at,
                    project:projects(
                        name,
                        client:clients!projects_client_id_fkey(name)
                    ),
                    client:clients(name)
                `)
                .order('created_at', { ascending: false })
                .limit(3);
            console.log('SearchBar: Fetching suggestions (Limit 3)...');

            // Get top 2 active clients
            const { data: activeClients } = await supabase
                .from('clients')
                .select('id, name')
                .limit(5);

            const suggestions: SearchResult[] = [];

            recentTasks?.forEach(task => {
                const clientName = (task.client as any)?.name || (task.project as any)?.client?.name;
                const projectName = (task.project as any)?.name;

                suggestions.push({
                    type: 'suggestion',
                    id: task.id,
                    taskNumber: task.task_number,
                    title: task.title,
                    projectName,
                    clientName,
                    icon: 'schedule', // Icon implies recency
                    isSuggestion: true,
                    action: () => {
                        navigate(`/tasks/${task.task_number}`);
                        setIsOpen(false);
                        setValue('');
                    }
                });
            });

            activeClients?.forEach(client => {
                suggestions.push({
                    type: 'suggestion',
                    id: `client-${client.id}`,
                    title: `Ver tarefas de ${client.name}`,
                    clientName: client.name,
                    icon: 'business',
                    isSuggestion: true,
                    action: () => {
                        setValue(client.name);
                        // Trigger search for this client
                    }
                });
            });

            return suggestions;
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    };

    // Handle input focus for zero-state
    const handleFocus = () => {
        if (!value.trim()) {
            fetchSuggestions().then(suggestions => {
                setResults([...suggestions, ...getQuickActions()]);
                setIsOpen(true);
            });
        } else {
            setIsOpen(true);
        }
    };

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (value.trim()) {
                performGlobalSearch(value.trim());
            } else {
                fetchSuggestions().then(suggestions => {
                    setResults([...suggestions, ...getQuickActions()]);
                });
            }
        }, 300);

        // Update selectedIndex when results change to avoid keeping selection on gone item
        setSelectedIndex(-1);

        return () => clearTimeout(handler);
    }, [value]);

    const performGlobalSearch = async (searchTerm: string) => {
        setLoading(true);
        const quickActions = getQuickActions();
        const searchResults: SearchResult[] = [];

        try {
            const isNumeric = /^\d+$/.test(searchTerm);

            // Priority 1: Exact numeric match
            if (isNumeric) {
                const { data: exactTask } = await supabase
                    .from('tasks')
                    .select(`
                        id,
                        title,
                        task_number,
                        project:projects(
                            name,
                            client:clients!projects_client_id_fkey(name)
                        ),
                        client:clients(name)
                    `)
                    .eq('task_number', parseInt(searchTerm))
                    .single();

                if (exactTask) {
                    const clientName = (exactTask.client as any)?.name || (exactTask.project as any)?.client?.name;
                    const projectName = (exactTask.project as any)?.name;

                    searchResults.push({
                        type: 'task',
                        id: exactTask.id,
                        taskNumber: exactTask.task_number,
                        title: exactTask.title,
                        projectName,
                        clientName,
                        icon: 'task_alt',
                        action: () => {
                            navigate(`/tasks/${exactTask.task_number}`);
                            setIsOpen(false);
                            setValue('');
                        }
                    });
                }
            }

            // Priority 2: Fuzzy search (Limit 200 for cache)
            const { data: allTasks } = await supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    task_number,
                    project:projects(
                        name,
                        client:clients!projects_client_id_fkey(name)
                    ),
                    client:clients(name)
                `)
                .limit(200);

            if (allTasks && allTasks.length > 0) {
                const tasksForFuse = allTasks.map(task => ({
                    id: task.id,
                    taskNumber: task.task_number,
                    title: task.title,
                    projectName: (task.project as any)?.name || '',
                    clientName: (task.client as any)?.name || (task.project as any)?.client?.name || ''
                }));

                const fuse = new Fuse(tasksForFuse, fuseOptions);
                const fuseResults = fuse.search(searchTerm);

                fuseResults.slice(0, 10).forEach(result => {
                    // Avoid duplicates if exact match already found
                    if (searchResults.some(r => r.id === result.item.id)) return;

                    const task = result.item;
                    const matches = result.matches?.[0]?.indices as [number, number][];

                    searchResults.push({
                        type: 'task',
                        id: task.id,
                        taskNumber: task.taskNumber,
                        title: task.title,
                        projectName: task.projectName,
                        clientName: task.clientName,
                        icon: 'task_alt',
                        matchIndices: matches,
                        action: () => {
                            navigate(`/tasks/${task.taskNumber}`);
                            setIsOpen(false);
                            setValue('');
                        }
                    });
                });
            }

            setResults([...searchResults, ...quickActions]);
            setIsOpen(true);
        } catch (error) {
            console.error('Global search error:', error);
            setResults(quickActions);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Collect all navigable items (tasks + suggestions + actions)
        const allItems = [...groupedResults.tasks, ...groupedResults.suggestions, ...groupedResults.actions];

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < allItems.length) {
                    allItems[selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Highlight helper using indices
    const highlightSearchTerm = (text: string, searchTerm: string, matchIndices?: readonly [number, number][]) => {
        if (!text) return text;

        // Strategy A: Fuse.js indices (Fuzzy)
        if (matchIndices && matchIndices.length > 0) {
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;

            // Sort indices just in case
            const sortedIndices = [...matchIndices].sort((a, b) => a[0] - b[0]);

            sortedIndices.forEach(([start, end], i) => {
                if (start > lastIndex) {
                    parts.push(text.substring(lastIndex, start));
                }
                parts.push(
                    <span key={i} className="font-bold text-primary">
                        {text.substring(start, end + 1)}
                    </span>
                );
                lastIndex = end + 1;
            });

            if (lastIndex < text.length) {
                parts.push(text.substring(lastIndex));
            }
            return parts;
        }

        // Strategy B: Fallback Regex (Exact/Partial)
        if (!searchTerm.trim()) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) =>
            regex.test(part) ? <span key={index} className="font-bold text-primary">{part}</span> : part
        );
    };

    // Grouping for UI
    const groupedResults = {
        tasks: results.filter(r => r.type === 'task').sort((a, b) => {
            const val = value.trim().toLowerCase();
            const isNumeric = /^\d+$/.test(val);

            const isExact = (task: any) => {
                if (isNumeric) {
                    const exactId = task.taskNumber?.toString() === val;
                    const wordRegex = new RegExp(`\\b${val}\\b`, 'i');
                    const exactWord = wordRegex.test(task.title) ||
                        (task.projectName && wordRegex.test(task.projectName)) ||
                        (task.clientName && wordRegex.test(task.clientName));
                    return exactId || exactWord;
                }
                // For non-numeric searches, we don't apply strict "exactness" for sorting purposes here.
                // Fuse's ranking will handle the order, and all will be treated as "exact" for the UI split.
                return true;
            };

            const aExact = isExact(a);
            const bExact = isExact(b);

            if (aExact && !bExact) return -1; // a is exact, b is not -> a comes first
            if (!aExact && bExact) return 1;  // b is exact, a is not -> b comes first
            return 0; // Both are exact, both are not, or non-numeric search -> preserve original order (Fuse's ranking)
        }),
        suggestions: results.filter(r => r.type === 'suggestion'),
        actions: results.filter(r => r.type === 'action')
    };

    // Calculate global index offsets for keyboard navigation
    const getGlobalIndex = (section: 'task' | 'suggestion' | 'action', localIndex: number) => {
        if (section === 'task') return localIndex;
        if (section === 'suggestion') return groupedResults.tasks.length + localIndex;
        if (section === 'action') return groupedResults.tasks.length + groupedResults.suggestions.length + localIndex;
        return 0;
    };

    const shortcutHint = navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K';

    // Identify split point for UI rendering
    const exactMatches = groupedResults.tasks.filter(task => {
        const val = value.trim().toLowerCase();
        const isNumeric = /^\d+$/.test(val);
        if (isNumeric) {
            const exactId = task.taskNumber?.toString() === val;
            const wordRegex = new RegExp(`\\b${val}\\b`, 'i');
            const exactWord = wordRegex.test(task.title) ||
                (task.projectName && wordRegex.test(task.projectName)) ||
                (task.clientName && wordRegex.test(task.clientName));
            return exactId || exactWord;
        }
        return true; // Treat all text matches as "exact" enough to be in the main list unless we want strict text rules too.
    });

    const fuzzyMatches = groupedResults.tasks.filter(t => !exactMatches.includes(t));

    return (
        <div className="relative hidden md:block w-full max-w-[500px]" ref={searchRef}>
            {/* Search Input Container - Design System Token Match */}
            <div className={`flex h-11 items-center bg-surface-highlight rounded-full px-4 transition-all ${isOpen || value.trim() ? 'border border-primary shadow-[0_0_15px_rgba(19,236,91,0.2)]' : 'border border-transparent hover:border-input-border'
                }`}>
                <span className={`material-symbols-outlined transition-colors text-[20px] ${isOpen || value.trim() ? 'text-primary' : 'text-text-secondary'}`}>search</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-transparent border-none text-white placeholder-text-muted focus:ring-0 ml-3 text-sm h-full focus:outline-none font-medium truncate"
                    placeholder="Buscar tarefas, projetos..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                />

                {/* Clear Button (X) or Shortcut Badge */}
                <div className="flex items-center gap-2 shrink-0 pl-2">
                    {value !== '' ? (
                        <button
                            onClick={() => {
                                setValue('');
                                inputRef.current?.focus();
                            }}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-text-secondary hover:text-white text-[18px]">close</span>
                        </button>
                    ) : !loading && (
                        <kbd className="hidden sm:inline-flex items-center justify-center bg-background-dark border border-white/5 rounded-[4px] px-2 h-6 text-[10px] font-mono text-primary font-bold select-none">
                            {shortcutHint}
                        </kbd>
                    )}

                    {loading && (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full font-bold"></div>
                    )}
                </div>
            </div>

            {/* Dropdown - Solid Background, No Transparency */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-3 w-full bg-[#1a2c26] border border-primary/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[999] max-h-[500px] overflow-y-auto custom-scrollbar animate-scale-in">

                    {/* 1. Tasks Section (Priority) */}
                    {groupedResults.tasks.length > 0 && (
                        <div className="p-3">

                            {/* EXACT RESULTS BLOCK */}
                            {exactMatches.length > 0 && (
                                <div className="mb-2">
                                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                                        <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
                                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                            Tarefas Encontradas ({exactMatches.length})
                                        </p>
                                    </div>
                                    {exactMatches.map((result) => {
                                        // Find original index in strict-sorted groupedResults.tasks
                                        const originalIndex = groupedResults.tasks.indexOf(result);
                                        const isSelected = selectedIndex === getGlobalIndex('task', originalIndex);
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={result.action}
                                                className={`w-full text-left px-4 py-3.5 text-sm rounded-xl transition-all group mb-1 ${isSelected ? 'bg-primary/20 ring-1 ring-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="grid grid-cols-[50px_1fr_auto] items-center gap-4">
                                                    {/* ID # - Pure White contrast */}
                                                    <span className="font-mono font-bold text-white shrink-0 text-center">#{result.taskNumber}</span>

                                                    {/* Título - Pure White for maximum readability */}
                                                    <div className="min-w-0 flex flex-col gap-0.5">
                                                        <span className="font-bold text-white truncate text-[14px]">
                                                            {highlightSearchTerm(result.title, value, result.matchIndices)}
                                                        </span>
                                                        {result.projectName && (
                                                            <span className="text-[11px] text-gray-400 font-medium">
                                                                [{result.projectName}]
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* CLIENTE - High contrast text */}
                                                    {result.clientName && (
                                                        <div className="shrink-0 flex items-center">
                                                            <span className="px-2.5 py-1 bg-black/20 text-gray-300 text-[10px] rounded-md font-bold uppercase border border-white/10 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                                                {result.clientName}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* FUZZY SUGGESTIONS BLOCK */}
                            {fuzzyMatches.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                                        <span className="material-symbols-outlined text-amber-400 text-[20px]">lightbulb</span>
                                        <p className="text-xs font-bold text-amber-200/80 uppercase tracking-widest leading-relaxed">
                                            {exactMatches.length === 0
                                                ? `Não encontramos "${value.toUpperCase()}", mas veja estas sugestões:`
                                                : "Outras Sugestões Relacionadas:"
                                            }
                                        </p>
                                    </div>
                                    {fuzzyMatches.map((result) => {
                                        // Find original index in strict-sorted groupedResults.tasks
                                        const originalIndex = groupedResults.tasks.indexOf(result);
                                        const isSelected = selectedIndex === getGlobalIndex('task', originalIndex);
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={result.action}
                                                className={`w-full text-left px-4 py-3.5 text-sm rounded-xl transition-all group mb-1 opacity-80 hover:opacity-100 ${isSelected ? 'bg-primary/20 ring-1 ring-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.1)] opacity-100' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="grid grid-cols-[50px_1fr_auto] items-center gap-4">
                                                    {/* ID # - Pure White contrast */}
                                                    <span className="font-mono font-bold text-gray-500 shrink-0 text-center group-hover:text-white transition-colors">#{result.taskNumber}</span>

                                                    {/* Título - Pure White for maximum readability */}
                                                    <div className="min-w-0 flex flex-col gap-0.5">
                                                        <span className="font-bold text-gray-300 truncate text-[14px] group-hover:text-white transition-colors">
                                                            {highlightSearchTerm(result.title, value, result.matchIndices)}
                                                        </span>
                                                        {result.projectName && (
                                                            <span className="text-[11px] text-gray-500 font-medium group-hover:text-gray-400 transition-colors">
                                                                [{result.projectName}]
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* CLIENTE - High contrast text */}
                                                    {result.clientName && (
                                                        <div className="shrink-0 flex items-center">
                                                            <span className="px-2.5 py-1 bg-black/20 text-gray-400 text-[10px] rounded-md font-bold uppercase border border-white/5 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                                                {result.clientName}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. Suggestions Section (Zero-State) */}
                    {groupedResults.suggestions.length > 0 && groupedResults.tasks.length === 0 && (
                        <div className="p-3">
                            <div className="flex items-center gap-2 px-3 py-2 mb-1">
                                <span className="material-symbols-outlined text-yellow-500 text-[20px]">lightbulb</span>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Sugestões</p>
                            </div>
                            {groupedResults.suggestions.map((result, index) => {
                                const isSelected = selectedIndex === getGlobalIndex('suggestion', index);
                                return (
                                    <button
                                        key={result.id}
                                        onClick={result.action}
                                        className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all flex items-center gap-3 group mb-1 ${isSelected ? 'bg-primary/20 ring-1 ring-primary/40' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-[20px]">
                                            {result.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold text-white block truncate">{result.title}</span>
                                            {result.taskNumber && (
                                                <span className="text-[11px] text-gray-400 mt-0.5 block">Tarefa #{result.taskNumber} • {result.clientName}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 3. Quick Actions */}
                    {groupedResults.actions.length > 0 && (
                        <div className={`p-3 ${groupedResults.tasks.length > 0 || (groupedResults.suggestions.length > 0 && groupedResults.tasks.length === 0) ? 'border-t border-white/5 mt-1' : ''}`}>
                            <div className="flex items-center gap-2 px-3 py-2 mb-1">
                                <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Ações Rápidas</p>
                            </div>
                            {groupedResults.actions.map((result, index) => {
                                const isSelected = selectedIndex === getGlobalIndex('action', index);
                                return (
                                    <button
                                        key={result.id}
                                        onClick={result.action}
                                        className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all flex items-center gap-3 group mb-1 ${isSelected ? 'bg-primary/20 ring-1 ring-primary/40' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-primary text-[20px]">{result.icon}</span>
                                        <span className="font-bold text-white">{result.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {results.length === 0 && !loading && (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                                <span className="material-symbols-outlined text-4xl text-gray-500">search_off</span>
                            </div>
                            <p className="text-lg font-bold text-white mb-1">Nenhuma tarefa encontrada</p>
                            <p className="text-sm text-gray-400 leading-relaxed">Não encontramos nada para seu termo.<br />Tente um número de ID ou palavra-chave.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

